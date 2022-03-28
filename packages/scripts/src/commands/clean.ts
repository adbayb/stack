import { helpers } from "termost";
import { CommandFactory } from "../types";

type CleanCommandContext = {
	files: Array<string>;
};

export const createCleanCommand: CommandFactory = (program) => {
	program
		.command<CleanCommandContext>({
			name: "clean",
			description: "Clean the project",
		})
		.task({
			key: "files",
			label: "Retrieving removable assets 🔍",
			handler() {
				return retrieveIgnoredFiles();
			},
		})
		.task({
			label({ files }) {
				return files.length > 0
					? `Cleaning ${files.join(", ")} assets 🧹`
					: "Already clean ✨";
			},
			handler({ files }) {
				return files.length > 0
					? cleanFiles(files.join(" "))
					: Promise.resolve();
			},
		});
};

const retrieveIgnoredFiles = async () => {
	// @note: ignored !== unversioned (ignored files are unversioned ones but unversioned aren't
	// necessarly ignored: for example, a newly create file which will be versioned later)

	const rawFiles = await helpers.exec(
		"git clean -fdXn | grep -v 'node_modules' | cut -c 14-"
	);

	return rawFiles.split(/\n/).filter(Boolean);
};

const cleanFiles = (fileList: string) => {
	return helpers.exec(`rm -rf ${fileList}`);
};
