import { chmod, writeFile } from "fs/promises";
import { resolveFromRoot } from "../helpers";
import { CommandFactory } from "../types";

export const createSetupCommand: CommandFactory = (program) => {
	program
		.command({
			name: "setup",
			description: "Setup all project requirements on installation",
		})
		.task({
			label: "Installing pre-commit git hook ⚙️",
			handler() {
				return installGitHook(
					"pre-commit",
					// @todo: replace by npm? Use npm package to detect which-npm-runs?
					`yarn scripts verify $(git status --porcelain | awk 'BEGIN{ ORS=" " } { print $2 }')`
				);
			},
		})
		.task({
			label: "Installing commit-msg git hook ⚙️",
			handler() {
				return installGitHook("commit-msg", `echo "TODO"`);
			},
		});
};

const installGitHook = async (
	hook: "commit-msg" | "pre-commit",
	content: string
) => {
	const filename = resolveFromRoot(`.git/hooks/${hook}`);

	await writeFile(filename, content);

	return chmod(filename, "0755");
};
