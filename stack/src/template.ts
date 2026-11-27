import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { exec } from "termost";
import { VERSION } from "./constants";
import {
	createError,
	resolveFromPackageDirectory,
	resolveFromWorkingDirectory,
	toShellArgument,
} from "./helpers";
import type { PackageJson } from "./types";

export type Template = "multi-projects" | "single-project";

/** A pending template change: the merged content to write, or `undefined` to remove the file. */
export type TemplateChange = {
	content: string | undefined;
	hasConflict: boolean;
	path: string;
};

export type TemplateModel = Partial<Record<string, string>>;

type RootPackageJson = Partial<Pick<PackageJson, "devDependencies">> & {
	devEngines?: Partial<Record<"packageManager" | "runtime", { version?: string }>>;
};

export const REPOSITORY_REGEXP =
	/^(?:git@.*:|https?:\/\/.*\/)(?<repoOwner>[^/]+)\/(?<repoName>[^/]+)\.git$/u;

const TEMPLATE_VARIABLE_MATCHER = /\{\{(.*?)\}\}/giu;
const EXACT_VERSION_REGEXP = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/u;
const PUBLISHED_SUFFIX_REGEXP = /\.tmpl$/u;

/**
 * Replace `{{key}}` template variables with their model value, keeping unknown ones as is.
 *
 * @param content - The template content.
 * @param model - The variable values.
 * @returns The rendered content.
 */
export const renderTemplate = (content: string, model: TemplateModel) => {
	return content.replaceAll(TEMPLATE_VARIABLE_MATCHER, (match, key: string) => {
		return model[key] ?? match;
	});
};

/**
 * Check whether the input contains a template variable.
 *
 * @param input - The content or path to inspect.
 * @returns `true` if a `{{key}}` variable is found.
 */
export const hasTemplateVariable = (input: string) => {
	/**
	 * TemplateVariableMatcher.test() is not used since the `RegExp` is stateful when the global is
	 * used leading to some unstable results (relying on latest `lastIndex` set (lastIndex specifies
	 * the index at which to start the next match)). String.search is stateless.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test MDN documentation}.
	 */
	return input.search(TEMPLATE_VARIABLE_MATCHER) >= 0;
};

/**
 * Bring the template changes released since the default branch's `@adbayb/stack` version into the
 * working directory with a 3-way merge: template changes apply, local edits stay, and overlapping
 * edits get conflict markers.
 *
 * @param options - The sync options.
 * @param options.fromVersion - The base version, read from the remote default branch by default.
 * @param options.isDryRun - Compute the changes without writing them.
 * @returns The pending (or applied) changes; empty when the project is up to date.
 */
export const syncTemplate = async (options: {
	fromVersion?: string | undefined;
	isDryRun: boolean;
}) => {
	const { fromVersion, isDryRun } = options;
	const packageJson = await readFile(resolveFromWorkingDirectory("package.json"), "utf8");

	// Projects not pinned to a published version (such as this repository) have nothing to sync.
	if (!isExactVersion(getStackVersion(packageJson))) {
		return [];
	}

	const baseVersion = fromVersion ?? (await getDefaultBranchStackVersion());

	if (!isExactVersion(baseVersion) || baseVersion === VERSION) {
		return [];
	}

	const template: Template = existsSync(resolveFromWorkingDirectory("libraries"))
		? "multi-projects"
		: "single-project";

	const temporaryDirectory = await mkdtemp(join(tmpdir(), "stack-sync-"));

	try {
		const changes = await getTemplateChanges(
			await downloadTemplate(baseVersion, template, temporaryDirectory),
			resolveFromPackageDirectory("templates", template),
			await getTemplateModel(packageJson),
		);

		if (!isDryRun) {
			await applyTemplateChanges(changes);
		}

		return changes;
	} finally {
		await rm(temporaryDirectory, { force: true, recursive: true });
	}
};

/**
 * Compute the changes moving the working directory from the base template to the next one.
 *
 * @param basePath - The template the project was last synced with.
 * @param nextPath - The template to sync with.
 * @param model - The variable values to render both templates with.
 * @returns The files whose content would change.
 */
