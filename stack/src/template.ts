import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, readlink, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
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

/**
 * A pending template change: the merged content to write, or `undefined` to remove the file.
 *
 * `type` tells how the change was computed: `add` for a new template file, `remove` for a file
 * dropped by the template, `update` for a file without local edits, and `merge` for a 3-way merge
 * with local edits.
 */
export type TemplateChange = {
	content: string | undefined;
	hasConflict: boolean;
	path: string;
	type: "add" | "merge" | "remove" | "update";
};

/** The variables rendered into `{{key}}` template placeholders (contents and paths). */
export type TemplateModel = Record<
	| "licenseYear"
	| "nodeVersion"
	| "pnpmVersion"
	| "projectDescription"
	| "projectName"
	| "projectUrl"
	| "repoId",
	string
>;

type RootPackageJson = Partial<Pick<PackageJson, "devDependencies">> & {
	devEngines?: Partial<Record<"packageManager" | "runtime", { version?: string }>>;
};

/** Thrown when the template sources (git remote, npm registry) cannot be reached. */
export class TemplateSourceError extends Error {
	public override name = "TemplateSourceError";
}

const REPOSITORY_REGEXP =
	/^(?:[a-z][\w+.-]*:\/\/[^/]+\/(?:.+\/)?|(?:[\w.-]+@)?[\w.-]+:)(?<repoOwner>[^/:]+)\/(?<repoName>[^/]+?)(?:\.git)?\/?$/u;

const TEMPLATE_VARIABLE_MATCHER = /\{\{(.*?)\}\}/giu;
const VERSION_REGEXP = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<prerelease>[\w.]+))?$/u;
const PUBLISHED_SUFFIX_REGEXP = /\.tmpl$/u;
const LICENSE_YEAR_REGEXP = /^Copyright \(c\) (?<year>\d{4})/mu;
// Only match markers written by `mergeFile` to avoid flagging unrelated `>>>>>>>` lines.
const CONFLICT_MARKER_REGEXP = /^>{7} @adbayb\/stack@\S+ template$/mu;
// `git merge-file` exits with the conflict count (capped at 127) and with 255 on error.
const MERGE_FILE_MAX_CONFLICT_STATUS = 127;

/**
 * Replace `{{key}}` template variables with their model value, keeping unknown ones as is.
 *
 * @param content - The template content.
 * @param model - The variable values.
 * @returns The rendered content.
 */
