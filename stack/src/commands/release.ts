import { helpers } from "termost";
import { changeset } from "../helpers";
import type { CommandFactory } from "../types";

type CommandContext = {
	emptyLog: boolean;
	increment: boolean;
	log: boolean;
	publish: boolean;
};

export const createReleaseCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "release",
			description: "Log, version, and publish package(s)",
		})
		.option({
			key: "log",
			name: "log",
			description: "Add a new changelog entry",
		})
		.option({
			key: "emptyLog",
			name: "empty-log",
			description: "Add an empty changelog entry",
		})
		.option({
			key: "increment",
			name: "increment",
			description: "Bump the package(s) version",
		})
		.option({
			key: "publish",
			name: "publish",
			description: "Publish package(s) to the registry",
		})
		.task({
			async handler() {
				helpers.message("New changelog entry\n");
				await changeset("changeset");
			},
			skip: ifNotEqualTo("log"),
		})
		.task({
			async handler() {
				helpers.message("New empty changelog entry\n");
				await changeset("changeset --empty");
			},
			skip: ifNotEqualTo("emptyLog"),
		})
		.task({
			async handler() {
				helpers.message("Bumping the package(s) version\n");
				await changeset("changeset version");
			},
			skip: ifNotEqualTo("increment"),
		})
		.task({
			async handler() {
				helpers.message("Publishing package(s) to the registry\n");
				await changeset("stack build && changeset publish");
			},
			skip: ifNotEqualTo("publish"),
		});
};

const ifNotEqualTo = (validOption: keyof CommandContext) => {
	return (context: CommandContext) => {
		return !context[validOption];
	};
};
