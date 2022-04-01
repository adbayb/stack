import { chmod, writeFile } from "fs/promises";
import { resolveFromRoot } from "../helpers";
import { CommandFactory } from "../types";

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
					// @note: npx is used since it's the NodeJS built-in package exec tool
					// `--no` flag to prevent installation prompt and throw an error if the binary is not installed
					`npx --no @adbayb/scripts verify $(git status --porcelain | awk 'BEGIN{ ORS=" " } { print $2 }') --fix && git add -A`
				);
			},
		})
		.task({
			label: "Installing commit-msg git hook ⚙️",
			handler() {
				return installGitHook(
					"commit-msg",
					"npx --no @adbayb/scripts verify --only commit"
				);
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
