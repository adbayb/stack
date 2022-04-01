import { chmod, writeFile } from "fs/promises";
import { resolveFromRoot, scripts } from "../helpers";
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
					`${scripts(
						`verify $(git status --porcelain | awk 'BEGIN{ ORS=" " } { print $2 }') --fix`
					)} && git add -A`
				);
			},
		})
		.task({
			label: "Installing commit-msg git hook ⚙️",
			handler() {
				return installGitHook(
					"commit-msg",
					`${scripts("verify --only commit")}`
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
