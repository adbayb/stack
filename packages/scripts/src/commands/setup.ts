import { helpers } from "termost";
import { resolveFromRoot } from "../helpers";
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
			handler() {
				return resolveFromRoot(".git");
			},
		})
		.task({
			label: "Installing pre-commit git hook ⚙️",
			handler(context) {
				// echo '{"*": "scripts verify"}' | ./node_modules/.bin/lint-staged --config - // inside gitDir/hooks/pre-commit
				// commitlint inside gitDir/hooks/commit-msg
				helpers.message(context.gitDir);
			},
		});
};
