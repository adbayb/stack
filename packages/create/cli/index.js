#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const ora = require("ora");

const { exec, merge, writeFileToProject, logger } = require("./helpers");
const { PROJECT_FOLDER, TEMPLATES_FOLDER } = require("./constants");

const fsPromises = fs.promises;

const processPkg = async () => {
	let rootPath = PROJECT_FOLDER;
	let repositoryUrl = "";

	try {
		[repositoryUrl, rootPath] = await Promise.all([
			exec("git remote get-url --push origin"),
			exec("git rev-parse --show-toplevel"),
		]);
	} catch (error) {
		// Nothing
	}

	const isMonorepo = rootPath !== PROJECT_FOLDER;

	const directory = isMonorepo
		? PROJECT_FOLDER.replace(new RegExp(`^${rootPath}/`), "")
		: "";

	let pkgConfig = {
		author: {
			name: "Ayoub Adib",
			email: "adbayb@gmail.com",
			url: "https://twitter.com/adbayb",
		},
		repository: {
			type: "git",
			url: repositoryUrl,
			...(isMonorepo && { directory }),
		},
		license: "MIT",
		scripts: {
			verify: "yarn lint & tsc --noEmit",
			fix: "yarn lint --fix",
			lint: "eslint . --ignore-path .gitignore",
			format: "prettier . --ignore-path .gitignore --ignore-path .prettierignore --write",
		},
		prettier: "@adbayb/prettier-config",
		eslintConfig: {
			...(isMonorepo && { root: true }), // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
			extends: "@adbayb",
		},
		husky: {
			hooks: {
				"pre-commit": "lint-staged",
			},
		},
		"lint-staged": {
			"**/*.{js,jsx,ts,tsx}": ["yarn lint"],
			"**/*.{json,md,mdx,html,css}": ["yarn format"],
		},
	};

	const targetPkg = path.join(PROJECT_FOLDER, "package.json");

	if (fs.existsSync(targetPkg)) {
		pkgConfig = merge(require(targetPkg), pkgConfig);
	}

	return writeFileToProject(
		"package.json",
		JSON.stringify(pkgConfig, null, 2)
	);
};

const copyTemplates = async () => {
	const files = await fsPromises.readdir(TEMPLATES_FOLDER);

	return Promise.all(
		files.map(async (sourceFileName) => {
			return new Promise((resolve, reject) => {
				// @note: we suffix all templates with `.tmpl` to avoid npm publish postprocessing
				// By default, .gitignore and .npmrc are excluded and using "files" package.json field
				// solves the issue partially since npm post-transform by renaming .gitignore to .npmignore
				const destinationFileName = path.parse(sourceFileName).name;

				fs.copyFile(
					path.join(TEMPLATES_FOLDER, sourceFileName),
					path.join(PROJECT_FOLDER, destinationFileName),
					(error) => {
						if (error) {
							reject(error.toString());
						} else {
							resolve();
						}
					}
				);
			});
		})
	);
};

const install = async () => {
	await exec("yarn add typescript@latest --dev");
	await exec("yarn add eslint@latest --dev");
	await exec("yarn add prettier@latest --dev");
	await exec("yarn add @adbayb/eslint-config@latest --dev");
	await exec("yarn add @adbayb/prettier-config@latest --dev");
	await exec("yarn add @adbayb/ts-config@latest --dev");
	await exec("yarn add @adbayb/create@latest --dev"); // @todo: replace with @adbayb/scripts once ready (scripts should hoist the husky and other core dev packages)
};

const clean = async () => {
	try {
		await exec("yarn lint");
		await exec("yarn format");
	} catch (error) {
		// @note: encapsulate lint/format logic to be error tolerant in case of new project without any files
	}
};

const run = async () => {
	const spinner = ora().start();

	const runStep = async (message, asyncFunction) => {
		try {
			spinner.start();
			spinner.text = message;
			await asyncFunction();
			spinner.succeed();
		} catch (error) {
			spinner.fail();

			throw error;
		}
	};

	await runStep("Apply templates", copyTemplates);
	await runStep("Process `package.json`", processPkg);
	await runStep("Install dependencies", install);
	await runStep("Verify and clean project with 🦦 standards", clean);
	spinner.stop();
	logger.flush();
};

// @todo: future version => add possibility to specifiy language source (typescript / javascript / ...) via cli args ?
try {
	run();
} catch (error) {
	logger.log(error.toString(), "error");
	logger.flush();
	process.exit(1);
}
