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
			handler() {
				helpers.message("New changelog entry\n");

				return changeset("changeset");
			},
		})
		.task({
			skip: ifNotEqualTo("tag"),
			handler() {
				helpers.message("Bumping the package(s) version\n");

				return changeset(
					"changeset version && pnpm install --no-frozen-lockfile",
				);
			},
		})
		.task({
			skip: ifNotEqualTo("publish"),
			handler() {
				helpers.message("Publishing package(s) to the registry\n");

				return changeset("stack build && pnpm changeset publish");
			},
		});
};

const ifNotEqualTo =
	(validOption: keyof CommandContext) => (context: CommandContext) => {
		return !context[validOption];
	};
