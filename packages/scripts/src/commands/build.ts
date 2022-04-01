import { helpers } from "termost";
import { execScripts } from "../helpers";
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
				return helpers.exec("quickbundle build", {
					hasLiveOutput: true,
				});
			},
		});
};
