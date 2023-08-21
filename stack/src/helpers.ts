import { existsSync } from "node:fs";
import { helpers } from "termost";
import { resolve } from "node:path";

/**
 * Helper to format log messages with a welcoming bot
 * @param input Content input
 * @param options Termost options for the `message` API
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
 * Resolve a relative path to an absolute one resolved from the generated project root directory
 * @param path The relative path
 * @returns The resolved absolute path
 */
export const resolveFromProjectDirectory = (path: string) => {
	return resolve(process.cwd(), path);
};

/**
 * Resolve a relative path to an absolute one resolved from the `stack` node module directory
 * @param path The relative path
 * @returns The resolved absolute path
 */
export const resolveFromStackDirectory = (path: string) => {
	return resolve(__dirname, "../", path);
};

export const getRepositoryUrl = async () => {
	try {
		// This step is used as well to persist the repository url value:
		return await helpers.exec("git config --get remote.origin.url");
	} catch (error) {
		throw createError(
			"git",
			`The project must be a \`git\` repository with an origin already setup. Have you tried to run \`git init && git remote add origin git@github.com:OWNER/REPOSITORY.git && git add -A && git commit -m "chore: initial commit" && git push -u origin main\`?\n${error}`,
		);
	}
};

export const getNpmVersion = async () => {
	try {
		return await helpers.exec("pnpm -v");
	} catch (error) {
		throw createError(
			"pnpm",
			"The project must use `pnpm` as a node package manager tool. Follow this installation guide https://pnpm.io/installation",
		);
	}
};

export const getStackCommand = (command: string, isNodeRuntime = true) => {
	// @note: `isNodeRuntime` allows executing node bin executables in a non node environment such as in git hooks context
	// Npx is used to make executable resolution independent from the build tool (npx is the built-in Node tool)
	// `--no` flag to prevent installation prompt and throw an error if the binary is not installed
	return [...(isNodeRuntime ? [] : ["npx --no"]), `stack ${command}`].join(
		" ",
	);
};

export const setPkgManager = () => {
	return helpers.exec("corepack enable");
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
			return (
				!PRETTIER_IGNORE_FILES.some((filename) =>
					file.endsWith(filename),
				) && // The root `README.md` file is ignored to prevent error due to its symbolic link nature when specified explicitly as a file
				file !== "README.md"
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
	args.push("--no-error-on-unmatched-pattern");

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
			'commitlint --extends "@commitlint/config-conventional" --edit',
		);
	} catch (error) {
		throw createError("commitlint", error);
	}
};

export const createError = (bin: string, error: Error | string | unknown) => {
	return new Error(`\`${bin}\` failed:\n${error}`);
};

export const turbo = async (
	command: "build" | "start" | "test" | "watch",
	options: Parameters<typeof helpers.exec>[1] = { hasLiveOutput: true },
) => {
	try {
		return await helpers.exec(`turbo run ${command}`, options);
	} catch (error) {
		throw createError("turbo", error);
	}
};

export const changeset = async (command: string) => {
	try {
		return await helpers.exec(command, {
			hasLiveOutput: true,
		});
	} catch (error) {
		throw createError("changeset", error);
	}
};

const TYPESCRIPT_EXTENSIONS = ["ts", "tsx", "cts", "mts"];
/**
 * Extensions supported by ESLint.
 */
const ESLINT_EXTENSIONS = ["js", "jsx", "cjs", "mjs", ...TYPESCRIPT_EXTENSIONS];
const PRETTIER_IGNORE_FILES = ["CHANGELOG.md", "pnpm-lock.yaml"];

type FilenameCollection = Array<string>;
