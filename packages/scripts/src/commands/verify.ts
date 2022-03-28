import { helpers } from "termost";
import { CommandFactory } from "../types";
import { lint } from "../helpers";

export const createVerifyCommand: CommandFactory = (program) => {
	program
		.command({
			name: "verify",
			description: "Verify the project",
		})
		.task({
			label: "Checking lint rules 🧐",
			handler() {
				return lint();
			},
		})
		.task({
			label: "Checking types 🧐",
			skip() {
				return !require.resolve("typescript");
			},
			handler() {
				return type();
			},
		});
};

const type = () => {
	return helpers.exec(`tsc --noEmit`, { hasLiveOutput: true });
};