export const renderTemplate = (content: string, model: Partial<TemplateModel>) => {
	return content.replaceAll(TEMPLATE_VARIABLE_MATCHER, (match, key: string) => {
		return model[key as keyof TemplateModel] ?? match;
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
 * Map a published template path to its project path: `.tmpl` files are published under another name
 * since npm drops some files (such as `.gitignore`) from packages.
 *
 * @param path - The published template path.
 * @returns The project path.
 */
export const toProjectPath = (path: string) => {
	return path.replace(PUBLISHED_SUFFIX_REGEXP, "");
};

/**
 * Extract the `owner/name` repository identifier from a git remote URL.
 *
 * @param url - The git remote URL (SSH, SCP-like, or HTTP(S), with or without `.git`).
 * @returns The repository identifier, or `undefined` if the URL cannot be parsed.
 */
export const getRepositoryId = (url: string) => {
	const { repoName, repoOwner } = REPOSITORY_REGEXP.exec(url.trim())?.groups ?? {};

	return repoOwner && repoName ? `${repoOwner}/${repoName}` : undefined;
};

/**
 * Bump `@adbayb/stack` to its latest published version.
 *
 * @returns The version pinned before the bump, or `undefined` when already up to date (including
 *   newer prerelease pins) or when the project is not pinned to a published version.
 */
export const bumpStack = async () => {
	const pinnedVersion = getStackVersion(await readPackageJson());

	if (!isExactVersion(pinnedVersion)) {
		return undefined;
	}

	const latestVersion = await exec("pnpm view @adbayb/stack version");

	if (!isExactVersion(latestVersion) || compareVersions(latestVersion, pinnedVersion) <= 0) {
		return undefined;
	}

	await exec(
		`pnpm add ${toShellArgument(`@adbayb/stack@${latestVersion}`)} --save-dev --ignore-workspace-root-check`,
		{ hasLiveOutput: true },
	);

	return pinnedVersion;
};

/**
 * Bring the template changes released since the default branch's `@adbayb/stack` version into the
 * working directory with a 3-way merge: template changes apply, local edits stay, and overlapping
 * edits get conflict markers.
 *
 * @param options - The migration options.
 * @param options.fromVersion - The base version, read from the remote default branch by default.
 * @param options.isDryRun - Compute the changes without writing them.
 * @returns The pending (or applied) changes; empty when the project is up to date.
 * @throws {TemplateSourceError} When the git remote or the npm registry cannot be reached.
 */
export const migrateTemplate = async (options: {
	fromVersion?: string | undefined;
	isDryRun: boolean;
}) => {
	const { fromVersion, isDryRun } = options;
	const packageJson = await readPackageJson();
	const pinnedVersion = getStackVersion(packageJson);

	// Projects not pinned to a published version (such as this repository) have nothing to migrate.
	if (!isExactVersion(pinnedVersion)) {
		return [];
	}

	// The next template ships with the running binary: it must be the project's pinned one.
	if (pinnedVersion !== VERSION) {
		throw createError(
			"stack migrate",
			`The running \`@adbayb/stack@${VERSION}\` differs from the project's pinned \`${pinnedVersion}\`. Install dependencies and run the project's binary (\`pnpm stack\`).`,
		);
	}

	const baseVersion = fromVersion ?? (await getDefaultBranchStackVersion());

	if (!isExactVersion(baseVersion) || baseVersion === pinnedVersion) {
		return [];
	}

	const template: Template = existsSync(resolveFromWorkingDirectory("libraries"))
		? "multi-projects"
		: "single-project";

	const model = await getTemplateModel(packageJson);
	const temporaryDirectory = await mkdtemp(join(tmpdir(), "stack-migrate-"));

	try {
		const changes = await getTemplateChanges(
			await downloadTemplate(baseVersion, template, temporaryDirectory),
			resolveFromPackageDirectory("templates", template),
			model,
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
 * List the template changes not migrated yet. Changes a migration leaves to the project are not
 * pending: merged files (including declined template hunks), new template files removed locally,
 * and dropped template files kept locally.
 *
 * @returns The pending changes: files still holding the base template that the template updates,
 *   and files with unresolved migration conflict markers.
 * @throws {TemplateSourceError} When the git remote or the npm registry cannot be reached.
 */
export const getPendingTemplateChanges = async () => {
	const changes = await migrateTemplate({ isDryRun: true });
	const pendingChanges: TemplateChange[] = [];

	for (const change of changes) {
		if (
			change.type === "update" ||
			(change.type === "merge" && (await hasConflictMarkers(change.path)))
		) {
			pendingChanges.push(change);
		}
	}

	return pendingChanges;
};

/**
 * Compute the changes moving the working directory from the base template to the next one.
 *
 * @param basePath - The template the project was last migrated with.
 * @param nextPath - The template to migrate to.
 * @param model - The variable values to render both templates with.
 * @returns The files whose content would change.
 */
export const getTemplateChanges = async (
	basePath: string,
	nextPath: string,
	model: Partial<TemplateModel>,
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
				changes.push({ content: next, hasConflict: false, path, type: "add" });
			}

			continue;
		}

		if (next === undefined) {
			// Only remove a file dropped by the template if it holds no local edits.
			if (current === base) {
				changes.push({ content: undefined, hasConflict: false, path, type: "remove" });
			}

			continue;
		}

		if (current === base) {
			changes.push({ content: next, hasConflict: false, path, type: "update" });

			continue;
		}

		// Merge a new template file colliding with a local one against an empty base: Git narrows the conflict to the differing lines.
		const merge = await mergeFile(path, base ?? "", next);

		// Skip template changes the project already holds.
		if (merge.content !== current) {
			changes.push({ path, ...merge, type: "merge" });
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

const readTemplate = async (root: string, model: Partial<TemplateModel>) => {
	const entries = await readdir(root, { recursive: true, withFileTypes: true });
	const files = new Map<string, string>();

	for (const entry of entries) {
		if (!entry.isFile()) {
			continue;
		}

		const path = join(entry.parentPath, entry.name);
		const renderedPath = renderTemplate(relative(root, path), model);

		files.set(toProjectPath(renderedPath), renderTemplate(await readFile(path, "utf8"), model));
	}

	return files;
};

const mergeFile = async (path: string, base: string, next: string) => {
	const directory = await mkdtemp(join(tmpdir(), "stack-merge-"));

	try {
		const basePath = join(directory, "base");
		const nextPath = join(directory, "next");

		await Promise.all([writeFile(basePath, base), writeFile(nextPath, next)]);

		const { error, status, stderr, stdout } = spawnSync(
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

		if (error !== undefined || status === null || status > MERGE_FILE_MAX_CONFLICT_STATUS) {
			throw createError(
				"git merge-file",
				error ?? (stderr.trim() || `Failed to merge \`${path}\`.`),
			);
		}

		return { content: stdout, hasConflict: status > 0 };
	} finally {
		await rm(directory, { force: true, recursive: true });
	}
};

const getDefaultBranchStackVersion = async () => {
	try {
		const isShallow = (await exec("git rev-parse --is-shallow-repository")) === "true";

		// Fetch only the remote default branch tip (`HEAD`), keeping shallow CI clones shallow.
		await exec(`git fetch --no-tags ${isShallow ? "--depth=1 " : ""}origin HEAD`);

		return getStackVersion(await exec("git show FETCH_HEAD:package.json"));
	} catch (error) {
		throw toTemplateSourceError("git", error);
	}
};

const downloadTemplate = async (version: string, template: Template, directory: string) => {
	try {
		// Run outside the project: npm rejects the project's pnpm `devEngines.packageManager`.
		await exec(`npm pack ${toShellArgument(`@adbayb/stack@${version}`)}`, { cwd: directory });
	} catch (error) {
		throw toTemplateSourceError("npm", error);
	}

	await exec(`tar -xzf adbayb-stack-${version}.tgz`, { cwd: directory });

	return join(directory, "package", "templates", template);
};

/**
 * Resolve the variables `stack create` rendered the project with, from the project itself so that
 * later local edits (such as a renamed library folder) are followed.
 *
 * @param packageJson - The root `package.json` content.
 * @returns The template model.
 */
const getTemplateModel = async (packageJson: string): Promise<TemplateModel> => {
	let projectUrl: string;

	try {
		projectUrl = await exec("git remote get-url origin");
	} catch (error) {
		throw toTemplateSourceError("git", error);
	}

	const projectPath = await getProjectPath();
	const { devEngines } = JSON.parse(packageJson) as RootPackageJson;

	const { description } = JSON.parse(
		(await readOptionalFile(resolveFromWorkingDirectory(projectPath, "package.json"))) ?? "{}",
	) as { description?: string };

	const license = (await readOptionalFile(resolveFromWorkingDirectory("LICENSE"))) ?? "";

	const model: Record<keyof TemplateModel, string | undefined> = {
		licenseYear:
			LICENSE_YEAR_REGEXP.exec(license)?.groups?.year ?? new Date().getFullYear().toString(),
		nodeVersion: devEngines?.runtime?.version,
		pnpmVersion: devEngines?.packageManager?.version,
		projectDescription: description,
		projectName: basename(projectPath),
		projectUrl,
		repoId: getRepositoryId(projectUrl),
	};

	const missingKeys = Object.entries(model)
		.filter(([, value]) => {
			return !value;
		})
		.map(([key]) => {
			return key;
		});

	if (missingKeys.length > 0) {
		throw createError(
			"stack migrate",
			`The \`${missingKeys.join("`, `")}\` template variable(s) cannot be resolved from the project. Check the \`origin\` remote URL, the root \`package.json\` \`devEngines\`, and the \`description\` field of \`${projectPath}/package.json\`.`,
		);
	}

	return model as TemplateModel;
};

/**
 * Locate the library folder, named after the project, through the root `README.md` symlink that
 * `stack create` points at it.
 *
 * @returns The library folder path relative to the working directory.
 */
const getProjectPath = async () => {
	try {
		// Fails when `README.md` is missing or is not a symlink.
		return dirname(await readlink(resolveFromWorkingDirectory("README.md")));
	} catch {
		throw createError(
			"stack migrate",
			"The root `README.md` must be a symlink to the library `README.md` (as created by `stack create`) to locate the project folder.",
		);
	}
};

const toTemplateSourceError = (bin: string, error: unknown) => {
	const cause = error instanceof Error ? error : new Error(String(error));

	return new TemplateSourceError(createError(bin, cause).message);
};

const hasConflictMarkers = async (path: string) => {
	const content = await readOptionalFile(resolveFromWorkingDirectory(path));

	return CONFLICT_MARKER_REGEXP.test(content ?? "");
};

const getStackVersion = (packageJson: string) => {
	return (JSON.parse(packageJson) as RootPackageJson).devDependencies?.["@adbayb/stack"];
};

const isExactVersion = (version: string | undefined): version is string => {
	return version !== undefined && VERSION_REGEXP.test(version);
};

/**
 * Compare two exact semver versions; a release is greater than its prereleases.
 *
 * @param versionA - The first version.
 * @param versionB - The second version.
 * @returns A negative number, zero, or a positive number if `versionA` is lower, equal, or greater.
 */
const compareVersions = (versionA: string, versionB: string) => {
	const groupsA = VERSION_REGEXP.exec(versionA)?.groups ?? {};
	const groupsB = VERSION_REGEXP.exec(versionB)?.groups ?? {};

	for (const key of ["major", "minor", "patch"]) {
		const difference = Number(groupsA[key]) - Number(groupsB[key]);

		if (difference !== 0) {
			return difference;
		}
	}

	const { prerelease: prereleaseA } = groupsA;
	const { prerelease: prereleaseB } = groupsB;

	if (prereleaseA === undefined || prereleaseB === undefined) {
		return Number(prereleaseA === undefined) - Number(prereleaseB === undefined);
	}

	return prereleaseA.localeCompare(prereleaseB, "en", { numeric: true });
};

const readPackageJson = async () => {
	return readFile(resolveFromWorkingDirectory("package.json"), "utf8");
};

const readOptionalFile = async (path: string) => {
	return existsSync(path) ? readFile(path, "utf8") : undefined;
};
