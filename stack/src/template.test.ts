import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { exec } from "termost";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { VERSION } from "./constants";
import { resolveFromPackageDirectory } from "./helpers";
import {
	TemplateSourceError,
	bumpStack,
	getPendingTemplateChanges,
	getRepositoryId,
	getTemplateChanges,
	migrateTemplate,
} from "./template";

vi.mock(import("termost"), async (importOriginal) => {
	const original = await importOriginal();

	return { ...original, exec: vi.fn() };
});

const originalWorkingDirectory = process.cwd();
let directory: string;

describe("template", () => {
	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), "stack-template-"));
		process.chdir(await createDirectory("project"));
		vi.mocked(exec).mockReset().mockResolvedValue("");
	});

	afterEach(async () => {
		process.chdir(originalWorkingDirectory);
		await rm(directory, { force: true, recursive: true });
	});

	describe(getTemplateChanges, () => {
		test("should apply template changes to files without local edits", async () => {
			const changes = await getChanges({
				base: { "turbo.json": "a\n" },
				next: { "turbo.json": "b\n" },
				project: { "turbo.json": "a\n" },
			});

			expect(changes).toStrictEqual([
				{ content: "b\n", hasConflict: false, path: "turbo.json", type: "update" },
			]);
		});

		test("should keep local edits while merging non-overlapping template changes", async () => {
			const changes = await getChanges({
				base: { "AGENTS.md": "intro\n\nshared\n\nrules\n" },
				next: { "AGENTS.md": "intro\n\nshared\n\nnew rules\n" },
				project: { "AGENTS.md": "local intro\n\nshared\n\nrules\n" },
			});

			expect(changes).toStrictEqual([
				{
					content: "local intro\n\nshared\n\nnew rules\n",
					hasConflict: false,
					path: "AGENTS.md",
					type: "merge",
				},
			]);
		});

		test("should skip template changes the project already holds", async () => {
			const changes = await getChanges({
				base: { "pnpm-workspace.yaml": "a\n\nb\n" },
				next: { "pnpm-workspace.yaml": "a\n\nb\nc\n" },
				project: { "pnpm-workspace.yaml": "local a\n\nb\nc\n" },
			});

			expect(changes).toStrictEqual([]);
		});

		test("should flag overlapping edits with conflict markers", async () => {
			const [change] = await getChanges({
				base: { "turbo.json": "a\n" },
				next: { "turbo.json": "b\n" },
				project: { "turbo.json": "c\n" },
			});

			expect(change?.hasConflict).toBe(true);
			expect(change?.content).toMatch(/^<{7} turbo\.json\nc\n={7}\nb\n>{7} /u);
		});

		test("should narrow the conflict of a new template file colliding with a local one", async () => {
			const [change] = await getChanges({
				base: {},
				next: { "settings.json": "{\n\ta,\n\tnext,\n\tc\n}\n" },
				project: { "settings.json": "{\n\ta,\n\tlocal,\n\tc\n}\n" },
			});

			expect(change?.hasConflict).toBe(true);
			expect(change?.content).toMatch(/^\{\n\ta,\n<{7} settings\.json\n\tlocal,\n={7}\n/u);
		});

		test("should fail instead of overwriting a file that cannot be merged", async () => {
			await expect(
				getChanges({
					base: { "image.bin": "a\n" },
					next: { "image.bin": "b\n" },
					project: { "image.bin": "\0binary" },
				}),
			).rejects.toThrow("Cannot merge binary files");
		});

		test("should add new template files but not restore locally removed ones", async () => {
			const changes = await getChanges({
				base: { "examples/index.ts": "a\n" },
				next: { "examples/index.ts": "b\n", "tools/README.md": "tools\n" },
				project: {},
			});

			expect(changes).toStrictEqual([
				{ content: "tools\n", hasConflict: false, path: "tools/README.md", type: "add" },
			]);
		});

		test("should remove files dropped by the template only without local edits", async () => {
			const changes = await getChanges({
				base: { "a.yml": "a\n", "b.yml": "b\n" },
				next: {},
				project: { "a.yml": "a\n", "b.yml": "local b\n" },
			});

			expect(changes).toStrictEqual([
				{ content: undefined, hasConflict: false, path: "a.yml", type: "remove" },
			]);
		});

		test("should render template variables and published file names", async () => {
			const changes = await getChanges({
				base: { ".gitignore.tmpl": "a\n", "{{projectName}}/package.json": "{{repoId}}\n" },
				next: {
					".gitignore.tmpl": "b\n",
					"{{projectName}}/package.json": "{{repoId}} v2\n",
				},
				project: { ".gitignore": "a\n", "lib/package.json": "owner/lib\n" },
			});

			expect(changes).toStrictEqual([
				{ content: "b\n", hasConflict: false, path: ".gitignore", type: "update" },
				{
					content: "owner/lib v2\n",
					hasConflict: false,
					path: "lib/package.json",
					type: "update",
				},
			]);
		});
	});

	describe(getRepositoryId, () => {
		test.each([
			["git@github.com:owner/repo.git", "owner/repo"],
			["git@github.com:owner/repo", "owner/repo"],
			["github-work:owner/repo.git", "owner/repo"],
			["ssh://git@github.com/owner/repo.git", "owner/repo"],
			["https://github.com/owner/repo.git", "owner/repo"],
			["https://github.com/owner/repo", "owner/repo"],
			["https://gitlab.com/group/owner/repo/", "owner/repo"],
			["https://github.com/repo", undefined],
			["repo", undefined],
		])("should parse %s", (url, repoId) => {
			expect(getRepositoryId(url)).toBe(repoId);
		});
	});

	describe(bumpStack, () => {
		test("should not bump when the latest version is already installed", async () => {
			await writeProjectPackage(VERSION);
			vi.mocked(exec).mockResolvedValueOnce(VERSION);
			await expect(bumpStack()).resolves.toBeUndefined();
			expect(exec).toHaveBeenCalledExactlyOnceWith("pnpm view @adbayb/stack version");
		});

		test("should bump to the latest version and return the pinned one", async () => {
			await writeProjectPackage("1.0.0");
			vi.mocked(exec).mockResolvedValueOnce("99.0.0");
			await expect(bumpStack()).resolves.toBe("1.0.0");

			expect(exec).toHaveBeenLastCalledWith(
				"pnpm add '@adbayb/stack@99.0.0' --save-dev --ignore-workspace-root-check",
				{ hasLiveOutput: true },
			);
		});

		test("should bump a prerelease to its release", async () => {
			await writeProjectPackage("99.0.0-next.1");
			vi.mocked(exec).mockResolvedValueOnce("99.0.0");
			await expect(bumpStack()).resolves.toBe("99.0.0-next.1");
		});

		test("should not downgrade a prerelease newer than the latest version", async () => {
			await writeProjectPackage("99.1.0-next.0");
			vi.mocked(exec).mockResolvedValueOnce("99.0.0");
			await expect(bumpStack()).resolves.toBeUndefined();
			expect(exec).toHaveBeenCalledExactlyOnceWith("pnpm view @adbayb/stack version");
		});
	});

	describe(migrateTemplate, () => {
		test("should skip without network access when the stack version is not pinned", async () => {
			await writeProjectPackage("workspace:*");
			await expect(migrateTemplate({ isDryRun: true })).resolves.toStrictEqual([]);
			expect(exec).not.toHaveBeenCalled();
		});

		test("should refuse to run from another version than the pinned one", async () => {
			await writeProjectPackage("0.0.1");

			await expect(migrateTemplate({ isDryRun: true })).rejects.toThrow(
				`The running \`@adbayb/stack@${VERSION}\` differs from the project's pinned \`0.0.1\``,
			);
		});

		test("should skip when the default branch already uses the installed version", async () => {
			await writeProjectPackage(VERSION);

			vi.mocked(exec)
				.mockResolvedValueOnce("true")
				.mockResolvedValueOnce("")
				.mockResolvedValueOnce(
					JSON.stringify({ devDependencies: { "@adbayb/stack": VERSION } }),
				);

			await expect(migrateTemplate({ isDryRun: true })).resolves.toStrictEqual([]);
			expect(exec).toHaveBeenCalledWith("git fetch --no-tags --depth=1 origin HEAD");
		});

		test("should report unreachable template sources", async () => {
			await writeProjectPackage(VERSION);
			vi.mocked(exec).mockRejectedValueOnce(new Error("no origin"));

			await expect(migrateTemplate({ isDryRun: true })).rejects.toBeInstanceOf(
				TemplateSourceError,
			);
		});

		test("should render templates with the variables the project was created with", async () => {
			await writeProject({
				"LICENSE": "Copyright (c) 2024 old\n",
				"my-lib/README.md": "my-lib: My lib\n",
			});

			mockTemplateSources({
				"LICENSE": "Copyright (c) {{licenseYear}} old\n",
				"{{projectName}}/README.md": "{{projectName}}: {{projectDescription}}\n",
			});

			const changes = await migrateTemplate({ fromVersion: "0.0.1", isDryRun: true });

			expect(
				changes.map(({ path, type }) => {
					return { path, type };
				}),
			).toStrictEqual([
				{ path: "LICENSE", type: "update" },
				{ path: "my-lib/README.md", type: "update" },
			]);

			expect(changes[0]?.content).toContain("Copyright (c) 2024 ");
			expect(changes[1]?.content).toContain("My lib");
			expect(changes[1]?.content).toContain("owner/repo");
			expect(changes[1]?.content).not.toMatch(/\{\{\w+\}\}/u);
		});

		test("should require the root README symlink to locate the project folder", async () => {
			await writeProjectPackage(VERSION);
			await writeFile("README.md", "not a symlink");
			mockTemplateSources({});

			await expect(migrateTemplate({ fromVersion: "0.0.1", isDryRun: true })).rejects.toThrow(
				"The root `README.md` must be a symlink",
			);
		});
	});

	describe(getPendingTemplateChanges, () => {
		test("should only report unmigrated and conflicted files", async () => {
			await writeProject({
				"AGENTS.md": "declined template change\n",
				"CONTRIBUTING.md": `<<<<<<< CONTRIBUTING.md\nlocal\n=======\nnext\n>>>>>>> @adbayb/stack@${VERSION} template\n`,
				"LICENSE": "Copyright (c) 2024 old\n",
				"my-lib/README.md": "readme\n",
			});

			mockTemplateSources({
				"AGENTS.md": "old agents\n",
				"CONTRIBUTING.md": "old contributing\n",
				"LICENSE": "Copyright (c) {{licenseYear}} old\n",
			});

			const changes = await getPendingTemplateChanges();

			expect(
				changes.map(({ path }) => {
					return path;
				}),
			).toStrictEqual(["CONTRIBUTING.md", "LICENSE"]);
		});
	});
});

