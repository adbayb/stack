import { chmod, writeFile } from "node:fs/promises";

import type { CommandFactory } from "../types";
import { getStackCommand, resolveFromProjectDirectory } from "../helpers";

export const createInstallCommand: CommandFactory = (program) => {
	program
		.command({
			name: "install",
			description: "Setup initial requirements",
		})
		.task({
			label: label("Installing `git.pre-commit` hook"),
			async handler() {
				await installGitHook(
					"pre-commit",
					`${getStackCommand(
						"fix $(git status --porcelain | awk 'BEGIN{ ORS=\" \" } { print $2 }')",
						false,
					)} && git add -A`,
				);
			},
		})
		.task({
			label: label("Installing `git.commit-msg` hook"),
			async handler() {
				await installGitHook(
					"commit-msg",
					`${getStackCommand("check --only commit", false)}`,
				);
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
