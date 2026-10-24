import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exec } from "termost";
import type { Termost } from "termost";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createCleanCommand, isPreservedPath } from "./clean";
import { createCommandHarness } from "./test-helpers";

vi.mock(import("termost"), async (importOriginal) => {
	const original = await importOriginal();

	return {
		...original,
		exec: vi.fn(),
	};
});

const originalWorkingDirectory = process.cwd();
let workingDirectory: string;
let outsideFile: string;

describe(createCleanCommand, () => {
	beforeEach(async () => {
		workingDirectory = await mkdtemp(join(tmpdir(), "stack-clean-"));

		const projectDirectory = join(workingDirectory, "project");

		await mkdir(projectDirectory);
		outsideFile = join(workingDirectory, "outside.txt");
		process.chdir(projectDirectory);
		vi.mocked(exec).mockReset();
	});

	afterEach(async () => {
		process.chdir(originalWorkingDirectory);
		await rm(workingDirectory, { force: true, recursive: true });
	});

	test("preserves installed dependencies and local environment files", () => {
		for (const path of [
			"node_modules",
			"node_modules/package",
			".env",
			".env.local",
			"src/.env.production",
		]) {
			expect(isPreservedPath(path), `${path} must be preserved`).toBe(true);
		}
	});

	test("removes generated files without preserving lookalikes", () => {
		for (const path of ["dist", "src/app.ts", "my.env", ".envrc"]) {
			expect(isPreservedPath(path), `${path} must remain removable`).toBe(false);
		}
	});

	test("removes ignored paths with spaces and leaves preserved paths untouched", async () => {
		await mkdir("node_modules/.cache", { recursive: true });
		await writeFile("generated assets.txt", "generated");
		await writeFile("node_modules/keep.txt", "dependency");
		await writeFile("node_modules/.cache/build.json", "{}");
		await writeFile(".env.local", "secret");

		vi.mocked(exec).mockResolvedValue(
			[
				"Would remove generated assets.txt",
				"Would remove node_modules/",
				"Would remove .env.local",
			].join("\n"),
		);

		const { tasks } = captureTasks(createCleanCommand);
		const filesOutput = await getHandler(tasks, 0)({}, commandArguments);
		const files = getStringArray(filesOutput);

		expect(files).toStrictEqual(["generated assets.txt", "node_modules/.cache"]);
		await getHandler(tasks, 1)({ files }, commandArguments);
		expect(existsSync("generated assets.txt")).toBe(false);
		expect(existsSync("node_modules/.cache")).toBe(false);
		expect(existsSync("node_modules/keep.txt")).toBe(true);
		expect(existsSync(".env.local")).toBe(true);
	});

	test("refuses to remove a path outside the working directory", async () => {
		await writeFile(outsideFile, "keep");

		const { tasks } = captureTasks(createCleanCommand);

		await expect(
			getHandler(tasks, 1)({ files: ["../outside.txt"] }, commandArguments),
		).rejects.toThrow("Refusing to remove a path outside the working directory");

		expect(existsSync(outsideFile)).toBe(true);
	});

	test("leaves an already clean project and its empty cache untouched", async () => {
		await mkdir("node_modules/.cache", { recursive: true });
		vi.mocked(exec).mockResolvedValue("");

		await expect(createCommandHarness(createCleanCommand)()).resolves.toMatchObject({
			files: [],
		});

		expect(existsSync("node_modules/.cache")).toBe(true);
	});

	test("refuses to remove the working directory itself", async () => {
		vi.mocked(exec).mockResolvedValue("Would remove .");

		await expect(createCommandHarness(createCleanCommand)()).rejects.toThrow(
			"Refusing to remove a path outside the working directory",
		);

		expect(existsSync(process.cwd())).toBe(true);
	});

	test("does not remove cached assets if retrieving ignored paths fails", async () => {
		await mkdir("node_modules/.cache", { recursive: true });
		await writeFile("node_modules/.cache/keep.txt", "keep");
		vi.mocked(exec).mockRejectedValue(new Error("Git unavailable"));
		await expect(createCommandHarness(createCleanCommand)()).rejects.toThrow("Git unavailable");
		expect(existsSync("node_modules/.cache/keep.txt")).toBe(true);
	});
});

type CommandArguments = {
	command: string;
	operands: string[];
	options: Record<string, boolean | number | string>;
};

const commandArguments: CommandArguments = {
	command: "clean",
	operands: [],
	options: {},
};

const captureTasks = (commandFactory: (program: Termost) => void) => {
	const tasks: unknown[] = [];

	const builder = {
		command() {
			return builder;
		},
		task(parameters: unknown) {
			tasks.push(parameters);

			return builder;
		},
	};

	// The fluent API's state-dependent generics do not fit this runtime-only capture stub.
	commandFactory(builder as unknown as Termost);

	return { tasks };
};

const getHandler = (tasks: unknown[], index: number) => {
	const registration = tasks[index] as {
		handler: (context: unknown, argv: CommandArguments) => unknown;
	};

	return registration.handler;
};

const getStringArray = (value: unknown): string[] => {
	if (
		!Array.isArray(value) ||
		!value.every((item) => {
			return typeof item === "string";
		})
	) {
		throw new TypeError("The clean command must return a list of paths.");
	}

	return value;
};
