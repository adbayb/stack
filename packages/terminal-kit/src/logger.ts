import createLogger from "progress-estimator";

export const logger = createLogger({
	spinner: {
		// @note: can be customized following presets available here https://github.com/sindresorhus/cli-spinners/blob/HEAD/spinners.json
		interval: 180,
		frames: ["🌍 ", "🌎 ", "🌏 "],
	},
});

export const logError = (message: string, isBold = false) => {
	console.error(`\x1b[${isBold ? "1;" : ""}91m%s\x1b[0m`, message, "\n");
};
