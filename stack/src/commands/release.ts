import { helpers } from "termost";
import { changeset } from "../helpers";
import type { CommandFactory } from "../types";

type CommandContext = {
	bump: boolean;
	changelog: boolean;
	emptyChangelog: boolean;
	publish: boolean;
	snapshot: boolean;
};

export const createReleaseCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "release",
			description: "Log, version, and publish package(s)",
		})
		.option({
			key: "changelog",
			name: "changelog",
			description: "Add a changelog",
		})
		.option({
			key: "emptyChangelog",
			name: "empty-changelog",
			description: "Add an empty changelog",
		})
		.option({
			key: "bump",
			name: "bump",
			description: "Bump version(s)",
		})
		.option({
			key: "snapshot",
			name: "snapshot",
			description: "Publish snapshot version(s) to the registry",
		})
		.option({
			key: "publish",
			name: "publish",
			description: "Publish stable version(s) to the registry",
		})
		.task({
			async handler() {
				helpers.message("Adding a changelog\n");
				await changeset("changeset");
			},
			skip: ifNotEqualTo("changelog"),
		})
		.task({
			async handler() {
				helpers.message("Adding an empty changelog\n");
				await changeset("changeset --empty");
			},
			skip: ifNotEqualTo("emptyChangelog"),
		})
		.task({
			async handler() {
				helpers.message("Bumping version(s)\n");
				await changeset("changeset version");
			},
			skip: ifNotEqualTo("bump"),
		})
		.task({
			async handler() {
				helpers.message("Publishing snapshot version(s) to the registry\n");
				await changeset("changeset version --snapshot next");
				await changeset("changeset publish --tag next --no-git-tag");
			},
			skip: ifNotEqualTo("snapshot"),
		})
		.task({
			async handler() {
				helpers.message("Publishing stable version(s) to the registry\n");
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
