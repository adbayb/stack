import { helpers } from "termost";
import { execScripts } from "../helpers";
import { CommandFactory } from "../types";

export const createReleaseCommand: CommandFactory = (program) => {
	program
		.command({
			name: "release",
			description: "Release a new version",
		})
		.task({
			handler() {
				return execScripts("verify");
			},
		})
		.task({
			handler() {
				return execScripts("build");
			},
		})
		.task({
			handler() {
				helpers.message("TODO semantic-release or whatever");
			},
		});
};
