import { mkdir, mkdtemp, readFile, readlink, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { exec } from "termost";
import type { Termost } from "termost";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createCreateCommand } from "./create";
import { createCommandHarness } from "./test-helpers";

vi.mock(import("termost"), async (importOriginal) => {
	const original = await importOriginal();

	return { ...original, exec: vi.fn() };
});

const originalWorkingDirectory = process.cwd();
let workingDirectory: string;

describe(createCreateCommand, () => {
	beforeEach(async () => {
		workingDirectory = await mkdtemp(join(tmpdir(), "stack-create-"));
		process.chdir(workingDirectory);
		vi.mocked(exec).mockReset().mockResolvedValue("");
	});

	afterEach(async () => {
		process.chdir(originalWorkingDirectory);
		await rm(workingDirectory, { force: true, recursive: true });
		vi.unstubAllGlobals();
	});

	test.each(["single-project", "multi-projects"])(
		"scaffolds the shipped %s template and completes setup in order",
		async (inputTemplate) => {
			stubVersionRequests();

			await createCommandHarness(createCreateCommand)({
				canRemoveExistingDirectoryInput: false,
				inputDescription: "A sample application",
				inputName: "Sample app",
				inputTemplate,
				inputUrl: "git@github.com:example/project.git",
			});

			await expect(readFile("README.md", "utf8")).resolves.toContain("sample-app");

			expect(
				vi.mocked(exec).mock.calls.map(([command]) => {
					return command;
				}),
			).toStrictEqual([
				"pnpm -v",
				"git init",
				"git remote add origin 'git@github.com:example/project.git'",
				"pnx corepack enable",
				"pnpm add @adbayb/stack --save-dev --ignore-workspace-root-check",
				"pnpm add quickbundle vitest --save-dev --filter sample-app",
				"pnpm install",
				"stack install",
				"git add -A",
				'git commit -m "chore: initial commit"',
			]);
		},
	);

	test("stops before prompting or fetching when pnpm is unavailable", async () => {
		const fetchMock = vi.fn();

		vi.stubGlobal("fetch", fetchMock);
		vi.mocked(exec).mockRejectedValueOnce(new Error("not installed"));

		await expect(createCommandHarness(createCreateCommand)()).rejects.toThrow(
			"The project must use `pnpm`",
		);

		expect(fetchMock).not.toHaveBeenCalled();
		expect(exec).toHaveBeenCalledExactlyOnceWith("pnpm -v");
	});

	test("does not install hooks or commit after dependency installation fails", async () => {
		stubVersionRequests();

		vi.mocked(exec)
			.mockResolvedValueOnce("")
			.mockResolvedValueOnce("")
			.mockResolvedValueOnce("")
			.mockResolvedValueOnce("")
			.mockRejectedValueOnce(new Error("registry unavailable"));

		await expect(
			createCommandHarness(createCreateCommand)({
				canRemoveExistingDirectoryInput: false,
				inputDescription: "A project",
				inputName: "Sample app",
				inputTemplate: "single-project",
				inputUrl: "git@github.com:example/project.git",
			}),
		).rejects.toThrow("`pnpm` command failed.\nError: registry unavailable");

		expect(exec).not.toHaveBeenCalledWith("stack install");
		expect(exec).not.toHaveBeenCalledWith("git add -A");
		expect(exec).toHaveBeenCalledTimes(5);
	});

	test.each([
		["not-a-version", { version: "10.5.0" }, "Cannot resolve a major version"],
		["v24.1.0", {}, "The pnpm version cannot be resolved remotely"],
	])(
		"rejects unusable remotely resolved versions %s",
		async (nodeVersion, pnpmManifest, message) => {
			vi.stubGlobal(
				"fetch",
				vi
					.fn()
					.mockResolvedValueOnce(new Response(nodeVersion))
					.mockResolvedValueOnce(Response.json(pnpmManifest)),
			);

			await expect(
				createCommandHarness(createCreateCommand)({
					canRemoveExistingDirectoryInput: false,
					inputDescription: "A project",
					inputName: "Sample app",
					inputTemplate: "single-project",
					inputUrl: "git@github.com:example/project.git",
				}),
			).rejects.toThrow(message);

			expect(exec).toHaveBeenCalledExactlyOnceWith("pnpm -v");
		},
	);

	test("reports a failed version request without starting project setup", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));

		await expect(
			createCommandHarness(createCreateCommand)({
				inputDescription: "A project",
				inputName: "Sample app",
				inputTemplate: "single-project",
				inputUrl: "git@github.com:example/project.git",
			}),
		).rejects.toThrow("Failed to fetch resources");

		expect(exec).toHaveBeenCalledExactlyOnceWith("pnpm -v");
	});

	test("does not overwrite an existing project when replacement is declined", async () => {
		stubVersionRequests();
		await mkdir("sample-app");
		await writeFile("sample-app/existing.txt", "keep");

		await expect(
			createCommandHarness(createCreateCommand)({
				canRemoveExistingDirectoryInput: false,
				inputDescription: "A project",
				inputName: "Sample app",
				inputTemplate: "single-project",
				inputUrl: "git@github.com:example/project.git",
			}),
		).rejects.toThrow("Remove or rename the `sample-app` existing directory");

		await expect(readFile("sample-app/existing.txt", "utf8")).resolves.toBe("keep");
		expect(exec).toHaveBeenCalledExactlyOnceWith("pnpm -v");
	});

	test.each([
		["ssh", "git@github.com:example/project.git", "example/project"],
		["https", "https://github.com/example/project.git", "example/project"],
	])("normalizes project input and extracts a %s repository", async (_, inputUrl, repoId) => {
		stubVersionRequests();

		const { tasks } = captureCommand();

		const data = await getHandler(tasks, 1)(
			{
				inputDescription: "a useful tool",
				inputName: "My Cool Project",
				inputTemplate: "single-project",
				inputUrl,
			},
			commandArguments,
		);

		expect(data).toMatchObject({
			nodeVersion: "^24.0.0",
			pnpmVersion: "^10.0.0",
			projectDescription: "A useful tool",
			projectName: "my-cool-project",
			projectUrl: inputUrl,
			repoId,
			workingPath: resolve(process.cwd(), "my-cool-project"),
		});
	});

	test("rejects a remote URL without an owner and repository", async () => {
		const fetchMock = vi.fn();

		vi.stubGlobal("fetch", fetchMock);

		const { tasks } = captureCommand();

		await expect(
			getHandler(tasks, 1)(
				{
					inputDescription: "A project",
					inputName: "Project",
					inputTemplate: "single-project",
					inputUrl: "https://github.com/example/project",
				},
				commandArguments,
			),
		).rejects.toThrow("The owner and repository name cannot be extracted");

		expect(fetchMock).not.toHaveBeenCalled();
	});

	test.each([
		["", "The project name is not optional"],
		["!!!", "The project name must contain at least one letter or digit"],
	])("rejects an unusable project name %j", async (inputName, message) => {
		stubVersionRequests();

		const { tasks } = captureCommand();

		await expect(
			getHandler(tasks, 1)(
				{
					inputDescription: "A project",
					inputName,
					inputTemplate: "single-project",
					inputUrl: "git@github.com:example/project.git",
				},
				commandArguments,
			),
		).rejects.toThrow(message);
	});

	test.each([
		["single-project", "{{projectName}}", "sample-app"],
		["multi-projects", "libraries/{{projectName}}", join("libraries", "sample-app")],
	] as const)(
		"renames template paths and creates the %s README symlink",
		async (templateName, projectPath, generatedProjectPath) => {
			const templatePath = join(workingDirectory, "template");
			const templateProjectPath = join(templatePath, projectPath);

			await mkdir(join(templateProjectPath, "src"), { recursive: true });
			await writeFile(join(templateProjectPath, "README.md"), "Generated README");

			await writeFile(
				join(templateProjectPath, "src", "{{projectName}}.txt"),
				"{{projectName}}:{{projectDescription}}",
			);

			await writeFile(join(templatePath, ".gitignore.tmpl"), "dist\n");

			const { tasks } = captureCommand();

			const engineOutput = await getHandler(tasks, 2)(
				{
					canRemoveExistingDirectoryInput: false,
					data: {
						licenseYear: "2026",
						nodeVersion: "^24.0.0",
						pnpmVersion: "^10.0.0",
						projectDescription: "Sample project",
						projectName: "sample-app",
						projectUrl: "git@github.com:example/project.git",
						repoId: "example/project",
						templatePath,
						workingPath: join(workingDirectory, "output"),
					},
					inputTemplate: templateName,
				},
				commandArguments,
			);

			const engine = requireTemplateEngine(engineOutput);

			await getHandler(tasks, 3)({ templateEngine: engine }, commandArguments);

			await expect(
				readFile(join(generatedProjectPath, "src", "sample-app.txt"), "utf8"),
			).resolves.toBe("sample-app:Sample project");

			await expect(readlink("README.md")).resolves.toBe(
				join(generatedProjectPath, "README.md"),
			);

			await expect(readFile("README.md", "utf8")).resolves.toBe("Generated README");
			await expect(readFile(".gitignore", "utf8")).resolves.toBe("dist\n");
		},
	);
});

