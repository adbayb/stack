import process from "node:process";
import { join, resolve } from "node:path";
import { mkdir, symlink } from "node:fs/promises";
import { cpSync, readFileSync, renameSync, writeFileSync } from "node:fs";

import { helpers } from "termost";
import { fdir } from "fdir";

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
import { VERSION } from "../constants";

type Template = "multi-projects" | "single-project";

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
	error: Error | undefined;
	inputDescription: string;
	inputName: string;
	inputTemplate: Template;
	inputUrl: string;
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
						title: `I'm Stack v${VERSION}, your bot assistant`,
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
			defaultValue: "git@github.com:adbayb/xxx.git",
			type: "text",
		})
		.input({
			key: "inputTemplate",
			label: "Which template you would like to apply?",
			defaultValue: "single-project",
			options: ["single-project", "multi-projects"],
			type: "select",
		})
		.task({
			label: label("Check pre-requisites"),
			async handler() {
				// Check pnpm availability by verifying its version
				await getNpmVersion();
			},
		})
		.task({
			key: "data",
			label: label("Evaluate contextual data"),
			async handler({ inputDescription, inputName, inputUrl }) {
				const nodeVersion = (
					await request.get("https://resolve-node.vercel.app/lts", "text")
				).replace("v", "");

				const npmVersion = (
					await request.get("https://registry.npmjs.org/pnpm/latest", "json")
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
					repoId: `${repoOwner}/${repoName}`,
				};
			},
		})
		.task({
			label({ data }) {
				return label(`Create \`${data.projectName}\` folder`);
			},
			async handler({ data }) {
				const projectPath = resolve(process.cwd(), data.projectName);

				await mkdir(projectPath);
				process.chdir(projectPath);
			},
		})
		.task({
			label: label("Initialize `git`"),
			async handler({ data }) {
				await helpers.exec("git init");
				await helpers.exec(`git remote add origin ${data.projectUrl}`);
			},
		})
		.task({
			label: label("Apply template"),
			handler({ data, inputTemplate }) {
				applyTemplate(inputTemplate, data);
			},
		})
		.task({
			label: label("Install dependencies"),
			async handler({ data }) {
				const localDevDependencies = ["quickbundle", "vitest"];
				const globalDevDependencies = ["@adbayb/stack"];

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
					throw createError("pnpm", error as Error);
				}
			},
		})
		.task({
			key: "error",
			label: label("Clean up"),
			async handler({ data }) {
				try {
					// Symlink the package `README.md` file to the root project directory
					await symlink(`./${data.projectName}/README.md`, "./README.md");
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
			handler({ data, error }) {
				if (error) {
					botMessage(
						{
							title: "Oops, an error occurred",
							description: "Keep calm and carry on with some coffee ☕️",
							body: String(error),
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
 * A simple template engine to evaluate dynamic expressions and apply side effets (such as hydrating a content with values from an input object) on impacted template files.
 * @param template - The selected template.
 * @param dataModel - Data model mapping the template expression key with its corresponding value.
 * @example
 * applyTemplate(
 * 	{ toReplace: "value" },
 * );
 */
const applyTemplate = (
	template: Template,
	dataModel: CommandContext["data"],
) => {
	const templateExtension = ".tmpl";

	const templateRootPath = resolveFromStackDirectory(
		join("./templates", template),
	);

	const projectRootPath = resolveFromProjectDirectory("./");
	const templateExpressionRegExp = /{{(.*?)}}/g;

	const evaluate = (content: string) => {
		return content.replace(
			templateExpressionRegExp,
			(_, key: keyof CommandContext["data"]) => dataModel[key] || "",
		);
	};

	/** Copy the template before mutations. */
	cpSync(templateRootPath, projectRootPath, {
		force: true,
		recursive: true,
	});

	/** Template file mutations. */
	new fdir()
		.withBasePath()
		.glob(`**/*${templateExtension}`)
		.crawl(projectRootPath)
		.sync()
		.forEach((templateFilePath) => {
			const projectFilePath = templateFilePath.slice(
				0,
				templateFilePath.lastIndexOf(templateExtension),
			);

			const content = evaluate(readFileSync(templateFilePath, "utf-8"));

			renameSync(templateFilePath, projectFilePath);
			writeFileSync(projectFilePath, content, "utf-8");
		});

	/** Template folder mutations. */
	new fdir()
		.withBasePath()
		.onlyDirs()
		.filter((path) => {
			return Boolean(templateExpressionRegExp.exec(path));
		})
		.crawl(projectRootPath)
		.sync()
		// Re-order from longest to lowest path length to apply first renaming operations on deepest file structure
		.sort((a, b) => b.length - a.length)
		.forEach((templateFolderPath) => {
			const newPath = templateFolderPath.replace(
				templateExpressionRegExp,
				(_, dataModelKey) => {
					return dataModel[dataModelKey as keyof typeof dataModel];
				},
			);

			renameSync(templateFolderPath, newPath);
		});
};
