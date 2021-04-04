import { lint, run } from "../helpers";

export const main = async () => {
	await run("Fixing lint rules 🚑", lint("--fix"));
};
