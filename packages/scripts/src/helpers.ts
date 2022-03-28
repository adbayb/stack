import { existsSync } from "fs";
import { resolve } from "path";
import { helpers } from "termost";

export const scripts = (command: "clean") => {
	return helpers.exec(`scripts ${command}`, {
		hasLiveOutput: true,
	});
};

const eslint =
	(options: { isFixMode: boolean }) =>
	async (files: FilenameCollection = []) => {
		const args = [...files];

		if (files.length === 0) {
			args.push("src/**");
		}

		if (existsSync(resolve(process.cwd(), ".gitignore"))) {
			args.push("--ignore-path .gitignore");
		}

		if (options.isFixMode) {
			args.push("--fix");
		}

		try {
			return await helpers.exec(`eslint ${args.join(" ")}`);
		} catch (error) {
			throw new Error(`\`eslint\` failed:\n${error}`);
		}
	};

export const lintRules = eslint({ isFixMode: false });

export const fixRules = eslint({ isFixMode: true });

export const lintTypes = async (files: FilenameCollection) => {
	try {
		return await helpers.exec(`tsc --noEmit ${files.join(" ")}`);
	} catch (error) {
		throw new Error(`\`tsc\` failed:\n${error}`);
	}
};

type FilenameCollection = Array<string>;
