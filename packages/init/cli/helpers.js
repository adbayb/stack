const childProcess = require("child_process");
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const { PROJECT_FOLDER } = require("./constants");

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
		.execSync(command, {
			cwd: PROJECT_FOLDER,
		})
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
		path.join(PROJECT_FOLDER, baseName),
		content,
		"utf-8"
	);
};

module.exports = {
	exec,
	merge,
	writeFileToProject,
};
