import { existsSync, realpathSync } from "fs";
import { resolve } from "path";
import { helpers } from "termost";

const resolveFromRoot = (path: string) => {
	return resolve(realpathSync(process.cwd()), path);
};

export const scripts = (command: "clean") => {
	return helpers.exec(`scripts ${command}`, {
		hasLiveOutput: true,
	});
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

		if (existsSync(resolveFromRoot(".gitignore"))) {
			args.push("--ignore-path .gitignore");
		}

		if (options.isFixMode) {
			args.push("--fix");
		}

		args.push("--cache");
		args.push(
			`--cache-location ${resolveFromRoot(
				"node_modules/.cache/.eslintcache"
			)}`
		);

		try {
			return await helpers.exec(`eslint ${args.join(" ")}`);
		} catch (error) {
			throw new Error(`\`eslint\` failed:\n${error}`);
		}
	};

export const lintRules = eslint({ isFixMode: false });

export const fixRules = eslint({ isFixMode: true });

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

	try {
		return await helpers.exec(`prettier ${args.join(" ")} --write`);
	} catch (error) {
		throw new Error(`\`prettier\` failed:\n${error}`);
	}
};

export const lintTypes = async (files: FilenameCollection) => {
	try {
		const tsFiles = files.filter((file) => {
			return TYPESCRIPT_EXTENSIONS.some((ext) => file.endsWith(ext));
		});

		console.log(tsFiles);

		return await helpers.exec(
			`tsc --incremental --tsBuildInfoFile ${resolveFromRoot(
				"node_modules/.cache/.tsbuildinfo"
			)} --noEmit ${tsFiles.join(" ")}`
		);
	} catch (error) {
		throw new Error(`\`tsc\` failed:\n${error}`);
	}
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
const PRETTIER_IGNORE_FILES = ["package.json", "CHANGELOG.md"];

type FilenameCollection = Array<string>;
