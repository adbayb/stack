import { helpers } from "termost";
import { changeset } from "../helpers";
import type { CommandFactory } from "../types";

type CommandContext = {
	emptyLog: boolean;
	log: boolean;
	publish: boolean;
	tag: boolean;
};

export const createReleaseCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			description: "Log, version, and publish package(s)",
			name: "release",
		})
		.option({
			description: "Add a new changelog entry",
			key: "log",
			name: "log",
		})
		.option({
			description: "Add an empty changelog entry",
			key: "emptyLog",
			name: "empty-log",
		})
		.option({
			description: "Bump the package(s) version",
			key: "tag",
			name: "tag",
		})
		.option({
			description: "Publish package(s) to the registry",
			key: "publish",
			name: "publish",
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
				await changeset("changeset version && pnpm install --no-frozen-lockfile");
			},
			skip: ifNotEqualTo("tag"),
		})
		.task({
			async handler() {
				helpers.message("Publishing package(s) to the registry\n");
				await changeset("stack build && pnpm changeset publish");
			},
			skip: ifNotEqualTo("publish"),
		});
};

const ifNotEqualTo = (validOption: keyof CommandContext) => {
	return (context: CommandContext) => {
		return !context[validOption];
	};
};
