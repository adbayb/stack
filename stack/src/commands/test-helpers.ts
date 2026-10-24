import type { Termost } from "termost";
import type { CommandFactory } from "../types";

type CommandArguments = {
	command: string;
	operands: string[];
	options: Record<string, boolean | number | string>;
};

type CommandContext = Record<string, unknown>;

type Instruction = (context: CommandContext, argv: CommandArguments) => Promise<void> | void;

/**
 * Run registered command instructions without terminal prompts or process lifecycle hooks.
 *
 * @param factory - The command registration to exercise.
 * @returns A runner accepting explicit context values and filename operands.
 */
export const createCommandHarness = (factory: CommandFactory) => {
	const instructions: Instruction[] = [];
	let commandName = "";

	const createBuilder = <Values extends CommandContext>(): Termost<Values> => {
		const builder: Termost<Values> = {
			command(parameters) {
				commandName = parameters.name;

				return createBuilder();
			},
			input(parameters) {
				instructions.push((context, argv) => {
					if (parameters.skip?.(context as Values, argv)) {
						return;
					}

					const error = parameters.validate?.(context as Values, argv);

					if (error) {
						throw error;
					}
				});

				return builder;
			},
			option(parameters) {
				instructions.push((context) => {
					const key = String(parameters.key);

					context[key] ??= parameters.defaultValue;
				});

				return builder;
			},
			task(parameters) {
				instructions.push(async (context, argv) => {
					if (parameters.skip?.(context as Values, argv)) {
						return;
					}

					const output = await Promise.resolve(
						parameters.handler(context as Values, argv),
					);

					if (parameters.key !== undefined) {
						context[String(parameters.key)] = output;
					}
				});

				return builder;
			},
		};

		return builder;
	};

	factory(createBuilder());

	return async (context: CommandContext = {}, operands: string[] = []) => {
		const argv: CommandArguments = { command: commandName, operands, options: {} };

		for (const instruction of instructions) {
			await instruction(context, argv);
		}

		return context;
	};
};
