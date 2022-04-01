import { CommandFactory } from "@adbayb/scripts/src/types";
import { helpers } from "termost";
import { execScripts } from "../helpers";

export const createWatchCommand: CommandFactory = (program) => {
	program
		.command({
			name: "watch",
			description: "Watch and rebuild assets on any code change",
		})
		.task({
			handler() {
				return execScripts("clean");
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
