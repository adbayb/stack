import { lint, run } from "../helpers";

const main = async () => {
	await run("Fixing lint rules 🚑", lint("--fix"));
};

main();
