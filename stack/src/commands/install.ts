import { existsSync } from "node:fs";
import { chmod, writeFile } from "node:fs/promises";
import { assert, createError, getStackCommand, resolveFromWorkingDirectory } from "../helpers";
import type { CommandFactory } from "../types";

/**
 * Install git hooks for the project.
 *
 * @param program - The termost program to register the command onto.
 */
export const createInstallCommand: CommandFactory = (program) => {
	program
		.command({
			name: "install",
			description: "Install required setup",
		})
		.task({
			label: label("Install `git.pre-commit` hook"),
			async handler() {
				await installGitHook("pre-commit", PRE_COMMIT_HOOK);
			},
		})
		.task({
			label: label("Install `git.commit-msg` hook"),
			async handler() {
				await installGitHook("commit-msg", getStackCommand("check --filter commit"));
			},
		});
};

const label = (message: string) => {
	return `${message} 📲`;
};

/*
 * Pass staged file names to `stack fix` as process arguments instead of interpolating a shell
 * command: file names may contain spaces or shell metacharacters. Skip the run when nothing is
 * staged, and stage formatter changes again before the commit proceeds.
 */
const PRE_COMMIT_HOOK = String.raw`node -e 'const { execFileSync } = require("node:child_process"); const files = execFileSync("git", ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR"], { encoding: "utf8" }).split("\0").filter(Boolean); if (files.length > 0) { execFileSync("pnpm", ["stack", "fix", ...files], { stdio: "inherit" }); }' && git add -A`;

const installGitHook = async (hook: "commit-msg" | "pre-commit", content: string) => {
	assert(existsSync(resolveFromWorkingDirectory(".git")), () => {
		return createError("stack install", "No `.git` directory found. Run `git init` first.");
	});

	const filename = resolveFromWorkingDirectory(`.git/hooks/${hook}`);

	await writeFile(filename, content);

	return chmod(filename, "0755");
};
