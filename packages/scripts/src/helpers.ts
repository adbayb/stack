import { existsSync } from "fs";
import { resolve } from "path";
import { helpers } from "termost";

export const scripts = (command: "clean") => {
	return helpers.exec(`scripts ${command}`, {
		hasLiveOutput: true,
	});
};

export const lint = async (...args: Array<string>) => {
	if (existsSync(resolve(process.cwd(), ".gitignore"))) {
		args.push("--ignore-path .gitignore");
	}

	return helpers.exec(`eslint . ${args.join(" ")}`, { hasLiveOutput: true });
};
