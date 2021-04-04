#!/usr/bin/env node

import { ERROR_SIGNATURE, logError } from "./helpers";

const command = process.argv[2] || "";

import(`./commands/${command}`)
	.then((module) => module.main())
	.catch((error) => {
		if (error.code === "MODULE_NOT_FOUND") {
			throw new ReferenceError(`Command "${command}" not found`);
		} else {
			throw error;
		}
	});

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
