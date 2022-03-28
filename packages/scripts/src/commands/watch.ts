import { CommandFactory } from "@adbayb/scripts/src/types";
import { helpers } from "termost";
import { scripts } from "../helpers";

export const createWatchCommand: CommandFactory = (program) => {
	program
		.command({
			name: "watch",
			description: "Watch the project",
		})
		.task({
			handler() {
				return scripts("clean");
			},
		})
		.task({
			handler() {
				return helpers.exec("quickbundle watch", {
					hasLiveOutput: true,
				});
			},
		});
};
