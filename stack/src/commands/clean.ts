import { existsSync, readdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { helpers } from "termost";
import { resolveFromWorkingDirectory } from "../helpers";
import type { CommandFactory } from "../types";

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

				if (isDirectoryExistAndNotEmpty(resolveFromWorkingDirectory(cachePath))) {
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
				if (files.length === 0) {
					return;
				}

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

const label = (message: string) => {
	return `${message} 🧹`;
};

const cleanFiles = async (files: string[]) => {
	await Promise.all(
		files.map(async (file) => {
			await rm(file, { force: true, recursive: true });
		}),
	);
};

const isDirectoryExistAndNotEmpty = (path: string) => {
	return existsSync(path) && readdirSync(path).length > 0;
};

const LINEBREAK_REGEXP = /\n|\r\n/u;

const retrieveIgnoredFiles = async () => {
	const rawFiles = await helpers.exec("git clean -fdXn");

	return rawFiles
		.split(LINEBREAK_REGEXP)
		.filter((cleanOutput) => {
			return PRESERVE_FILES.every((excludedFile) => {
				return !cleanOutput.includes(excludedFile);
			});
		})
		.map((cleanOutput) => {
			return cleanOutput.split(" ").at(-1) ?? "";
		})
		.filter(Boolean);
};

const PRESERVE_FILES = ["node_modules"];
