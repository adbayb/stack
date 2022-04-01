import { execQuickbundle, execScripts } from "../helpers";
import { CommandFactory } from "../types";

export const createBuildCommand: CommandFactory = (program) => {
	program
		.command({
			name: "build",
			description: "Build assets in production mode",
		})
		.task({
			handler() {
				return execScripts("clean");
			},
		})
		.task({
			handler() {
				return execQuickbundle("build");
			},
		});
};
