import { exec, run } from "@adbayb/terminal-kit";
import { lint } from "../helpers";

const type = () => {
	return exec(`tsc --noEmit`);
};

export const main = async () => {
	await run("Checking lint rules 🧐", lint());
	await run("Checking types 🧐", type());
};
