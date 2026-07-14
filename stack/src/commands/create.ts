import { existsSync } from "node:fs";
import { cp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { helpers } from "termost";
import { VERSION } from "../constants";
import {
	botMessage,
	createError,
	getPnpmVersion,
	request,
	resolveFromPackageDirectory,
	resolveFromWorkingDirectory,
	setPackageManager,
} from "../helpers";
import type { CommandFactory } from "../types";

type CommandContext = {
	canRemoveExistingDirectoryInput: boolean;
	data: Record<
		| "licenseYear"
		| "nodeVersion"
		| "pnpmVersion"
		| "projectDescription"
		| "projectName"
		| "projectUrl"
		| "repoId"
		| "templatePath"
		| "workingPath",
		string
	>;
	inputDescription: string;
	inputName: string;
	inputTemplate: Template;
	inputUrl: string;
	templateEngine: TemplateEngine;
};

type Template = "multi-projects" | "single-project";

const REPOSITORY_REGEXP =
	/^(?:git@.*:|https?:\/\/.*\/)(?<repoOwner>[^/]+)\/(?<repoName>[^/]+)\.git$/u;

export const createCreateCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "create",
			description: "Scaffold a new project",
		})
		.task({
			handler() {
				botMessage({
					title: `I'm Stack v${VERSION} 👋`,
					description: "I can guarantee you a project creation in under 1 minute 🚀",
					type: "information",
				});
			},
		})
		.task({
			label: label("Check pre-requisites"),
			async handler() {
				// Check pnpm availability by verifying its version
				await getPnpmVersion();
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
			key: "data",
			label: label("Check and format input"),
			async handler({ inputDescription, inputName, inputTemplate, inputUrl }) {
				if (!inputName) {
					throw createError(
						"stack create",
						"The project name is not optional. Make sure to provide a valid value (non-empty string).",
					);
				}

				const { repoName, repoOwner } = REPOSITORY_REGEXP.exec(inputUrl)?.groups ?? {};

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

				const { version: pnpmVersion } = await request.get(
					"https://registry.npmjs.org/pnpm/latest",
					"json",
				);

				const projectName = slugify(inputName);

				return {
					licenseYear: new Date().getFullYear().toString(),
					nodeVersion: nodeVersion.replace("v", ""),
					pnpmVersion: String(pnpmVersion),
					projectDescription: toCapitalLetter(inputDescription),
					projectName,
					projectUrl: inputUrl,
					repoId: `${repoOwner}/${repoName}`,
					templatePath: resolveFromPackageDirectory("templates", inputTemplate),
					workingPath: resolveFromWorkingDirectory(projectName),
				};
			},
		})
		.input({
			key: "canRemoveExistingDirectoryInput",
			label({ data: { projectName } }) {
				return label(
					`\`${projectName}\` directory already exists, do you want to remove it?`,
				);
			},
			defaultValue: true,
			skip({ data: { workingPath } }) {
				return !existsSync(workingPath);
			},
			type: "confirm",
			validate({ canRemoveExistingDirectoryInput, data: { projectName } }) {
				if (canRemoveExistingDirectoryInput) {
					return;
				}

				return createError(
					"mkdir",
					`Remove or rename the \`${projectName}\` existing directory to apply the template from a clean state.`,
				);
			},
		})
		.task({
			key: "templateEngine",
			label({ data: { projectName }, inputTemplate }) {
				return label(`Copy \`${inputTemplate}\` template to \`${projectName}\` directory`);
			},
			async handler({
				canRemoveExistingDirectoryInput,
				data: {
					licenseYear,
					nodeVersion,
					pnpmVersion,
					projectDescription,
					projectName,
					projectUrl,
					repoId,
					templatePath,
					workingPath,
				},
				inputTemplate,
			}) {
				if (canRemoveExistingDirectoryInput) {
					await rm(workingPath, {
						force: true,
						recursive: true,
					});
				}

				return createTemplateEngine(workingPath, {
					projectName,
					templateModel: {
						licenseYear,
						nodeVersion,
						pnpmVersion,
						projectDescription,
						projectName,
						projectUrl,
						repoId,
					},
					templateName: inputTemplate,
					templatePath,
				});
			},
		})
		.task({
			label() {
				return label("Process template");
			},
			async handler({ templateEngine }) {
				await templateEngine.processContents();
				await templateEngine.processPaths();
			},
		})
		.task({
			label: label("Initialize `git`"),
			async handler({ data: { projectUrl } }) {
				await helpers.exec("git init");
				await helpers.exec(`git remote add origin ${projectUrl}`);
			},
		})
		.task({
			label: label("Set up the package manager"),
			async handler() {
				await setPackageManager();
			},
		})
		.task({
			label: label("Install dependencies"),
			async handler({ data: { projectName } }) {
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
						)} --save-dev --filter ${projectName}`,
					);

					await helpers.exec("pnpm install");
				} catch (error) {
					throw createError(
						"pnpm",
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			},
		})
		.task({
			label: label("Run `stack install`"),
			async handler() {
				await helpers.exec("stack install");
			},
		})
		.task({
			label: label("Commit"),
			async handler() {
				await helpers.exec("git add -A");
				await helpers.exec('git commit -m "chore: initial commit"');
			},
		})
		.task({
			handler({ data: { projectName } }) {
				botMessage({
					title: "The project was successfully created",
					description: `Run \`cd ./${projectName}\` and Enjoy 🚀`,
					type: "success",
				});
			},
		});
};

