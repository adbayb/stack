import { exec } from "../helpers/exec";
import { logger } from "../helpers/logger";

const retrieveIgnoredFiles = async () => {
	// @note: ignored !== unversioned (ignored files are unversioned ones but unversioned aren't
	// necessarly ignored: for example, a newly create file which will be versioned later)

	const rawFiles = await exec(
		"git clean -fdXn | grep -v 'node_modules' | cut -c 14-"
	);

	return rawFiles.replace(/\n/, " ");
};

const cleanFiles = async (fileList: string) => {
	exec(`rm -rf ${fileList}`);
};

const main = async () => {
	const files = await logger(
		retrieveIgnoredFiles(),
		"Retrieving removable assets 🔎"
	);

	files
		? logger(cleanFiles(files), `Cleaning ${files} assets 🧹`)
		: logger(Promise.resolve(), "Already clean ✨");
};

main();
