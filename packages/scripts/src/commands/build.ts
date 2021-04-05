import { exec } from "@adbayb/terminal-kit";
import { main as clean } from "./clean";

export const main = async () => {
	await clean();
	await exec("quickbundle build", true);
};
