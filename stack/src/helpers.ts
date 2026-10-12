import { createRequire } from "node:module";
import { resolve } from "node:path";
import { exec, createLogger } from "termost";
import type { Filenames } from "./types";

export const logger = createLogger();
export const require = createRequire(import.meta.url);

/**
 * Throw the created error when the condition is falsy.
 *
 * @param expectedCondition - The condition to verify.
 * @param createError - Builds the error thrown when falsy.
 */
export const assert: (
	expectedCondition: unknown,
	createError: () => Error,
) => asserts expectedCondition = (expectedCondition, createError) => {
	if (!expectedCondition) {
		throw createError();
	}
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

/**
 * Prefix an error message with the failing binary name.
 *
 * @param bin - The failing binary name shown in the message.
 * @param error - The cause to wrap or reword.
 * @returns The original error with context, or a new error.
 */
export const createError = (bin: string, error: Error | string) => {
	const errorMessage = `\`${bin}\` command failed.\n${String(error)}`;

	if (error instanceof Error) {
		error.message = errorMessage;

		return error;
	}

	return new Error(errorMessage);
};

/**
 * Resolve the installed pnpm version or throw an actionable error.
 *
 * @returns The `pnpm -v` output.
 */
export const getPnpmVersion = async () => {
	try {
		return await exec("pnpm -v");
	} catch {
		throw createError(
			"pnpm",
			"The project must use `pnpm` as a node package manager tool. Follow this installation guide https://pnpm.io/installation",
		);
	}
};

/**
 * Prefix a command with the `pnpm stack` runner.
 *
 * @param command - The stack subcommand with its arguments.
 * @returns The runnable command string.
 */
export const getStackCommand = (command: string) => {
	return `pnpm stack ${command}`;
};

/** Enable corepack for the project. */
export const setPackageManager = async () => {
	/**
	 * Corepack is downloaded remotely to get always up-to-date npm registry fingerprints since
	 * they're hardcoded.
	 *
	 * @see {@link https://github.com/nodejs/corepack/issues/613}
	 */
	await exec("pnx corepack enable");
};

/** Minimal fetch wrapper that throws an actionable error on non-2xx responses. */
export const request = {
	async get<ResponseType extends "json" | "text">(url: string, responseType: ResponseType) {
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

		return (responseType === "text" ? response.text() : response.json()) as Promise<
			ResponseType extends "text" ? string : Record<string, string>
		>;
	},
};

/**
 * Quote a value as a single shell argument. An embedded single quote is expressed by closing,
 * adding an escaped quote, and reopening.
 *
 * @param value - The raw value to quote.
 * @returns The single-quoted shell argument.
 */
export const toShellArgument = (value: string) => {
	return `'${value.replaceAll("'", "'\"'\"'")}'`;
};

/**
 * Create an oxlint check/fix runner.
 *
 * @param options - Set `isFixMode` to rewrite files instead of checking.
 * @returns A runner executing oxlint over optional filenames.
 */
export const oxlint = (options: { isFixMode: boolean }) => {
	return async (files: Filenames = []) => {
		const args = [...files, "--disable-nested-config", "--no-error-on-unmatched-pattern"];

		if (options.isFixMode) {
			args.push("--fix-dangerously");
		}

		try {
			return await exec(
				`oxlint ${args
					.map((arg) => {
						return toShellArgument(arg);
					})
					.join(" ")}`,
			);
		} catch (error) {
			throw createError("oxlint", error instanceof Error ? error : new Error(String(error)));
		}
	};
};

/**
 * Create an oxfmt check/fix runner.
 *
 * @param options - Set `isFixMode` to rewrite files instead of checking.
 * @returns A runner executing oxfmt over optional filenames.
 */
export const oxfmt = (options: { isFixMode: boolean }) => {
	return async (files: Filenames = []) => {
		const args = [
			...files,
			"--disable-nested-config",
			"--no-error-on-unmatched-pattern",
			options.isFixMode ? "--write" : "--check",
		];

		try {
			return await exec(
				`oxfmt ${args
					.map((arg) => {
						return toShellArgument(arg);
					})
					.join(" ")}`,
			);
		} catch (error) {
			throw createError("oxfmt", error instanceof Error ? error : new Error(String(error)));
		}
	};
};

/**
 * Run a turbo pipeline task.
 *
 * @param command - The pipeline task to run.
 * @param options - Exec options plus example exclusion.
 * @returns The turbo output.
 */
export const turbo = async (
	command: "build" | "start" | "test" | "watch",
	options: Parameters<typeof exec>[1] & {
		excludeExamples?: boolean;
	} = {},
) => {
	try {
		const { excludeExamples = false, hasLiveOutput = true, ...restOptions } = options;

		return await exec(
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

/**
 * Log which files a check/fix run will cover.
 *
 * @param files - The filenames to log, or nothing for whole-project runs.
 */
export const logCheckableFiles = (files: string[]) => {
	if (files.length === 0) {
		logger.info("The whole project will be checked.");

		return;
	}

	logger.info(`Following files will be checked:\n   ${files.join("\n   ")}`);
};

/**
 * Run a changeset command with live output.
 *
 * @param command - The changeset CLI invocation.
 * @returns The command output.
 */
export const changeset = async (command: string) => {
	try {
		return await exec(command, {
			hasLiveOutput: true,
		});
	} catch (error) {
		throw createError("changeset", error instanceof Error ? error : new Error(String(error)));
	}
};
