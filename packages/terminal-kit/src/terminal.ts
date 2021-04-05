import { spawn } from "child_process";
import { CWD, ERROR_SIGNATURE } from "./constants";
import { logError, logger } from "./logger";

export const exec = async (command: string, displayOutput = false) => {
	return new Promise<string>((resolve, reject) => {
		let stdout = "";
		let stderr = "";
		const [bin, ...args] = command.split(" ") as [string, ...string[]];

		const childProcess = spawn(bin, args, {
			cwd: CWD,
			shell: true,
			stdio: "pipe",
			env: {
				...process.env,
				// @note: make sure to force color display for spawned processes
				FORCE_COLOR: "1",
			},
		});

		childProcess.stdout.on("data", (chunk) => {
			stdout += chunk;

			if (displayOutput) {
				process.stdout.write(chunk);
			}
		});

		childProcess.stderr.on("data", (chunk) => {
			stderr += chunk;

			if (displayOutput) {
				process.stdout.write(stderr);
			}
		});

		childProcess.on("close", (exitCode) => {
			if (exitCode !== 0) {
				reject(stderr.trim());
			} else {
				resolve(stdout.trim());
			}
		});
	});
};

export const run = async <ReturnValue>(
	label: string,
	command: Promise<ReturnValue>
): Promise<ReturnValue> | never => {
	try {
		return await logger(command, label);
	} catch (error) {
		logError(`𐄂 ${label}`, true);

		if (typeof error.stdout === "string") {
			logError(error.stdout.trim());
		} else {
			logError(error.message);
		}

		throw new Error(ERROR_SIGNATURE);
	}
};

export const setup = () => {
	// @section: gracefully shutdown our cli:
	process.on("SIGTERM", () => {
		process.exit(0);
	});

	process.on("SIGINT", () => {
		process.exit(0);
	});

	process.on("uncaughtException", (error) => {
		if (error.message !== ERROR_SIGNATURE) {
			// @note: log error only if it was not already displayed
			// previously (managed error are flagged with ERROR_SIGNATURE)
			logError(error.message);
		}

		process.exit(1);
	});

	process.on("unhandledRejection", (reason) => {
		if (reason instanceof Error && reason.message !== ERROR_SIGNATURE) {
			logError(reason.message);
		}

		process.exit(1);
	});
};
