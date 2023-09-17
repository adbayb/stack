import { existsSync, readdirSync } from "node:fs";
import { helpers } from "termost";

import type { CommandFactory } from "../types";
import { resolveFromProjectDirectory } from "../helpers";

type CommandContext = {
	files: string[];
};

export const createCleanCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "clean",
			description: "Clean the project",
		})
		.task({
			key: "files",
			label: label("Retrieving removable assets"),
			async handler() {
				const cachePath = "node_modules/.cache";
				const files = await retrieveIgnoredFiles();

				if (
					isDirectoryExistAndNotEmpty(
						resolveFromProjectDirectory(cachePath),
					)
				) {
					files.push(cachePath);
				}

				return files;
			},
		})
		.task({
			label({ files }) {
				return files.length > 0
					? label("Cleaning assets")
					: "Already clean ✨";
			},
			async handler({ files }) {
				if (files.length === 0) return;

				await cleanFiles(files);
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

const label = (message: string) => `${message} 🧹`;

const cleanFiles = async (files: string[]) => {
	return helpers.exec(`rm -rf ${files.join(" ")}`);
};

const isDirectoryExistAndNotEmpty = (path: string) => {
	return existsSync(path) && readdirSync(path).length > 0;
};

const retrieveIgnoredFiles = async () => {
	const rawFiles = await helpers.exec(
		`git clean -fdXn | grep -v '${PRESERVE_FILES.join(
			"\\|",
		)}' | cut -c 14-`,
	);

	return rawFiles.split(/\n/).filter(Boolean);
};

const PRESERVE_FILES = ["node_modules", ".turbo"];
