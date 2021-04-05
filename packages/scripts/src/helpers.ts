import { spawn } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";
import createLogger from "progress-estimator";
import { CWD } from "./constants";

export const ERROR_SIGNATURE = "ERROR_SIGNATURE";

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

const logger = createLogger({
	spinner: {
		// @note: can be customized following presets available here https://github.com/sindresorhus/cli-spinners/blob/HEAD/spinners.json
		interval: 180,
		frames: ["🌍 ", "🌎 ", "🌏 "],
	},
});

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

export const logError = (message: string, isBold = false) => {
	console.error(`\x1b[${isBold ? "1;" : ""}91m%s\x1b[0m`, message, "\n");
};

export const lint = async (...args: string[]) => {
	if (existsSync(resolve(CWD, ".gitignore"))) {
		args.push("--ignore-path .gitignore");
	}

	return exec(`eslint . ${args.join(" ")}`);
};
