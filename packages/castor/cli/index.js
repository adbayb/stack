#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const { exec, merge, writeFileToProject } = require("./helpers");
const { PROJECT_FOLDER, TEMPLATES_FOLDER } = require("./constants");

const processPkg = async () => {
	const repositoryUrl = exec("git remote get-url --push origin");
	const rootPath = exec("git rev-parse --show-toplevel");
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
		prettier: "@adbayb/prettier-config",
		eslintConfig: {
			...(isMonorepo && { root: true }), // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
			extends: "@adbayb",
		},
		scripts: {
			format: "prettier --write .",
			lint: "eslint . --fix --ignore-path .gitignore",
		},
	};
	const targetPkg = path.join(PROJECT_FOLDER, "package.json");

	if (fs.existsSync(targetPkg)) {
		pkgConfig = merge(require(targetPkg), pkgConfig);
	}

	await writeFileToProject(
		"package.json",
		JSON.stringify(pkgConfig, null, 2)
	);
};

const processTemplates = async () => {
	const files = await fsPromises.readdir(TEMPLATES_FOLDER);

	return Promise.all(
		files.map(async (file) => {
			const templateContent = await fsPromises.readFile(
				path.join(TEMPLATES_FOLDER, file),
				"utf-8"
			);

			await writeFileToProject(file, templateContent, true);
		})
	);
};

const processInstallation = () => {
	exec("npm i @adbayb/init --save");
};

async function run() {
	// @todo: future version => add possibility to specifiy language source (typescript / javascript / ...) via cli args ?
	// @todo: cli feedback

	await processTemplates();
	await processPkg();
	processInstallation();
}

run();
