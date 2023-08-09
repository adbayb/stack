import { chmod, writeFile } from "node:fs/promises";

import { getStackCommand, resolveFromRootDir } from "../helpers";
import type { CommandFactory } from "../types";

export const createInstallCommand: CommandFactory = (program) => {
	program
		.command({
			name: "install",
			description: "Setup all requirements",
		})
		.task({
			label: "Installing pre-commit git hook ⚙️",
			handler() {
				return installGitHook(
					"pre-commit",
					`${getStackCommand(
						`check $(git status --porcelain | awk 'BEGIN{ ORS=" " } { print $2 }') --fix`,
						false,
					)} && git add -A`,
				);
			},
		})
		.task({
			label: "Installing commit-msg git hook ⚙️",
			handler() {
				return installGitHook(
					"commit-msg",
					`${getStackCommand("check --only commit", false)}`,
				);
			},
		});
};

const installGitHook = async (
	hook: "commit-msg" | "pre-commit",
	content: string,
) => {
	const filename = await resolveFromRootDir(`.git/hooks/${hook}`);

	await writeFile(filename, content);

	return chmod(filename, "0755");
};
