import { exec, run } from "../helpers";

const wait = () => {
	return new Promise((resolve) => {
		setTimeout(resolve, 1000);
	});
};

const lint = async () => {
	await wait();

	return exec("eslint . --ignore-path .gitignore");
};

const type = () => {
	return exec(`tsc --noEmit`);
};

const main = async () => {
	await run("plop", wait());
	await run("Checking lint rules 🔎", lint());
	await run("Checking types 🔎", type());
};

main();
