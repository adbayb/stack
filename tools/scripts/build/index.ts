import { execa } from "execa";
import { fileURLToPath } from "node:url";

const isDev = process.argv.includes("--watch");

const BUNDLER_CONFIG_PATH = fileURLToPath(
	new URL("./rollup.config.ts", import.meta.url),
);

const COMMON_ROLLUP_OPTIONS = [
	"--config",
	BUNDLER_CONFIG_PATH,
	"--configPlugin",
	"rollup-plugin-swc3",
];

const main = async () => {
	if (isDev) {
		process.env.NODE_ENV ??= "development";

		return execa("rollup", [...COMMON_ROLLUP_OPTIONS, "-w"], {
			stdio: "inherit",
		});
	} else {
		process.env.NODE_ENV ??= "production";

		return execa("rollup", COMMON_ROLLUP_OPTIONS, {
			stdio: "inherit",
		});
	}
};

main().catch((error) => {
	console.error("❌ An error occurred while bundling files", error);
	process.exit(1);
});
