import { existsSync } from "node:fs";
import { helpers } from "termost";
import { resolve } from "node:path";

export const getRepositoryUrl = async () => {
	return helpers.exec("git config --get remote.origin.url");
};

export const resolveFromProjectDirectory = (path: string) => {
	return resolve(process.cwd(), path);
};

/**
 * Resolve a relative path to generate an absolute one resolved from the `stack` node module directory
 * @param path The relative path
 * @returns The absolute path
 */
export const resolveFromStackDirectory = (path: string) => {
	return resolve(__dirname, "../", path);
};

export const getStackCommand = (command: string, isNodeRuntime = true) => {
	// @note: `isNodeRuntime` allows executing node bin executables in a non node environment such as in git hooks context
	// Npx is used to make executable resolution independent from the build tool (npx is the built-in Node tool)
	// `--no` flag to prevent installation prompt and throw an error if the binary is not installed
	return [...(isNodeRuntime ? [] : ["npx --no"]), `stack ${command}`].join(
		" ",
	);
};

export const request = {
	async get<ResponseType extends "json" | "text">(
		url: string,
		responseType: ResponseType,
	): Promise<ResponseType extends "text" ? string : Record<string, string>> {
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

		return responseType === "text" ? response.text() : response.json();
	},
};

const eslint =
	(options: { isFixMode: boolean }) =>
	async (files: FilenameCollection = []) => {
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

		args.push(`--ext ${ESLINT_EXTENSIONS.join(",")}`);
		args.push("--cache");
		args.push(
			`--cache-location ${await resolveFromProjectDirectory(
				"node_modules/.cache/.eslintcache",
			)}`,
		);
		// @note: prevent errors when no matched file is found
		args.push("--no-error-on-unmatched-pattern");

		const gitIgnoreFile = await resolveFromProjectDirectory(".gitignore");

		if (existsSync(gitIgnoreFile)) {
			args.push(`--ignore-path ${gitIgnoreFile}`);
		}

		if (options.isFixMode) {
			args.push("--fix");
		}

		try {
			return await helpers.exec(`eslint ${args.join(" ")}`);
		} catch (error) {
			throw createError("eslint", error);
		}
	};

export const checkLints = eslint({ isFixMode: false });

export const fixLints = eslint({ isFixMode: true });

export const fixFormatting = async (files: FilenameCollection) => {
	let prettierFiles = [];

	if (files.length === 0) {
		prettierFiles.push(`"**/!(${PRETTIER_IGNORE_FILES.join("|")})"`);
	} else {
		prettierFiles = files.filter((file) => {
			return !PRETTIER_IGNORE_FILES.some((filename) =>
				file.endsWith(filename),
			);
		});

		if (prettierFiles.length === 0) return Promise.resolve();
	}

	const args = [...prettierFiles];

	if (existsSync(await resolveFromProjectDirectory(".gitignore"))) {
		args.push("--ignore-path .gitignore");
	}

	args.push("--write");
	args.push("--ignore-unknown");

	try {
		return await helpers.exec(`prettier ${args.join(" ")}`);
	} catch (error) {
		throw createError("prettier", error);
	}
};

export const checkTypes = async (files: FilenameCollection) => {
	try {
		const tsFiles = files.filter((file) => {
			return TYPESCRIPT_EXTENSIONS.some((ext) => file.endsWith(ext));
		});

		return await helpers.exec(
			`tsc --tsBuildInfoFile ${await resolveFromProjectDirectory(
				"node_modules/.cache/.tsbuildinfo",
			)} --noEmit ${tsFiles.join(" ")}`,
		);
	} catch (error) {
		throw createError("tsc", error);
	}
};

export const checkCommit = async () => {
	try {
		return await helpers.exec(
			`commitlint --extends "@commitlint/config-conventional" --edit`,
		);
	} catch (error) {
		throw createError("commitlint", error);
	}
};

export const createError = (bin: string, error: Error | string | unknown) => {
	return new Error(`\`${bin}\` failed:\n${error}`);
};

const TYPESCRIPT_EXTENSIONS = ["ts", "tsx", "cts", "mts"];
/**
 * Extensions supported by ESLint.
 */
const ESLINT_EXTENSIONS = ["js", "jsx", "cjs", "mjs", ...TYPESCRIPT_EXTENSIONS];
const PRETTIER_IGNORE_FILES = ["CHANGELOG.md", "pnpm-lock.yaml"];

type FilenameCollection = Array<string>;