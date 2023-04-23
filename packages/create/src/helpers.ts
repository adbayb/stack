import { copyFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, parse } from "node:path";
import { getRepositoryUrl, getRootDir } from "@internal/helpers";

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
	const repositoryUrl = await getRepositoryUrl();
	const rootDir = await getRootDir();
	const directory = PROJECT_FOLDER.replace(new RegExp(`^${rootDir}/`), "");

	let pkgConfig = {
		author: {
			name: "Ayoub Adib",
			email: "adbayb@gmail.com",
			url: "https://twitter.com/adbayb",
		},
		repository: {
			type: "git",
			url: repositoryUrl,
			...(directory && { directory }),
		},
		license: "MIT",
		scripts: {
			check: "pnpm lint & tsc --noEmit",
			fix: "pnpm lint --fix",
			lint: "eslint . --ignore-path .gitignore",
			format: "prettier . --ignore-path .gitignore --ignore-path .prettierignore --write",
		},
		prettier: "@adbayb/prettier-config",
		eslintConfig: {
			...(directory && { root: true }), // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
			extends: "@adbayb",
		},
		husky: {
			hooks: {
				"pre-commit": "lint-staged",
			},
		},
		"lint-staged": {
			"**/*.{js,jsx,ts,tsx}": ["pnpm lint"],
			"**/*.{json,md,mdx,html,css}": ["pnpm format"],
		},
	};

	const targetPkg = join(PROJECT_FOLDER, "package.json");

	if (existsSync(targetPkg)) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		pkgConfig = merge(require(targetPkg), pkgConfig);
	}

	return writeFileToProject(
		"package.json",
		JSON.stringify(pkgConfig, null, 2),
	);
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
