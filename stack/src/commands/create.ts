import { fdir } from "fdir";
import { cpSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { mkdir, symlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { helpers } from "termost";

import type { CommandFactory } from "../types";

import { VERSION } from "../constants";
import {
	botMessage,
	createError,
	getNpmVersion,
	request,
	resolveFromProjectDirectory,
	resolveFromStackDirectory,
	setPackageManager,
} from "../helpers";

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
	inputTemplate: Template;
	inputUrl: string;
};

type Template = "multi-projects" | "single-project";

export const createCreateCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			description: "Scaffold a new project",
			name: "create",
		})
		.task({
			handler() {
				botMessage({
					description:
						"I can guarantee you a project creation in under 1 minute 🚀",
					title: `I'm Stack v${VERSION}, your bot assistant`,
					type: "information",
				});
			},
		})
		.task({
			async handler() {
				// Check pnpm availability by verifying its version
				await getNpmVersion();
			},
			label: label("Check pre-requisites"),
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
			defaultValue: "git@github.com:adbayb/xxx.git",
			key: "inputUrl",
			label: "Where will it be stored? (Git remote URL)",
			type: "text",
		})
		.input({
			defaultValue: "single-project",
			key: "inputTemplate",
			label: "Which template you would like to apply?",
			options: ["single-project", "multi-projects"],
			type: "select",
		})
		.task({
			async handler({ inputDescription, inputName, inputUrl }) {
				if (!inputName) {
					throw createError(
						"stack create",
						"The project name is not optional. Make sure to provide a valid value (non-empty string).",
					);
				}

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

				const nodeVersion = await request.get(
					"https://resolve-node.vercel.app/lts",
					"text",
				);

				const { version: npmVersion } = await request.get(
					"https://registry.npmjs.org/pnpm/latest",
					"json",
				);

				return {
					licenseYear: new Date().getFullYear().toString(),
					nodeVersion: nodeVersion.replace("v", ""),
					npmVersion: String(npmVersion),
					projectDescription:
						inputDescription.charAt(0).toUpperCase() +
						inputDescription.slice(1), // Enforce upper case for the first letter
					projectName: inputName.toLowerCase(), // Enforce lower case for folder and package name
					projectUrl: inputUrl,
					repoId: `${repoOwner}/${repoName}`,
				};
			},
			key: "data",
			label: label("Check and format input"),
		})
		.task({
			async handler({ data }) {
				const projectPath = resolve(process.cwd(), data.projectName);

				await mkdir(projectPath);
				process.chdir(projectPath);
			},
			label({ data }) {
				return label(`Create \`${data.projectName}\` folder`);
			},
		})
		.task({
			async handler({ data }) {
				await helpers.exec("git init");
				await helpers.exec(`git remote add origin ${data.projectUrl}`);
			},
			label: label("Initialize `git`"),
		})
		.task({
			handler({ data, inputTemplate }) {
				applyTemplate(inputTemplate, data);
			},
			label: label("Apply template"),
		})
		.task({
			async handler({ data: { projectName }, inputTemplate }) {
				await symlink(
					join(
						inputTemplate === "single-project"
							? projectName
							: join("libraries", projectName),
						"README.md",
					),
					"./README.md",
				);
			},
			label: label("Create a symlink to `README.md` file"),
		})
		.task({
			async handler() {
				await setPackageManager();
			},
			label: label("Set up the package manager"),
		})
		.task({
			async handler({ data }) {
				const localDevelopmentDependencies = ["quickbundle", "vitest"];
				const globalDevelopmentDependencies = ["@adbayb/stack"];

				try {
					await helpers.exec(
						`pnpm add ${globalDevelopmentDependencies.join(
							" ",
						)} --save-dev --ignore-workspace-root-check`,
					);

					await helpers.exec(
						`pnpm add ${localDevelopmentDependencies.join(
							" ",
						)} --save-dev --filter ${data.projectName}`,
					);

					await helpers.exec("pnpm install");
				} catch (error) {
					throw createError("pnpm", error as Error);
				}
			},
			label: label("Install dependencies"),
		})
		.task({
			async handler() {
				await helpers.exec("stack install");
			},
			label: label("Run `stack install`"),
		})
		.task({
			async handler() {
				await helpers.exec("git add -A");
				await helpers.exec('git commit -m "chore: initial commit"');
			},
			label: label("Commit"),
		})
		.task({
			handler({ data }) {
				botMessage({
					description: `Run \`cd ./${data.projectName}\` and Enjoy 🚀`,
					title: "The project was successfully created",
					type: "success",
				});
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
		return content.replaceAll(
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

			const content = evaluate(readFileSync(templateFilePath, "utf8"));

			renameSync(templateFilePath, projectFilePath);
			writeFileSync(projectFilePath, content, "utf8");
		});

	/** Template folder mutations. */
	new fdir()
		.withBasePath()
		.onlyDirs()
		.filter((path) => {
			return templateExpressionRegExp.test(path);
		})
		.crawl(projectRootPath)
		.sync()
		// Re-order from longest to lowest path length to apply first renaming operations on deepest file structure
		.toSorted((a, b) => b.length - a.length)
		.forEach((templateFolderPath) => {
			const newPath = templateFolderPath.replaceAll(
				templateExpressionRegExp,
				(_, dataModelKey) => {
					return dataModel[dataModelKey as keyof typeof dataModel];
				},
			);

			renameSync(templateFolderPath, newPath);
		});
};
