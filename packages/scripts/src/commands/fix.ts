import { CommandFactory } from "../types";
import { lint } from "../helpers";

export const createFixCommand: CommandFactory = (program) => {
	program
		.command({
			name: "fix",
			description: "Fix the project",
		})
		.task({
			label: "Fixing lint rules 🚑",
			handler() {
				return lint("--fix");
			},
		});
};
