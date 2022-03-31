import { helpers } from "termost";
import { scripts } from "../helpers";
import { CommandFactory } from "../types";

export const createReleaseCommand: CommandFactory = (program) => {
	program
		.command({
			name: "release",
			description: "Release a new version",
		})
		.task({
			handler() {
				return scripts("verify");
			},
		})
		.task({
			handler() {
				return scripts("build");
			},
		})
		.task({
			handler() {
				helpers.message("TODO semantic-release or whatever");
			},
		});
};
