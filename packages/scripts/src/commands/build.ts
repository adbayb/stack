import { exec } from "../helpers";
import { main as clean } from "./clean";

export const main = async () => {
	await clean();
	await exec("quickbundle build");
};
