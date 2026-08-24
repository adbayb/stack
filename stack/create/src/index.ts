/**
 * @file Package proxy using `@adbayb/stack` to benefit from NPM initializer `npm init @adbayb`.
 * @see {@link https://docs.npmjs.com/cli/v9/commands/npm-init}
 */
import { createLogger, exec } from "termost";

const logger = createLogger({ name: "@adbayb/create" });

try {
	// oxlint-disable-next-line node/no-top-level-await
	await exec("pnx @adbayb/stack create", {
		hasLiveOutput: true,
	});
} catch (error) {
	logger.error(
		`An error occurred while executing the npm initializer \`@adbayb/create\` (error: ${String(error)})`,
	);
}
