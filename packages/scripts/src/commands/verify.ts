import { existsSync } from "fs";
import { resolve } from "path";
import { CWD } from "../constants";
import { exec, run } from "../helpers";

const lint = async () => {
	const args: string[] = [];

	if (existsSync(resolve(CWD, ".gitignore"))) {
		args.push("--ignore-path .gitignore");
	}

	return exec(`eslint . ${args.join(" ")}`);
};

const type = () => {
	return exec(`tsc --noEmit`);
};

const main = async () => {
	await run("Checking lint rules 🧐", lint());
	await run("Checking types 🧐", type());
};

main();
