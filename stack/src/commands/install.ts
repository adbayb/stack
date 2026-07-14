import { chmod, writeFile } from "node:fs/promises";
import { getStackCommand, resolveFromWorkingDirectory } from "../helpers";
import type { CommandFactory } from "../types";

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

				const stackCommand = getStackCommand(
					`fix $(node -e 'console.log(require("child_process").execSync("git status --porcelain", {encoding: "utf8"}).split(/${lineBreakMatcher}/).filter(Boolean).map(item => item.split(" ").at(-1)).join(" "))')`,
				);

				await installGitHook("pre-commit", `${stackCommand} && git add -A`);
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

const installGitHook = async (hook: "commit-msg" | "pre-commit", content: string) => {
	const filename = resolveFromWorkingDirectory(`.git/hooks/${hook}`);

	await writeFile(filename, content);

	return chmod(filename, "0755");
};
