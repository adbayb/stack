import { chmod, writeFile } from "node:fs/promises";
import { resolveFromRootDir } from "@internal/helpers";

import { getScripts } from "../helpers";
import type { CommandFactory } from "../types";

export const createSetupCommand: CommandFactory = (program) => {
	program
		.command({
			name: "setup",
			description: "Setup all requirements",
		})
		.task({
			label: "Installing pre-commit git hook ⚙️",
			handler() {
				return installGitHook(
					"pre-commit",
					`${getScripts(
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
					`${getScripts("check --only commit", false)}`,
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
