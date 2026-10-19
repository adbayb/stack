import { existsSync, readdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { isAbsolute, relative, sep } from "node:path";
import { exec } from "termost";
import { assert, createError, logger, resolveFromWorkingDirectory } from "../helpers";
import type { CommandFactory } from "../types";

type CommandContext = {
	files: string[];
};

/**
 * Remove generated and cached files from the project.
 *
 * @param program - The termost program to register the command onto.
 */
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
				logger.info(`Removed assets\n   ${files.join("\n   ")}`);
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
			const absolutePath = resolveFromWorkingDirectory(file);
			const pathFromWorkingDirectory = relative(process.cwd(), absolutePath);

			assert(
				pathFromWorkingDirectory !== "" &&
					pathFromWorkingDirectory !== ".." &&
					!pathFromWorkingDirectory.startsWith(`..${sep}`) &&
					!isAbsolute(pathFromWorkingDirectory),
				() => {
					return createError(
						"stack clean",
						`Refusing to remove a path outside the working directory: ${file}`,
					);
				},
			);

			await rm(absolutePath, { force: true, recursive: true });
		}),
	);
};

const isDirectoryExistAndNotEmpty = (path: string) => {
	return existsSync(path) && readdirSync(path).length > 0;
};

const LINEBREAK_REGEXP = /\n|\r\n/u;

const retrieveIgnoredFiles = async () => {
	const rawFiles = await exec("git clean -fdXn");

	return rawFiles
		.split(LINEBREAK_REGEXP)
		.map((cleanOutput) => {
			/*
			 * `git clean -fdXn` prints `Would remove <path>`; strip the prefix instead of
			 * splitting on spaces so paths containing spaces resolve correctly.
			 */
			return cleanOutput.startsWith(REMOVABLE_FILE_PREFIX)
				? cleanOutput.slice(REMOVABLE_FILE_PREFIX.length)
				: "";
		})
		.filter(Boolean)
		.filter((file) => {
			return !isPreservedPath(file);
		});
};

/**
 * Check whether `stack clean` must preserve a path.
 *
 * Preserve installed dependencies and local environment files, which may contain secrets and must
 * never be removed by a generated-file cleanup.
 *
 * @param path - The repository-relative path to inspect.
 * @returns `true` when the path or one of its segments is preserved.
 */
export const isPreservedPath = (path: string) => {
	return path.split(PATH_SEGMENT_SEPARATOR).some((segment) => {
		return PRESERVED_SEGMENTS.some((pattern) => {
			return pattern.test(segment);
		});
	});
};

const REMOVABLE_FILE_PREFIX = "Would remove ";
const PATH_SEGMENT_SEPARATOR = /[\\/]/u;
const PRESERVED_SEGMENTS = [/^node_modules$/u, /^\.env(?:\.|$)/u];
