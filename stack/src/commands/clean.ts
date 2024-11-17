import { rm } from "node:fs/promises";
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
			label: label("Retrieve removable files"),
			async handler() {
				const cachePath = "node_modules/.cache";
				const files = await retrieveIgnoredFiles();

				if (
					isDirectoryExistAndNotEmpty(resolveFromProjectDirectory(cachePath))
				) {
					files.push(cachePath);
				}

				return files;
			},
		})
		.task({
			label({ files }) {
				return files.length > 0 ? label("Clean assets") : "Already clean ✨";
			},
			async handler({ files }) {
				if (files.length === 0) return;

				await cleanFiles(files);
			},
		})
		.task({
			handler({ files }) {
				helpers.message(files.join("\n   "), {
					label: "Removed assets",
					lineBreak: { end: false, start: true },
					type: "information",
				});
			},
			skip({ files }) {
				return files.length === 0;
			},
		});
};

const label = (message: string) => `${message} 🧹`;

const cleanFiles = async (files: string[]) => {
	return Promise.all(
		files.map(async (file) => rm(file, { force: true, recursive: true })),
	);
};

const isDirectoryExistAndNotEmpty = (path: string) => {
	return existsSync(path) && readdirSync(path).length > 0;
};

const retrieveIgnoredFiles = async () => {
	const rawFiles = await helpers.exec("git clean -fdXn");

	return rawFiles
		.split(/\n|\r\n/)
		.filter(
			(cleanOutput) =>
				!PRESERVE_FILES.some((excludedFile) =>
					cleanOutput.includes(excludedFile),
				),
		)
		.map((cleanOutput) => cleanOutput.split(" ").at(-1) as string);
};

const PRESERVE_FILES = ["node_modules"];
