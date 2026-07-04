import { chmod, writeFile } from "node:fs/promises";

import type { CommandFactory } from "../types";

import { getStackCommand, resolveFromWorkingDirectory } from "../helpers";

export const createInstallCommand: CommandFactory = (program) => {
	program
		.command({
			description: "Install required setup",
			name: "install",
		})
		.task({
			async handler() {
				const lineBreakMatcher = String.raw`\n|\r\n`;

				const stackCommand = getStackCommand(
					`fix $(node -e 'console.log(require("child_process").execSync("git status --porcelain", {encoding: "utf8"}).split(/${lineBreakMatcher}/).filter(Boolean).map(item => item.split(" ").at(-1)).join(" "))')`,
				);

				await installGitHook(
					"pre-commit",
					`${stackCommand} && git add -A`,
				);
			},
			label: label("Install `git.pre-commit` hook"),
		})
		.task({
			async handler() {
				await installGitHook(
					"commit-msg",
					getStackCommand("check --filter commit"),
				);
			},
			label: label("Install `git.commit-msg` hook"),
		});
};

const label = (message: string) => `${message} 📲`;

const installGitHook = async (
	hook: "commit-msg" | "pre-commit",
	content: string,
) => {
	const filename = resolveFromWorkingDirectory(`.git/hooks/${hook}`);

	await writeFile(filename, content);

	return chmod(filename, "0755");
};
