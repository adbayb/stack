import { resolve } from "node:path";
import { helpers } from "termost";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { mkdir, symlink } from "node:fs/promises";

import type { CommandFactory } from "../types";
import {
	botMessage,
	createError,
	getNpmVersion,
	request,
	resolveFromProjectDirectory,
	resolveFromStackDirectory,
	setPkgManager,
} from "../helpers";
import defaultTemplateConfig from "../../templates/default/config.json";
import pkg from "../../package.json";

type CommandContext = {
	data: Record<
		| "licenseYear"
		| "nodeVersion"
		| "npmVersion"
		| "projectDescription"
		| "projectName"
		| "projectUrl"
		| "repoId",
		string
	>;
	inputDescription: string;
	inputName: string;
	inputUrl: string;
	previousTaskError: Error | undefined;
};

export const createCreateCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "create",
			description: "Scaffold a new project",
		})
		.task({
			handler() {
				botMessage(
					{
						title: `I'm Stack v${pkg.version}, your bot assistant`,
						description:
							"I can guarantee you a project creation in under 1 minute 🚀",
					},
					{
						type: "information",
					},
				);
			},
		})
		.input({
			key: "inputName",
			label: "What's your project name?",
			type: "text",
		})
		.input({
			key: "inputDescription",
			label: "How would you describe it?",
			type: "text",
		})
		.input({
			key: "inputUrl",
			label: "Where will it be stored? (Git remote URL)",
			type: "text",
		})
		.task({
			label: label("Checking pre-requisites"),
			async handler() {
				// Check pnpm availability by verifying its version
				await getNpmVersion();
			},
		})
		.task({
			key: "data",
			label: label("Evaluating contextual data"),
			async handler({ inputDescription, inputName, inputUrl }) {
				const nodeVersion = await request.get(
					"https://resolve-node.vercel.app/lts",
					"text",
				);

				const npmVersion = (
					await request.get(
						"https://registry.npmjs.org/pnpm/latest",
						"json",
					)
				).version as string;

				const { repoName, repoOwner } =
					(inputUrl.startsWith("git")
						? /^git@.*:(?<repoOwner>.*)\/(?<repoName>.*)\.git$/
						: /^https?:\/\/.*\/(?<repoOwner>.*)\/(?<repoName>.*)\.git$/
					).exec(inputUrl)?.groups ?? {};

				if (!repoOwner || !repoName) {
					throw createError(
						"git",
						"The owner and repository name can not be extracted. Please make sure to follow either `/^git@.*:(?<repoOwner>.*)/(?<repoName>.*).git$/` or `/^https?://.*/(?<repoOwner>.*)/(?<repoName>.*).git$/` pattern.",
					);
				}

				return {
					licenseYear: new Date().getFullYear().toString(),
					nodeVersion,
					npmVersion,
					projectDescription:
						inputDescription.charAt(0).toUpperCase() +
						inputDescription.slice(1), // Enforce upper case for the first letter
					projectName: inputName.toLowerCase(), // Enforce lower case for folder and package name
					projectUrl: inputUrl,
					projectVersion: "0.0.0",
					repoId: `${repoOwner}/${repoName}`,
				};
			},
		})
		.task({
			label({ data }) {
				return label(`Creating \`${data.projectName}\` folder`);
			},
			async handler({ data }) {
				const projectPath = resolve(process.cwd(), data.projectName);

				await mkdir(projectPath);
				process.chdir(projectPath);
			},
		})
		.task({
			label: label("Initializing `git`"),
			async handler({ data }) {
				await helpers.exec("git init");
				await helpers.exec(`git remote add origin ${data.projectUrl}`);
			},
		})
		.task({
			label: label("Applying default template"),
			async handler({ data }) {
				await extractTemplate();

				// Hydrate template expressions with context values:
				const engine = createTemplateEngine(
					defaultTemplateConfig,
					data,
				);

				engine.hydrate();
				engine.rename();
			},
		})
		.task({
			label: label("Installing dependencies"),
			async handler({ data }) {
				const localDevDependencies = ["quickbundle", "vitest"];

				const globalDevDependencies = [
					"@adbayb/eslint-config",
					"@adbayb/prettier-config",
					"@adbayb/ts-config",
					"@adbayb/stack",
				];

				try {
					await helpers.exec(
						`pnpm add ${globalDevDependencies.join(
							" ",
						)} --save-dev --ignore-workspace-root-check`,
					);

					await helpers.exec(
						`pnpm add ${localDevDependencies.join(
							" ",
						)} --save-dev --filter ${data.projectName}`,
					);
				} catch (error) {
					throw createError("pnpm", error);
				}
			},
		})
		.task({
			key: "previousTaskError",
			label: label("Cleaning up"),
			async handler({ data }) {
				try {
					// Symlink the package `README.md` file to the root project directory
					await symlink(
						`./${data.projectName}/README.md`,
						"./README.md",
					);
					// Set the Node package manager runtime by following the `packageManager` field instruction
					await setPkgManager();
					// Run install command to add git hooks
					await helpers.exec("stack install");
					// Commit (and run check/fix command via git hooks)
					await helpers.exec("git add -A");
					await helpers.exec('git commit -m "chore: initial commit"');

					return;
				} catch (error) {
					return error as Error;
				}
			},
		})
		.task({
			handler({ data, previousTaskError }) {
				if (previousTaskError) {
					botMessage(
						{
							title: "Oops, an error occurred",
							description:
								"Keep calm and carry on with some coffee ☕️",
							body: String(previousTaskError),
						},
						{
							type: "error",
						},
					);

					return;
				}

				botMessage(
					{
						title: "The project was successfully created",
						description: `Run \`cd ./${data.projectName}\` and Enjoy 🚀`,
					},
					{ type: "success" },
				);
			},
		});
};

const label = (message: string) => `${message} 🔨`;

/**
 * A simple template engine to evaluate dynamic expressions and apply side effets (such as hydrating a content with values from an input object) on impacted template files
 * @param config Configuration object listing template files/folders that need expression evaluation
 * @param input Input object mapping the template expression key with its corresponding value
 */
const createTemplateEngine = (
	config: Record<"files" | "folders", string[]>,
	input: CommandContext["data"],
) => {
	const evaluate = (expression: string) => {
		return expression.replace(
			/{{(.*?)}}/g,
			(_, key: keyof CommandContext["data"]) => input[key] || "",
		);
	};

	return {
		hydrate() {
			for (const filename of config.files) {
				const filepath = resolveFromProjectDirectory(filename);
				const content = readFileSync(filepath, "utf-8");

				writeFileSync(filepath, evaluate(content));
			}
		},
		rename() {
			try {
				for (const pathname of config.folders) {
					renameSync(
						resolveFromProjectDirectory(pathname),
						resolveFromProjectDirectory(evaluate(pathname)),
					);
				}
			} catch {
				// Silent error in case of stack re-creation
			}
		},
	};
};

const extractTemplate = async () => {
	const compressedFilePath = resolve(
		resolveFromStackDirectory("./templates"),
		"./default/content.tar.gz",
	);

	const destinationPath = resolveFromProjectDirectory("./");

	return helpers.exec(
		`tar -xzf ${compressedFilePath} -C ${destinationPath} --strip-components=1`,
	);
};
