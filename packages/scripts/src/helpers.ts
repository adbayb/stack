import { exec } from "@adbayb/terminal-kit";
import { existsSync } from "fs";
import { resolve } from "path";

export const lint = async (...args: string[]) => {
	if (existsSync(resolve(process.cwd(), ".gitignore"))) {
		args.push("--ignore-path .gitignore");
	}

	return exec(`eslint . ${args.join(" ")}`);
};
