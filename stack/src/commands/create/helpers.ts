import { cp, readdir, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, parse } from "node:path";
import { helpers } from "termost";

import { getRepositoryUrl, getRootDir } from "../../helpers";

import { PROJECT_FOLDER, TEMPLATES_FOLDER } from "./constants";

export const copyTemplates = async () => {
	// Copy all template files to the target recursively
	await cp(TEMPLATES_FOLDER, PROJECT_FOLDER, { recursive: true });

	/**
	 * `.tmpl` extension removal post processing
	 * Some templates have this extension to allow their publication in the NPM registry
	 * Indeed, by default, some files are always excluded by NPM during the package publish process (eg. `.npmrc` and `.gitignore`)
	 * @see https://docs.npmjs.com/cli/v9/configuring-npm/package-json#files)
	 */
	const files = await readdir(TEMPLATES_FOLDER);

	return Promise.all(
		files.map(async (filename) => {
			const { ext, name } = parse(filename);

			if (ext !== ".tmpl") {
				return Promise.resolve(); // no-op
			}

			return await rename(
				join(PROJECT_FOLDER, filename),
				join(PROJECT_FOLDER, name),
			);
		}),
	);
};

export const createPkgFile = async () => {
	const [rootDir, repositoryUrl] = await Promise.all([
		getRootDir(),
		getRepositoryUrl(),
	]);

	const directory = PROJECT_FOLDER.replace(new RegExp(`^${rootDir}/`), "");
	const isRoot = rootDir === PROJECT_FOLDER;

	const projectUrl = repositoryUrl.startsWith("git")
		? repositoryUrl.replace(/^git@(.*):(.*).git$/, "https://$1/$2/")
		: repositoryUrl.replace(/.git$/, "");

	const rootConfig = {
		private: true,
		version: "0.0.0",
		prettier: "@adbayb/prettier-config",
		eslintConfig: {
			...(directory && { root: true }), // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
			extends: "@adbayb",
		},
		packageManager: "pnpm@8.3.1", // @todo: retrieve pnpm version dynamically? If yes check engine invariant
		engines: {
			node: ">=18.0.0",
			npm: "please-use-pnpm",
			pnpm: ">=8.0.0",
			yarn: "please-use-pnpm",
		},
	};

	const localConfig = {
		name: "TODO name from cli",
		description: "TODO description from cli (optional)",
		version: "0.0.0",
		files: ["dist"],
		sideEffects: false,
		type: "module",
		source: "./src/index.ts",
		main: "./dist/index.cjs",
		module: "./dist/index.mjs",
		types: "./dist/index.d.ts",
		exports: {
			".": {
				require: "./dist/index.cjs",
				import: "./dist/index.mjs",
				types: "./dist/index.d.ts",
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
			prepare: "stack install",
			clean: "stack clean",
			check: "stack check",
			fix: "stack fix",
			start: "turbo run start",
			build: "turbo run build",
			watch: "turbo run watch",
			release: "pnpm build && pnpm changeset release",
			"add:changelog": "pnpm changeset",
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
