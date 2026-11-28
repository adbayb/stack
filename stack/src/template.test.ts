import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { exec } from "termost";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { VERSION } from "./constants";
import { bumpStack, getTemplateChanges, migrateTemplate } from "./template";

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
				{ content: "b\n", hasConflict: false, path: "turbo.json" },
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

		test("should add new template files but not restore locally removed ones", async () => {
			const changes = await getChanges({
				base: { "examples/index.ts": "a\n" },
				next: { "examples/index.ts": "b\n", "tools/README.md": "tools\n" },
				project: {},
			});

			expect(changes).toStrictEqual([
				{ content: "tools\n", hasConflict: false, path: "tools/README.md" },
			]);
		});

		test("should remove files dropped by the template only without local edits", async () => {
			const changes = await getChanges({
				base: { "a.yml": "a\n", "b.yml": "b\n" },
				next: {},
				project: { "a.yml": "a\n", "b.yml": "local b\n" },
			});

			expect(changes).toStrictEqual([
				{ content: undefined, hasConflict: false, path: "a.yml" },
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
				{ content: "b\n", hasConflict: false, path: ".gitignore" },
				{ content: "owner/lib v2\n", hasConflict: false, path: "lib/package.json" },
			]);
		});
	});

	describe(bumpStack, () => {
		test("should not bump when the latest version is already installed", async () => {
			await writeProjectPackage(VERSION);
			vi.mocked(exec).mockResolvedValueOnce(VERSION);
			await expect(bumpStack()).resolves.toBeUndefined();
			expect(exec).toHaveBeenCalledExactlyOnceWith("pnpm view @adbayb/stack version");
		});

		test("should bump to the latest version and return the previous one", async () => {
			await writeProjectPackage(VERSION);
			vi.mocked(exec).mockResolvedValueOnce("99.0.0");
			await expect(bumpStack()).resolves.toBe(VERSION);

			expect(exec).toHaveBeenLastCalledWith(
				"pnpm add '@adbayb/stack@99.0.0' --save-dev --ignore-workspace-root-check",
				{ hasLiveOutput: true },
			);
		});
	});

	describe(migrateTemplate, () => {
		test("should skip without network access when the stack version is not pinned", async () => {
			await writeProjectPackage("workspace:*");
			await expect(migrateTemplate({ isDryRun: true })).resolves.toStrictEqual([]);
			expect(exec).not.toHaveBeenCalled();
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
