import createLogger from "progress-estimator";

export const logger = createLogger({
	spinner: {
		// @note: can be customized following presets available here https://github.com/sindresorhus/cli-spinners/blob/HEAD/spinners.json
		interval: 180,
		frames: ["🌍 ", "🌎 ", "🌏 "],
	},
});
