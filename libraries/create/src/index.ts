#!/usr/bin/env node

/**
 * @file Package proxy using `@adbayb/stack` to benefit from NPM initializer `npm init @adbayb`.
 * @see {@link https://docs.npmjs.com/cli/v9/commands/npm-init}
 */
import { helpers } from "termost";

helpers
	.exec("pnpm dlx @adbayb/stack create", {
		hasLiveOutput: true,
	})
	.catch((error) => {
		helpers.message(
			`An error occurred while executing the npm initializer \`@adbayb/create\` (error: ${error})`,
			{ type: "error" },
		);
	});
