import { resolve } from "path";
import { helpers } from "termost";
import { CommandFactory } from "../types";

type SetupContext = {
	gitDir: string;
};

export const createSetupCommand: CommandFactory = (program) => {
	program
		.command<SetupContext>({
			name: "setup",
			description: "Setup all project requirements on installation",
		})
		.task({
			key: "gitDir",
			label: "Finding git root dir ⚙️",
			async handler() {
				try {
					const rootDir = await helpers.exec(
						"git rev-parse --show-toplevel"
					);

					return resolve(rootDir, ".git");
				} catch (error) {
					throw new Error(
						`\`git\` failed:\nThe root repository must be a git project. Have you tried to run \`git init\`?\n${error}`
					);
				}
			},
		})
		.task({
			label: "Installing pre-commit git hook ⚙️",
			handler(context) {
				// echo '{"*": "scripts verify"}' | ../../node_modules/.bin/lint-staged --config - // inside gitDir/hooks/pre-commit
				// commitlint inside gitDir/hooks/commit-msg
				helpers.message(context.gitDir);
			},
		});
};
