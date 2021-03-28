import { exec as childProcessExec } from "child_process";
import { promisify } from "util";

const pExec = promisify(childProcessExec);

export const exec = async (command: string, cwd = process.cwd()) => {
	const errorMessage = `❌ An error occurred while executing ${command}`;

	try {
		const { stdout, stderr } = await pExec(command, { cwd });

		if (stderr) {
			throw new Error(errorMessage);
		}

		return stdout.trim();
	} catch (error) {
		throw new Error(errorMessage);
	}
};