export const getTemplateChanges = async (
	basePath: string,
	nextPath: string,
	model: TemplateModel,
) => {
	const [baseFiles, nextFiles] = await Promise.all([
		readTemplate(basePath, model),
		readTemplate(nextPath, model),
	]);

	const changes: TemplateChange[] = [];

	for (const path of [...new Set([...baseFiles.keys(), ...nextFiles.keys()])].toSorted()) {
		const base = baseFiles.get(path);
		const next = nextFiles.get(path);
		const current = await readOptionalFile(resolveFromWorkingDirectory(path));

		if (base === next || current === next) {
			continue;
		}

		if (current === undefined) {
			// A file present in the base template but missing locally was removed on purpose.
			if (base === undefined) {
				changes.push({ content: next, hasConflict: false, path });
			}

			continue;
		}

		if (next === undefined) {
			// Only remove a file dropped by the template if it holds no local edits.
			if (current === base) {
				changes.push({ content: undefined, hasConflict: false, path });
			}

			continue;
		}

		const merge =
			current === base
				? { content: next, hasConflict: false }
				: await mergeFile(path, base ?? "", next);

		// Skip template changes the project already holds.
		if (merge.content !== current) {
			changes.push({ path, ...merge });
		}
	}

	return changes;
};

const applyTemplateChanges = async (changes: TemplateChange[]) => {
	for (const { content, path } of changes) {
		const absolutePath = resolveFromWorkingDirectory(path);

		if (content === undefined) {
			await rm(absolutePath, { force: true });
		} else {
			await mkdir(dirname(absolutePath), { recursive: true });
			await writeFile(absolutePath, content);
		}
	}
};

const readTemplate = async (root: string, model: TemplateModel) => {
	const entries = await readdir(root, { recursive: true, withFileTypes: true });
	const files = new Map<string, string>();

	for (const entry of entries) {
		if (!entry.isFile()) {
			continue;
		}

		const path = join(entry.parentPath, entry.name);

		// `.tmpl` files are published under another name (npm drops `.gitignore` files).
		files.set(
			renderTemplate(relative(root, path), model).replace(PUBLISHED_SUFFIX_REGEXP, ""),
			renderTemplate(await readFile(path, "utf8"), model),
		);
	}

	return files;
};

const mergeFile = async (path: string, base: string, next: string) => {
	const directory = await mkdtemp(join(tmpdir(), "stack-merge-"));

	try {
		const basePath = join(directory, "base");
		const nextPath = join(directory, "next");

		await Promise.all([writeFile(basePath, base), writeFile(nextPath, next)]);

		// Exit status: 0 for a clean merge, the conflict count otherwise, and negative on error.
		const { error, status, stdout } = spawnSync(
			"git",
			[
				"merge-file",
				"--stdout",
				"-L",
				path,
				"-L",
				"base template",
				"-L",
				`@adbayb/stack@${VERSION} template`,
				resolveFromWorkingDirectory(path),
				basePath,
				nextPath,
			],
			{ encoding: "utf8" },
		);

		if (error !== undefined || status === null || status < 0) {
			throw createError("git merge-file", error ?? `Failed to merge \`${path}\`.`);
		}

		return { content: stdout, hasConflict: status > 0 };
	} finally {
		await rm(directory, { force: true, recursive: true });
	}
};

const getDefaultBranchStackVersion = async () => {
	const isShallow = (await exec("git rev-parse --is-shallow-repository")) === "true";

	try {
		// Fetch only the remote default branch tip (`HEAD`), keeping shallow CI clones shallow.
		await exec(`git fetch --no-tags ${isShallow ? "--depth=1 " : ""}origin HEAD`);

		return getStackVersion(await exec("git show FETCH_HEAD:package.json"));
	} catch (error) {
		throw createError("git", error instanceof Error ? error : new Error(String(error)));
	}
};

const downloadTemplate = async (version: string, template: Template, directory: string) => {
	// Run outside the project: npm rejects the project's pnpm `devEngines.packageManager`.
	await exec(`npm pack ${toShellArgument(`@adbayb/stack@${version}`)}`, { cwd: directory });
	await exec(`tar -xzf adbayb-stack-${version}.tgz`, { cwd: directory });

	return join(directory, "package", "templates", template);
};

const getTemplateModel = async (packageJson: string): Promise<TemplateModel> => {
	const projectUrl = await exec("git remote get-url origin");
	const { repoName, repoOwner } = REPOSITORY_REGEXP.exec(projectUrl)?.groups ?? {};
	const { devEngines } = JSON.parse(packageJson) as RootPackageJson;

	return {
		licenseYear: new Date().getFullYear().toString(),
		nodeVersion: devEngines?.runtime?.version,
		pnpmVersion: devEngines?.packageManager?.version,
		// `stack create` names the project after the repository.
		projectName: repoName,
		projectUrl,
		repoId: repoOwner && repoName ? `${repoOwner}/${repoName}` : undefined,
	};
};

const getStackVersion = (packageJson: string) => {
	return (JSON.parse(packageJson) as RootPackageJson).devDependencies?.["@adbayb/stack"];
};

const isExactVersion = (version: string | undefined): version is string => {
	return version !== undefined && EXACT_VERSION_REGEXP.test(version);
};

const readOptionalFile = async (path: string) => {
	return existsSync(path) ? readFile(path, "utf8") : undefined;
};
