import { CommandFactory } from "@adbayb/scripts/src/types";
import { execQuickbundle } from "../helpers";

export const createServeCommand: CommandFactory = (program) => {
	program
		.command({
			name: "serve",
			description: "Serve, watch and rebuild assets on any code change from an HTML entrypoint",
		})
		.task({
			handler(_, argv) {
                const filename = argv.operands[0]

                if(!filename) {
                    throw new Error("No HTML entrypoint has been provided. Usage example: `scripts serve public/index.html`")
                }

                if(!filename.endsWith(".html")) {
                    throw new Error(`${filename} might not be an HTML file. Please rename it to end with \`.html\` extension`)
                }

				return execQuickbundle("watch", `--serve ${argv.operands[0]}`);
			},
		});
};
