import { exec, lint, run } from "../helpers";

const type = () => {
	return exec(`tsc --noEmit`);
};

export const main = async () => {
	await run("Checking lint rules 🧐", lint());
	await run("Checking types 🧐", type());
};
