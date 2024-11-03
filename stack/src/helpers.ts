import process from "node:process";
import { resolve } from "node:path";
import { createRequire } from "node:module";

import { helpers } from "termost";

import type { Filenames } from "./types";

export const require = createRequire(import.meta.url);

export function assert(
	expectedCondition: unknown,
	createError: () => Error,
): asserts expectedCondition {
	if (!expectedCondition) {
		throw createError();
	}
}

/**
 * Helper to format log messages with a welcoming bot.
 * @param input - Message factory.
 * @param input.title - Title input.
 * @param input.description - Description input.
 * @param input.body - Body input.
 * @param options - Formatting option.
 * @example
 * botMessage(
 *	{
 * 		title: "Oops, an error occurred",
 * 		description:
 * 			"Keep calm and carry on with some coffee ☕️",
 * 		body: String(previousTaskError),
 * 	},
 * 	{
 * 		type: "error",
 * 	},
 * );
 */
export const botMessage = (
	input: { title: string; description: string; body?: string },
	options: Parameters<typeof helpers.message>[1],
) => {
	helpers.message(
		`
╭─────╮
│ ◠   ◠  ${input.title}
│   ${options?.type === "error" ? "◠" : "◡"} │  ${input.description}
╰─────╯
${
	!input.body
		? ""
		: `
${input.body}
`
}`,
		options,
	);
};

/**
 * Resolve a relative path to an absolute one resolved from the generated project root directory.
 * @param path - The relative path.
 * @returns The resolved absolute path.
 * @example
 * resolveFromProjectDirectory(".gitignore");
 */
export const resolveFromProjectDirectory = (path: string) => {
	return resolve(process.cwd(), path);
};

/**
 * Resolve a relative path to an absolute one resolved from the `stack` node module directory.
 * @param path - The relative path.
 * @returns The resolved absolute path.
 * @example
 * resolveFromStackDirectory("./templates");
 */
export const resolveFromStackDirectory = (path: string) => {
	return resolve(import.meta.dirname, "../", path);
};

export const createError = (bin: string, error: Error | string) => {
	const errorMessage = `\`${bin}\` command failed.\n${String(error)}`;

	if (error instanceof Error) {
		error.message = errorMessage;

		return error;
	}

	return new Error(errorMessage);
};

export const getRepositoryUrl = async () => {
	try {
		// This step is used as well to persist the repository url value:
		return await helpers.exec("git config --get remote.origin.url");
	} catch (error) {
		throw createError(
			"git",
			`The project must be a \`git\` repository with an origin already setup. Have you tried to run \`git init && git remote add origin git@github.com:OWNER/REPOSITORY.git && git add -A && git commit -m "chore: initial commit" && git push -u origin main\`?\n${String(
				error,
			)}`,
		);
	}
};

export const getNpmVersion = async () => {
	try {
		return await helpers.exec("pnpm -v");
	} catch {
		throw createError(
			"pnpm",
			"The project must use `pnpm` as a node package manager tool. Follow this installation guide https://pnpm.io/installation",
		);
	}
};

export const getStackCommand = (command: string, isNodeRuntime = true) => {
	/**
	 * `isNodeRuntime` allows executing node bin executables in a non node environment such as in git hooks context
	 * Npx is used to make executable resolution independent from the build tool (npx is the built-in Node tool)
	 * `--no` flag to prevent installation prompt and throw an error if the binary is not installed.
	 */
	return [...(isNodeRuntime ? [] : ["npx --no"]), `stack ${command}`].join(" ");
};

export const hasDependency = (packageName: string) => {
	return Boolean(require.resolve(packageName));
};

export const setPkgManager = async () => {
	return helpers.exec("corepack enable");
};

export const request = {
	async get<ResponseType extends "json" | "text">(
		url: string,
		responseType: ResponseType,
	) {
		const response = await fetch(url);

		if (!response.ok) {
			throw createError(
				"fetch",
				`Failed to fetch resources from ${url} (${JSON.stringify({
					status: response.status,
					statusText: response.statusText,
				})})`,
			);
		}

		return (
			responseType === "text" ? response.text() : response.json()
		) as Promise<ResponseType extends "text" ? string : Record<string, string>>;
	},
};

export const eslint =
	(options: { isFixMode: boolean }) =>
	async (files: Filenames = []) => {
		let eslintFiles = [];

		if (files.length === 0) {
			eslintFiles.push(".");
		} else {
			eslintFiles = files.filter((file) => {
				return ESLINT_EXTENSIONS.some((ext) => file.endsWith(ext));
			});

			if (eslintFiles.length === 0) return Promise.resolve();
		}

		const args = [...eslintFiles];

		args.push("--cache");
		args.push(
			`--cache-location ${resolveFromProjectDirectory(
				"node_modules/.cache/.eslintcache",
			)}`,
		);
		// @note: prevent errors when no matched file is found
		args.push("--no-error-on-unmatched-pattern");

		if (options.isFixMode) {
			args.push("--fix");
		}

		try {
			return await helpers.exec(`eslint ${args.join(" ")}`);
		} catch (error) {
			throw createError("eslint", error as Error);
		}
	};

export const turbo = async (
	command: "build" | "start" | "test" | "watch",
	options: Parameters<typeof helpers.exec>[1] = { hasLiveOutput: true },
) => {
	try {
		return await helpers.exec(`turbo run ${command}`, options);
	} catch (error) {
		throw createError("turbo", error as Error);
	}
};

export const changeset = async (command: string) => {
	try {
		return await helpers.exec(command, {
			hasLiveOutput: true,
		});
	} catch (error) {
		throw createError("changeset", error as Error);
	}
};

const ESLINT_EXTENSIONS = [
	"js",
	"jsx",
	"cjs",
	"mjs",
	"ts",
	"tsx",
	"cts",
	"mts",
	"md",
	"mdx",
];
