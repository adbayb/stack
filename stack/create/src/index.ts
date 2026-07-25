/**
 * @file Package proxy using `@adbayb/stack` to benefit from NPM initializer `npm init @adbayb`.
 * @see {@link https://docs.npmjs.com/cli/v9/commands/npm-init}
 */
import { helpers } from "termost";

try {
	// oxlint-disable-next-line node/no-top-level-await
	await helpers.exec("pnx @adbayb/stack create", {
		hasLiveOutput: true,
	});
} catch (error) {
	helpers.message(
		`An error occurred while executing the npm initializer \`@adbayb/create\` (error: ${String(error)})`,
		{ type: "error" },
	);
}
