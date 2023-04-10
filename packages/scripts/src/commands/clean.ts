import { helpers } from "termost";

import type { CommandFactory } from "../types";

type CleanCommandContext = {
	files: Array<string>;
};

export const createCleanCommand: CommandFactory = (program) => {
	program
		.command<CleanCommandContext>({
			name: "clean",
			description: "Clean all unversioned and untracked assets",
		})
		.task({
			key: "files",
			label: "Retrieving removable assets 🧹",
			handler() {
				return retrieveIgnoredFiles();
			},
		})
		.task({
			label({ files }) {
				return files.length > 0
					? `Cleaning assets 🧹`
					: "Already clean ✨";
			},
			handler({ files }) {
				return files.length > 0
					? cleanFiles(files.join(" "))
					: Promise.resolve();
			},
		})
		.task({
			skip({ files }) {
				return files.length === 0;
			},
			handler({ files }) {
				helpers.message(`Removed assets: ${files.join(", ")}\n`, {
					type: "information",
				});
			},
		});
};

const retrieveIgnoredFiles = async () => {
	const rawFiles = await helpers.exec(
		`git clean -fdXn | grep -v '${PRESERVE_FILES.join("\\|")}' | cut -c 14-`
	);

	return rawFiles.split(/\n/).filter(Boolean);
};

const cleanFiles = (fileList: string) => {
	return helpers.exec(`rm -rf ${fileList}`);
};

const PRESERVE_FILES = ["node_modules", ".turbo"];
