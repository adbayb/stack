import { chmod, writeFile } from "node:fs/promises";

import { getStackCommand, resolveFromProjectDirectory } from "../helpers";
import type { CommandFactory } from "../types";

export const createInstallCommand: CommandFactory = (program) => {
	program
		.command({
			name: "install",
			description: "Setup initial requirements",
		})
		.task({
			label: label("Installing `git.pre-commit` hook"),
			handler() {
				return installGitHook(
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
			handler() {
				return installGitHook(
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
