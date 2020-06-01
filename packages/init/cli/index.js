#!/usr/bin/env node

const childProcess = require("child_process");
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;

const PROJECT_FOLDER = process.cwd();
const PACKAGE_FOLDER = path.resolve(__dirname, "../");
const TEMPLATES_FOLDER = path.join(PROJECT_FOLDER, "templates");

const DESTINATION_FOLDER = path.join(PROJECT_FOLDER, "tmp");
console.log({ PROJECT_FOLDER, PACKAGE_FOLDER });

const isObject = (value) => {
	return value !== null && typeof value === "object";
};

const merge = (target, ...sources) => {
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

const exec = (command) => {
	return childProcess
		.execSync(command)
		.toString()
		.replace(/(\r?\n|\r)$/, "");
};

const writeFileToProject = (baseName, content, checkIfExists) => {
	if (checkIfExists) {
		const destFileName = path.join(PROJECT_FOLDER, baseName);
		if (fs.existsSync(destFileName)) {
			throw new Error(
				`File ${baseName} already exists, please consider reviewing it manually`
			);
		}
	}

	return fsPromises.writeFile(
		path.join(DESTINATION_FOLDER, baseName),
		content,
		"utf-8"
	);
};

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
			extends: "@adbayb",
		},
		scripts: {
			format: "prettier --write .",
			lint: "eslint --fix",
		},
	};
	const targetPkg = path.join(PROJECT_FOLDER, "package.json");

	if (fs.existsSync(targetPkg)) {
		pkgConfig = merge(require(targetPkg), pkgConfig);
	}

	await writeFileToProject("package.json", JSON.stringify(pkgConfig));
};

async function run() {
	// @todo: future version => add possibility to specifiy language source (typescript / javascript / ...) via cli args ?
	const files = await fsPromises.readdir(TEMPLATES_FOLDER);

	files.forEach(async (file) => {
		const templateContent = await fsPromises.readFile(
			path.join(TEMPLATES_FOLDER, file),
			"utf-8"
		);
		// @todo: cli feedback
		await writeFileToProject(file, templateContent, true);
	});

	await processPkg();

	// @todo: npm i
}

run();
