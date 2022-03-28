import { helpers } from "termost";
import { scripts } from "../helpers";
import { CommandFactory } from "../types";

export const createBuildCommand: CommandFactory = (program) => {
	program
		.command({
			name: "build",
			description: "Build the project in production mode",
		})
		.task({
			handler() {
				return scripts("clean");
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
