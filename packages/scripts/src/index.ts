#!/usr/bin/env node

import { ERROR_SIGNATURE, logError } from "./helpers";

const command = process.argv[2];

switch (command) {
	case "build":
		require("./commands/build");

		break;
	case "clean":
		require("./commands/clean");

		break;
	case "verify":
		require("./commands/verify");

		break;
	case "fix":
		require("./commands/fix");

		break;
	case "watch":
		require("./commands/watch");

		break;
	default:
		// @todo: make a log library that could be used across the monorepo:
		throw new ReferenceError("Command not found");
}

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
