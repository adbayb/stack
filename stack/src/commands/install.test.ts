import { execFileSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createInstallCommand } from "./install";
import { createCommandHarness } from "./test-helpers";

const originalWorkingDirectory = process.cwd();
let workingDirectory: string;

describe(createInstallCommand, () => {
	beforeEach(async () => {
		workingDirectory = await mkdtemp(join(tmpdir(), "stack-install-"));
		process.chdir(workingDirectory);
	});

	afterEach(async () => {
		process.chdir(originalWorkingDirectory);
		await rm(workingDirectory, { force: true, recursive: true });
		vi.restoreAllMocks();
	});

	test("installs executable pre-commit and commit-msg hooks", async () => {
		await mkdir(".git/hooks", { recursive: true });
		await createCommandHarness(createInstallCommand)();

		await expect(readFile(".git/hooks/commit-msg", "utf8")).resolves.toBe(
			"pnpm stack check --filter commit",
		);

		const preCommit = await stat(".git/hooks/pre-commit");
		const commitMessage = await stat(".git/hooks/commit-msg");

		expect(preCommit.mode & 0o777).toBe(0o755);
		expect(commitMessage.mode & 0o777).toBe(0o755);
	});

	test("requires a Git repository before writing hooks", async () => {
		await expect(createCommandHarness(createInstallCommand)()).rejects.toThrow(
			"No `.git` directory found. Run `git init` first.",
		);
	});

	test.each([
		["no staged files", [], [["git", "add", "-A"]]],
		[
			"filenames containing spaces and shell syntax",
			["src/my file.ts", "src/$(touch injected).ts", "src/quote'file.ts"],
			[
				[
					"pnpm",
					"stack",
					"fix",
					"src/my file.ts",
					"src/$(touch injected).ts",
					"src/quote'file.ts",
				],
				["git", "add", "-A"],
			],
		],
	])("the pre-commit hook handles %s safely", async (_, files, expectedCalls) => {
		await mkdir(".git/hooks", { recursive: true });
		await createCommandHarness(createInstallCommand)();

		const environment = await createHookEnvironment(files);

		execFileSync("/bin/sh", [".git/hooks/pre-commit"], { env: environment });

		const calls = await readFile(environment.STACK_TEST_CALLS, "utf8");

		expect(
			calls
				.trim()
				.split("\n")
				.map((line): unknown => {
					return JSON.parse(line);
				}),
		).toStrictEqual(expectedCalls);
	});

	test("the pre-commit hook does not restage changes when fixing fails", async () => {
		await mkdir(".git/hooks", { recursive: true });
		await createCommandHarness(createInstallCommand)();

		const environment = await createHookEnvironment(["src/index.ts"]);

		expect(() => {
			execFileSync("/bin/sh", [".git/hooks/pre-commit"], {
				env: { ...environment, STACK_TEST_FIX_FAIL: "1" },
				stdio: "pipe",
			});
		}).toThrow("Command failed");

		const calls = await readFile(environment.STACK_TEST_CALLS, "utf8");

		expect(
			calls
				.trim()
				.split("\n")
				.map((line): unknown => {
					return JSON.parse(line);
				}),
		).toStrictEqual([["pnpm", "stack", "fix", "src/index.ts"]]);
	});
});

const createHookEnvironment = async (files: string[]) => {
	const binaries = join(workingDirectory, "bin");
	const callsPath = join(workingDirectory, "calls.jsonl");

	await mkdir(binaries);
	await symlink(process.execPath, join(binaries, "node"));
	await writeFile(callsPath, "");

	const gitPath = join(binaries, "git");
	const pnpmPath = join(binaries, "pnpm");

	await writeFile(
		gitPath,
		`#!${process.execPath}
const { appendFileSync } = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "diff") {
	process.stdout.write(JSON.parse(process.env.STACK_TEST_FILES).join("\\0"));
} else {
	appendFileSync(process.env.STACK_TEST_CALLS, JSON.stringify(["git", ...args]) + "\\n");
}
`,
	);

	await writeFile(
		pnpmPath,
		`#!${process.execPath}
const { appendFileSync } = require("node:fs");
appendFileSync(process.env.STACK_TEST_CALLS, JSON.stringify(["pnpm", ...process.argv.slice(2)]) + "\\n");
process.exitCode = process.env.STACK_TEST_FIX_FAIL === "1" ? 1 : 0;
`,
	);

	await chmod(gitPath, 0o755);
	await chmod(pnpmPath, 0o755);

	return {
		...process.env,
		PATH: `${binaries}${delimiter}${process.env.PATH ?? ""}`,
		STACK_TEST_CALLS: callsPath,
		STACK_TEST_FILES: JSON.stringify(files),
	};
};