type CommandArguments = {
	command: string;
	operands: string[];
	options: Record<string, boolean | number | string>;
};

type TemplateEngine = {
	processContents: () => Promise<void>;
	processPaths: () => Promise<void>;
};

const commandArguments: CommandArguments = {
	command: "create",
	operands: [],
	options: {},
};

const captureCommand = () => {
	const tasks: unknown[] = [];

	const builder = {
		command() {
			return builder;
		},
		input() {
			return builder;
		},
		task(parameters: unknown) {
			tasks.push(parameters);

			return builder;
		},
	};

	// The fluent API's state-dependent generics do not fit this runtime-only capture stub.
	createCreateCommand(builder as unknown as Termost);

	return { tasks };
};

const getHandler = (tasks: unknown[], index: number) => {
	const registration = tasks[index] as {
		handler: (context: unknown, argv: CommandArguments) => unknown;
	};

	return registration.handler;
};

const requireTemplateEngine = (value: unknown): TemplateEngine => {
	if (!isTemplateEngine(value)) {
		throw new TypeError("The create command must return a template engine.");
	}

	return value;
};

const isTemplateEngine = (value: unknown): value is TemplateEngine => {
	return (
		typeof value === "object" &&
		value !== null &&
		"processContents" in value &&
		typeof value.processContents === "function" &&
		"processPaths" in value &&
		typeof value.processPaths === "function"
	);
};

const stubVersionRequests = () => {
	vi.stubGlobal(
		"fetch",
		vi
			.fn()
			.mockResolvedValueOnce(new Response("v24.1.0"))
			.mockResolvedValueOnce(Response.json({ version: "10.5.0" })),
	);
};
