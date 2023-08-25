import { helpers } from "termost";

import type { CommandFactory } from "../types";
import { changeset } from "../helpers";

type CommandContext = {
	log: boolean;
	publish: boolean;
	tag: boolean;
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
			key: "tag",
			name: "tag",
			description: "Bump the package(s) version",
		})
		.option({
			key: "publish",
			name: "publish",
			description: "Publish package(s) to the registry",
		})
		.task({
			skip: ifNotEqualTo("log"),
			async handler() {
				helpers.message("New changelog entry\n");

				await changeset("changeset");
			},
		})
		.task({
			skip: ifNotEqualTo("tag"),
			async handler() {
				helpers.message("Bumping the package(s) version\n");

				await changeset(
					"changeset version && pnpm install --no-frozen-lockfile",
				);
			},
		})
		.task({
			skip: ifNotEqualTo("publish"),
			async handler() {
				helpers.message("Publishing package(s) to the registry\n");

				await changeset("stack build && pnpm changeset publish");
			},
		});
};

const ifNotEqualTo =
	(validOption: keyof CommandContext) => (context: CommandContext) => {
		return !context[validOption];
	};
