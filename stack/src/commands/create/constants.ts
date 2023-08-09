import { join, resolve } from "node:path";

//export const PROJECT_FOLDER = process.cwd();
export const PROJECT_FOLDER = join(__dirname, "../dist"); // @todo remove (test purposes), replace with resolveFromRootProject
export const PACKAGE_FOLDER = resolve(__dirname, "../");
export const TEMPLATES_FOLDER = join(PACKAGE_FOLDER, "templates");