const label = (message: string) => {
	return `${message} 🔨`;
};

const slugify = (input: string) => {
	return input
		.toLowerCase()
		.replaceAll(/[^a-z0-9\s-]/gu, "")
		.trim()
		.replaceAll(/\s+/gu, "-")
		.replaceAll(/-+/gu, "-");
};

const toCapitalLetter = (input: string) => {
	return input.charAt(0).toUpperCase() + input.slice(1);
};

type TemplateEngine = {
	processContents: () => Promise<void>;
	processPaths: () => Promise<void>;
};

type TemplateEntry = {
	content: string;
	path: string;
	type: "content" | "path.directory" | "path.file";
};

type TemplateMetadata = {
	projectName: string;
	templateModel: Record<string, string>;
	templateName: string;
	templatePath: string;
};

export const createTemplateEngine = async (
	workingPath: string,
	{ projectName, templateModel, templateName, templatePath }: TemplateMetadata,
): Promise<TemplateEngine> => {
	if (!existsSync(workingPath)) {
		await mkdir(workingPath);
	}

	// Copy the selected template before mutation
	await cp(templatePath, workingPath, {
		force: true,
		recursive: true,
	});

	// Rename back `.gitignore` if available (since NPM prevents its inclusion during publication: https://docs.npmjs.com/cli/v10/using-npm/developers#keeping-files-out-of-your-package)
	const gitignoreFile = join(workingPath, ".gitignore.tmpl");

	if (existsSync(gitignoreFile)) {
		await rename(gitignoreFile, join(workingPath, ".gitignore"));
	}

	const templateEntries = await getTemplateEntries(workingPath);

	process.chdir(workingPath);

	return {
		async processContents() {
			await Promise.all(
				templateEntries
					.filter(({ type }) => {
						return type === "content";
					})
					.map(async (entry) => {
						await writeFile(entry.path, setTemplateVariables(entry, templateModel));
					}),
			);
		},
		async processPaths() {
			const sortedDirectoryEntries = templateEntries
				.filter(({ content, type }) => {
					if (type === "path.directory" || type === "path.file") {
						// Process only the basename to avoid renaming errors in deeply nested paths that rely on the original, non-computed template variable.
						return hasTemplateVariable(basename(content));
					}

					return false;
				})
				.toSorted(
					// Re-order from longest to lowest path length to rename deepest directory paths first
					({ path: pathA }, { path: pathB }) => {
						return pathB.length - pathA.length;
					},
				);

			for (const entry of sortedDirectoryEntries) {
				const newPath = setTemplateVariables(entry, templateModel);

				// oxlint-disable-next-line no-await-in-loop
				await rename(entry.path, newPath);
			}

			await symlink(
				join(
					templateName === "single-project"
						? projectName
						: join("libraries", projectName),
					"README.md",
				),
				"./README.md",
			);
		},
	};
};

const getTemplateEntries = async (path: string) => {
	const entries = await readdir(path, {
		recursive: true,
		withFileTypes: true,
	});

	const templateEntries = await Promise.all(
		entries.map(async (entry): Promise<TemplateEntry[]> => {
			const isDirectory = entry.isDirectory();

			if (!isDirectory && !entry.isFile()) {
				return [];
			}

			const entryPath = resolve(entry.parentPath, entry.name);

			const processableItems: Pick<TemplateEntry, "content" | "type">[] = isDirectory
				? [{ content: entryPath, type: "path.directory" }]
				: [
						{ content: entryPath, type: "path.file" },
						{
							content: await readFile(entryPath, "utf8"),
							type: "content",
						},
					];

			return processableItems
				.map(({ content, type }) => {
					if (!hasTemplateVariable(content)) {
						return undefined;
					}

					return {
						content,
						path: entryPath,
						type,
					};
				})
				.filter((input): input is TemplateEntry => {
					return Boolean(input);
				});
		}),
	);

	return templateEntries.flat();
};

const setTemplateVariables = (entry: TemplateEntry, model: TemplateMetadata["templateModel"]) => {
	return entry.content.replaceAll(TEMPLATE_VARIABLE_MATCHER, (match, dataModelKey: string) => {
		return model[dataModelKey] ?? match;
	});
};

const TEMPLATE_VARIABLE_MATCHER = /\{\{(.*?)\}\}/giu;

const hasTemplateVariable = (input: string) => {
	/**
	 * TemplateVariableMatcher.test() is not used since the `RegExp` is stateful when the global is
	 * used leading to some unstable results (relying on latest `lastIndex` set (lastIndex specifies
	 * the index at which to start the next match)). String.search is stateless.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test MDN documentation}.
	 */
	return input.search(TEMPLATE_VARIABLE_MATCHER) >= 0;
};
