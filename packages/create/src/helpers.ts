import { copyFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, parse } from "node:path";
import { getRepositoryUrl, getRootDir } from "@internal/helpers";
import { helpers } from "termost";

import { PROJECT_FOLDER, TEMPLATES_FOLDER } from "./constants";

export const copyTemplates = async () => {
	const files = await readdir(TEMPLATES_FOLDER);

	return Promise.all(
		files.map(async (sourceFileName) => {
			// @note: we suffix all templates with `.tmpl` to avoid npm publish postprocessing
			// By default, .gitignore and .npmrc are excluded and using "files" package.json field
			// solves the issue partially since npm post-transform by renaming .gitignore to .npmignore
			const destinationFileName = parse(sourceFileName).name;

			return await copyFile(
				join(TEMPLATES_FOLDER, sourceFileName),
				join(PROJECT_FOLDER, destinationFileName),
			);
		}),
	);
};

export const processPkg = async () => {
	const [rootDir, repositoryUrl] = await Promise.all([
		getRootDir(),
		getRepositoryUrl(),
	]);

	const directory = PROJECT_FOLDER.replace(new RegExp(`^${rootDir}/`), "");
	const isRoot = rootDir === PROJECT_FOLDER;

	const projectUrl = repositoryUrl.replace(
		/^git@(.*):(.*).git$/,
		"https://$1/$2/",
	);

	const rootConfig = {
		private: true,
		name: "xxx-monorepo", // @todo: replace xxx by the name provided by cli
		version: "0.0.0",
		prettier: "@adbayb/prettier-config",
		eslintConfig: {
			...(directory && { root: true }), // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
			extends: "@adbayb",
		},
		packageManager: "pnpm@8.3.1", // @todo: retrieve pnpm version dynamically? If yes check engine invariant
		engines: {
			node: ">=18.0.0",
			pnpm: ">=8.0.0",
		},
	};

	const localConfig = {
		name: "TODO name from cli",
		description: "TODO description from cli (optional)",
		version: "0.0.0",
		files: ["dist"],
		sideEffects: false,
		type: "module",
		source: "src/index.ts",
		main: "dist/index.cjs",
		module: "dist/index.mjs",
		types: "dist/index.d.ts",
		exports: {
			".": {
				require: "dist/index.cjs",
				import: "dist/index.mjs",
				types: "dist/index.d.ts",
			},
		},
	};

	let config = {
		...(isRoot && rootConfig),
		...(!isRoot && localConfig),
		license: "MIT",
		author: "Ayoub Adib <adbayb@gmail.com> (https://twitter.com/adbayb)",
		bugs: new URL("issues", projectUrl).href,
		homepage: new URL(
			[directory, "#readme"].filter(Boolean).join("/"),
			projectUrl,
		).href,
		repository: {
			type: "git",
			url: repositoryUrl,
			...(directory && { directory }),
		},
		scripts: {
			prepare: "scripts setup",
			clean: "scripts clean",
			check: "scripts check",
			fix: "scripts fix",
			start: "turbo run start",
			build: "turbo run build",
			watch: "turbo run watch",
		},
	};

	const targetPkg = join(PROJECT_FOLDER, "package.json");

	if (existsSync(targetPkg)) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		config = merge(
			// @ts-expect-error to remove
			{},
			// require(targetPkg),
			config,
		);
	}

	// @todo: order fields before writing
	return writeFileToProject("package.json", JSON.stringify(config, null, 2));
};

export const setPkgManager = () => {
	return helpers.exec("corepack enable");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const merge = <T extends Record<string, any>>(
	target: T,
	...sources: Array<T>
): T => {
	if (sources.length === 0) {
		return target;
	}

	const source = sources[0];

	for (const key in source) {
		const sourceValue = source[key];
		const targetValue = target[key];

		if (isObject(sourceValue) && isObject(targetValue)) {
			target[key] = merge(targetValue, sourceValue);
		} else {
			target[key] = sourceValue;
		}
	}

	sources.shift();

	return merge(target, ...sources);
};

const isObject = (value: unknown): value is object => {
	return value !== null && typeof value === "object";
};

const writeFileToProject = async (baseName: string, content: string) => {
	return await writeFile(join(PROJECT_FOLDER, baseName), content, "utf-8");
};
