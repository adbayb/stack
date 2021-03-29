import { exec, run } from "../helpers";

const retrieveIgnoredFiles = async () => {
	// @note: ignored !== unversioned (ignored files are unversioned ones but unversioned aren't
	// necessarly ignored: for example, a newly create file which will be versioned later)

	const rawFiles = await exec(
		"git clean -fdXn | grep -v 'node_modules' | cut -c 14-"
	);

	return rawFiles.split(/\n/).filter(Boolean);
};

const cleanFiles = (fileList: string) => {
	return exec(`rm -rf ${fileList}`);
};

const main = async () => {
	const files = await run(
		"Retrieving removable assets 🔍",
		retrieveIgnoredFiles()
	);

	files.length > 0
		? run(
				`Cleaning ${files.join(", ")} assets 🧹`,
				cleanFiles(files.join(" "))
		  )
		: run("Already clean ✨", Promise.resolve());
};

main();
