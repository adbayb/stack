import { createRequire } from "node:module";
import { resolve } from "node:path";
import { helpers } from "termost";
import type { Filenames } from "./types";

export const require = createRequire(import.meta.url);

export const assert: (
	expectedCondition: unknown,
	createError: () => Error,
) => asserts expectedCondition = (expectedCondition, createError) => {
	if (!expectedCondition) {
		throw createError();
	}
};

/**
 * Helper to format log messages with a welcoming bot.
 *
 * @example
 * 	botMessage({
 * 		title: "Oops, an error occurred",
 * 		description: "Keep calm and carry on with some coffee ☕️",
 * 		body: String(previousTaskError),
 * 		type: "error",
 * 	});
 *
 * @param input - Message factory.
 * @param input.title - Title input.
 * @param input.description - Description input.
 * @param input.body - Body input.
 * @param input.type - Message type.
 */
export const botMessage = (input: {
	body?: string;
	description: string;
	title: string;
	type: "error" | "information" | "success";
}) => {
	const { type } = input;
	const log = console[type === "error" ? "error" : "log"];

	const colorByType = {
		error: "red",
		information: "blue",
		success: "green",
	} as const;

	log(
		helpers.format(
			`
╭─────╮
│ ◠   ◠  ${input.title}
│   ${type === "error" ? "◠" : "◡"} │  ${input.description}
╰─────╯
${
	input.body
		? `
${input.body}
`
		: ""
}`,
			{
				color: colorByType[type],
			},
		),
	);
};

/**
 * Resolve a relative path to an absolute one resolved from the generated project root directory.
 *
 * @example
 * 	resolveFromWorkingDirectory(".gitignore");
 *
 * @param path - The relative path.
 * @returns The resolved absolute path.
 */
export const resolveFromWorkingDirectory = (...path: string[]) => {
	return resolve(process.cwd(), ...path);
};

/**
 * Resolve a relative path to an absolute one resolved from the `stack` node module directory.
 *
 * @example
 * 	resolveFromPackageDirectory("./templates");
 *
 * @param path - The relative path.
 * @returns The resolved absolute path.
 */
export const resolveFromPackageDirectory = (...path: string[]) => {
	return resolve(import.meta.dirname, "../", ...path);
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

export const getPnpmVersion = async () => {
	try {
		return await helpers.exec("pnpm -v");
	} catch {
		throw createError(
			"pnpm",
			"The project must use `pnpm` as a node package manager tool. Follow this installation guide https://pnpm.io/installation",
		);
	}
};

export const getStackCommand = (command: string) => {
	return `pnpm stack ${command}`;
};

export const setPackageManager = async () => {
	/**
	 * Corepack is downloaded remotely to get always up-to-date npm registry fingerprints since
	 * they're hardcoded.
	 *
	 * @see {@link https://github.com/nodejs/corepack/issues/613}
	 */
	await helpers.exec("pnx corepack enable");
};

async function getRequest(url: string, responseType: "text"): Promise<string>;
async function getRequest(url: string, responseType: "json"): Promise<Record<string, string>>;
async function getRequest(
	url: string,
	responseType: "json" | "text",
): Promise<string | Record<string, string>> {
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

	if (responseType === "text") {
		return response.text();
	}

	return response.json() as Promise<Record<string, string>>;
}

export const request = {
	get: getRequest,
};

export const oxlint = (options: { isFixMode: boolean }) => {
	return async (files: Filenames = []) => {
		const args = [...files, "--disable-nested-config", "--no-error-on-unmatched-pattern"];

		if (options.isFixMode) {
			args.push("--fix");
		}

		try {
			return await helpers.exec(`oxlint ${args.join(" ")}`);
		} catch (error) {
			throw createError("oxlint", error instanceof Error ? error : new Error(String(error)));
		}
	};
};

export const oxfmt = (options: { isFixMode: boolean }) => {
	return async (files: Filenames = []) => {
		const args = [
			...files,
			"--disable-nested-config",
			"--no-error-on-unmatched-pattern",
			options.isFixMode ? "--write" : "--check",
		];

		try {
			return await helpers.exec(`oxfmt ${args.join(" ")}`);
		} catch (error) {
			throw createError("oxfmt", error instanceof Error ? error : new Error(String(error)));
		}
	};
};

export const turbo = async (
	command: "build" | "start" | "test" | "watch",
	options: {
		excludeExamples?: boolean;
	} & Parameters<typeof helpers.exec>[1] = {},
) => {
	try {
		const { excludeExamples = false, hasLiveOutput = true, ...restOptions } = options;

		return await helpers.exec(
			`turbo run ${command} ${excludeExamples ? "--filter !@examples/*" : ""}`,
			{
				...restOptions,
				hasLiveOutput,
			},
		);
	} catch (error) {
		throw createError("turbo", error instanceof Error ? error : new Error(String(error)));
	}
};

export const logCheckableFiles = (files: string[]) => {
	if (files.length === 0) {
		helpers.message("The whole project will be checked.", {
			label: false,
			lineBreak: { end: true, start: false },
		});

		return;
	}

	helpers.message(files.join("\n   "), {
		label: "Following files will be checked:",
		lineBreak: { end: true, start: false },
	});
};

export const changeset = async (command: string) => {
	try {
		return await helpers.exec(command, {
			hasLiveOutput: true,
		});
	} catch (error) {
		throw createError("changeset", error instanceof Error ? error : new Error(String(error)));
	}
};
