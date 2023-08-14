import { resolve } from "node:path";
import { helpers } from "termost";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { mkdir, symlink } from "node:fs/promises";

import type { CommandFactory } from "../types";
import {
	createError,
	request,
	resolveFromProjectDirectory,
	resolveFromStackDirectory,
} from "../helpers";
import defaultTemplateConfig from "../../templates/default/config.json";

type CreateCommandContext = {
	previousTaskError: Error | undefined;
	projectName: string;
	projectDescription: string;
	projectUrl: string;
	templateInput: Record<
		| "license_year"
		| "node_version"
		| "npm_version"
		| "project_description"
		| "project_name"
		| "repo_id",
		string
	>;
};

export const createCreateCommand: CommandFactory = (program) => {
	program
		.command<CreateCommandContext>({
			name: "create",
			description: "Scaffold a new project",
		})
		.task({
			handler() {
				botMessage(
					{
						title: "I'm Stack, your bot assistant",
						description:
							"I can guarantee you a project creation in under 30 seconds 🚀",
					},
					{
						type: "information",
					},
				);
			},
		})
		.input({
			type: "text",
			key: "projectName",
			label: "What's your project name?",
		})
		.input({
			type: "text",
			key: "projectDescription",
			label: "How would you describe it?",
		})
		.input({
			type: "text",
			key: "projectUrl",
			label: "Where will it be stored? (Git remote URL)",
		})
		.task({
			label({ projectName }) {
				return `Create \`${projectName}\` folder`;
			},
			async handler({ projectName }) {
				const projectPath = resolve(process.cwd(), projectName);

				await mkdir(projectPath);
				process.chdir(projectPath);
			},
		})
		.task({
			label: "Initialize Git",
			async handler({ projectUrl }) {
				await helpers.exec("git init");
				await helpers.exec(`git remote add origin ${projectUrl}`);
			},
		})
		.task({
			key: "templateInput",
			label: "Evaluate template expressions",
			async handler({ projectDescription, projectName, projectUrl }) {
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

				const { repoOwner, repoName } =
					projectUrl.match(
						projectUrl.startsWith("git")
							? /^git@.*:(?<repoOwner>.*)\/(?<repoName>.*)\.git$/
							: /^https?:\/\/.*\/(?<repoOwner>.*)\/(?<repoName>.*)\.git$/,
					)?.groups ?? {};

				if (!repoOwner || !repoName) {
					throw createError(
						"git",
						"The owner and repository name can not be extracted. Please make sure to follow either `/^git@.*:(?<repoOwner>.*)/(?<repoName>.*).git$/` or `/^https?://.*/(?<repoOwner>.*)/(?<repoName>.*).git$/` pattern.",
					);
				}

				return {
					license_year: new Date().getFullYear().toString(),
					node_version: nodeVersion,
					npm_version: npmVersion,
					repo_id: `${repoOwner}/${repoName}`,
					project_description: projectDescription,
					project_name: projectName,
				};
			},
		})
		.task({
			label: "Apply the default template",
			async handler({ templateInput }) {
				await extractTemplate();

				// Hydrate template expressions with context values:
				const engine = createTemplateEngine(
					defaultTemplateConfig,
					templateInput,
				);

				engine.hydrate();
				engine.rename();
			},
		})
		.task({
			label: "Install dependencies",
			async handler({ templateInput }) {
				const localDevDependencies = ["quickbundle"];

				const globalDevDependencies = [
					"@adbayb/eslint-config",
					"@adbayb/prettier-config",
					"@adbayb/ts-config",
					"@adbayb/stack",
					"@changesets/changelog-github",
					"@changesets/cli",
					"@commitlint/cli",
					"@commitlint/config-conventional",
					"eslint",
					"prettier",
					"turbo",
					"typescript",
				];

				try {
					for (const dependency of globalDevDependencies) {
						await helpers.exec(
							`pnpm add ${dependency}@latest --save-dev --ignore-workspace-root-check`,
						);
					}

					for (const dependency of localDevDependencies) {
						await helpers.exec(
							`pnpm add ${dependency}@latest --save-dev --filter ${templateInput.project_name}`,
						);
					}
				} catch (error) {
					throw createError("pnpm", error);
				}
			},
		})
		.task({
			label: "Clean up",
			key: "previousTaskError",
			async handler({ templateInput }) {
				try {
					// Symlink the package `README.md` file to the root project directory
					await symlink(
						resolveFromProjectDirectory(
							`./${templateInput.project_name}/README.md`,
						),
						resolveFromProjectDirectory(`./README.md`),
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
			handler({ previousTaskError, projectName }) {
				if (previousTaskError) {
					botMessage(
						{
							title: `Oops, an error occurred`,
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
						title: `Project successfully created: enter it using \`cd ./${projectName}\``,
						description: "Enjoy 🚀",
					},
					{ type: "success" },
				);
			},
		});
};

const botMessage = (
	input: { title: string; description: string; body?: string },
	options: Parameters<typeof helpers.message>[1],
) => {
	return helpers.message(
		`
╭─────╮
│ ◠   ◠  ${input.title}
│   ${options?.type === "error" ? "◠" : "◡"} │  ${input.description}
╰─────╯
${
	!input.body
		? ""
		: `
${input.body}
`
}`,
		options,
	);
};

/**
 * A simple template engine to evaluate dynamic expressions and apply side effets (such as hydrating a content with values from an input object) on impacted template files
 * @param config Configuration object listing template files/folders that need expression evaluation
 * @param input Input object mapping the template expression key with its corresponding value
 */
const createTemplateEngine = (
	config: Record<"files" | "folders", Array<string>>,
	input: CreateCommandContext["templateInput"],
) => {
	const evaluate = (expression: string) => {
		return expression.replace(
			/{{(.*?)}}/g,
			(_, key: keyof CreateCommandContext["templateInput"]) =>
				input[key] || "",
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

const setPkgManager = () => {
	return helpers.exec("corepack enable");
};
