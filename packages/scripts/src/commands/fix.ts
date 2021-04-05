import { run } from "@adbayb/terminal-kit";
import { lint } from "../helpers";

export const main = async () => {
	await run("Fixing lint rules 🚑", lint("--fix"));
};
