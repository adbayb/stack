import { resolve } from "node:path";
import { helpers } from "termost";

const getGitError = (error: unknown) => {
	return binError(
		"git",
		`The project must be a \`git\` repository. Have you tried to run \`git init\`?\n${error}`,
	);
};

export const getRootDir = async () => {
	try {
		return helpers.exec("git rev-parse --show-toplevel");
	} catch (error) {
		throw getGitError(error);
	}
};

export const getRepositoryUrl = async () => {
	try {
		return await helpers.exec("git remote get-url --push origin");
	} catch (error) {
		throw getGitError(error);
	}
};

export const resolveFromRootDir = async (path: string) => {
	const rootDir = await getRootDir();

	return resolve(rootDir, path);
};

export const binError = (bin: string, error: Error | string | unknown) => {
	return new Error(`\`${bin}\` failed:\n${error}`);
};
