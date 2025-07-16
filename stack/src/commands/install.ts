import { chmod, writeFile } from "node:fs/promises";

import type { CommandFactory } from "../types";
import {
	checkPackageManager,
	getStackCommand,
	resolveFromProjectDirectory,
} from "../helpers";

export const createInstallCommand: CommandFactory = (program) => {
	program
		.command({
			name: "install",
			description: "Install required setup",
		})
		.task({
			label: label("Install `git.pre-commit` hook"),
			async handler() {
				const lineBreakMatcher = String.raw`\n|\r\n`;
				const modifiedFilesCommand = `node -e 'console.log(require("child_process").execSync("git status --porcelain", {encoding: "utf8"}).split(/${lineBreakMatcher}/).filter(Boolean).map(item => item.split(" ").at(-1)).join(" "))'`;

				await installGitHook(
					"pre-commit",
					`${getStackCommand(
						`fix $(${modifiedFilesCommand})`,
						false,
					)} && git add -A`,
				);
			},
		})
		.task({
			label: label("Install `git.commit-msg` hook"),
			async handler() {
				await installGitHook(
					"commit-msg",
					getStackCommand("check --filter commit", false),
				);
			},
		})
		.task({
			label: label("Check the package manager"),
			async handler() {
				await checkPackageManager();
			},
		});
};

const label = (message: string) => `${message} 📲`;

const installGitHook = async (
	hook: "commit-msg" | "pre-commit",
	content: string,
) => {
	const filename = resolveFromProjectDirectory(`.git/hooks/${hook}`);

	await writeFile(filename, content);

	return chmod(filename, "0755");
};
