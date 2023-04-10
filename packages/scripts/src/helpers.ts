import { existsSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";
import { helpers } from "termost";

const getRootDir = () => {
	try {
		return execSync("git rev-parse --show-toplevel", {
			encoding: "utf-8",
		}).trim();
	} catch (error) {
		throw runtimeError(
			"git",
			`The root repository must be a git project. Have you tried to run \`git init\`?\n${error}`
		);
	}
};

const ROOT_DIR = getRootDir();

export const resolveFromRoot = (path: string) => {
	return resolve(ROOT_DIR, path);
};

export const execScripts = (command: "clean" | "verify") => {
	return helpers.exec(getScripts(command), {
		hasLiveOutput: true,
	});
};

export const getScripts = (command: string, isNodeRuntime = true) => {
	// @note: `isNodeRuntime` allows executing node bin executables in a non node environment such as in git hooks context
	// Npx is used to make executable resolution independent from the build tool (npx is the built-in Node tool)
	// `--no` flag to prevent installation prompt and throw an error if the binary is not installed
	return [...(isNodeRuntime ? [] : ["npx --no"]), `scripts ${command}`].join(
		" "
	);
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
			`--cache-location ${resolveFromRoot(
				"node_modules/.cache/.eslintcache"
			)}`
		);
		// @note: prevent errors when no matched file is found
		args.push("--no-error-on-unmatched-pattern");

		const gitIgnoreFile = resolveFromRoot(".gitignore");

		if (existsSync(gitIgnoreFile)) {
			args.push(`--ignore-path ${gitIgnoreFile}`);
		}

		if (options.isFixMode) {
			args.push("--fix");
		}

		try {
			return await helpers.exec(`eslint ${args.join(" ")}`);
		} catch (error) {
			throw runtimeError("eslint", error);
		}
	};

export const verifyLints = eslint({ isFixMode: false });

export const fixLints = eslint({ isFixMode: true });

export const fixFormatting = async (files: FilenameCollection) => {
	const prettierFiles = files.filter((file) => {
		return (
			!PRETTIER_IGNORE_FILES.some((filename) =>
				file.endsWith(filename)
			) && PRETTIER_EXTENSIONS.some((ext) => file.endsWith(ext))
		);
	});

	if (prettierFiles.length === 0) return Promise.resolve();

	const args = [...prettierFiles];

	if (existsSync(resolveFromRoot(".gitignore"))) {
		args.push("--ignore-path .gitignore");
	}

	args.push("--write");

	try {
		return await helpers.exec(`prettier ${args.join(" ")}`);
	} catch (error) {
		throw runtimeError("prettier", error);
	}
};

export const verifyTypes = async (files: FilenameCollection) => {
	try {
		const tsFiles = files.filter((file) => {
			return TYPESCRIPT_EXTENSIONS.some((ext) => file.endsWith(ext));
		});

		return await helpers.exec(
			`tsc --tsBuildInfoFile ${resolveFromRoot(
				"node_modules/.cache/.tsbuildinfo"
			)} --noEmit ${tsFiles.join(" ")}`
		);
	} catch (error) {
		throw runtimeError("tsc", error);
	}
};

export const verifyCommit = async () => {
	try {
		return await helpers.exec(
			`commitlint --extends "@commitlint/config-conventional" --edit`
		);
	} catch (error) {
		throw new Error(`\`commitlint\` failed:\n${error}`);
	}
};

export const runtimeError = (bin: string, error: Error | string | unknown) => {
	return new Error(`\`${bin}\` failed:\n${error}`);
};

const TYPESCRIPT_EXTENSIONS = ["ts", "tsx"];
/**
 * Extensions supported by ESLint.
 */
const ESLINT_EXTENSIONS = ["js", "jsx", ...TYPESCRIPT_EXTENSIONS];
/**
 * Extensions supported by Prettier but not yet parseable
 * by ESLint to take advantage of the eslint prettier plugin
 */
const PRETTIER_EXTENSIONS = ["css", "html", "json", "md", "mdx", "yml", "yaml"];
const PRETTIER_IGNORE_FILES = [
	"CHANGELOG.md",
	"package.json",
	"pnpm-lock.yaml",
];

type FilenameCollection = Array<string>;