type Files = Record<string, string>;

const getChanges = async ({ base, next, project }: Record<"base" | "next" | "project", Files>) => {
	await writeFiles(process.cwd(), project);

	return getTemplateChanges(
		await writeFiles(await createDirectory("base"), base),
		await writeFiles(await createDirectory("next"), next),
		{ projectName: "lib", repoId: "owner/lib" },
	);
};

/**
 * Mock the git remote and the npm registry: the base template is the shipped single-project
 * template with the given files overridden, at version `0.0.1` on the default branch.
 *
 * @param baseOverrides - The base template files differing from the shipped template.
 */
const mockTemplateSources = (baseOverrides: Files) => {
	vi.mocked(exec).mockImplementation(async (command, options) => {
		if (command === "git remote get-url origin") {
			return "git@github.com:owner/repo.git";
		}

		if (command === "git show FETCH_HEAD:package.json") {
			return JSON.stringify({ devDependencies: { "@adbayb/stack": "0.0.1" } });
		}

		if (command.startsWith("tar ") && options?.cwd) {
			const basePath = join(options.cwd, "package", "templates", "single-project");

			await cp(resolveFromPackageDirectory("templates", "single-project"), basePath, {
				recursive: true,
			});

			await writeFiles(basePath, baseOverrides);
		}

		return "";
	});
};

const writeProject = async (files: Files) => {
	await writeFile(
		"package.json",
		JSON.stringify({
			devDependencies: { "@adbayb/stack": VERSION },
			devEngines: { packageManager: { version: "12.0.0" }, runtime: { version: "26.0.0" } },
		}),
	);

	await writeFiles(process.cwd(), {
		"my-lib/package.json": JSON.stringify({ description: "My lib" }),
		...files,
	});

	await symlink(join("my-lib", "README.md"), "README.md");
};

const createDirectory = async (name: string) => {
	const path = join(directory, name);

	if (!existsSync(path)) {
		await mkdir(path);
	}

	return path;
};

const writeFiles = async (root: string, files: Files) => {
	for (const [path, content] of Object.entries(files)) {
		await mkdir(dirname(join(root, path)), { recursive: true });
		await writeFile(join(root, path), content);
	}

	return root;
};

const writeProjectPackage = async (version: string) => {
	await writeFile(
		"package.json",
		JSON.stringify({ devDependencies: { "@adbayb/stack": version } }),
	);
};
