import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "vitest";

const MIRROR_INSTRUCTION =
	"Root AGENTS.md owns shared instructions. Edit the root section first, then update both standalone stack/templates AGENTS.md copies.";

const MAX_AGENTS_LINES = 70;
const MAX_AGENTS_WORDS = 575;

const MIRRORED_TEMPLATE_FILES = [
	"stack/templates/single-project/AGENTS.md",
	"stack/templates/multi-projects/AGENTS.md",
];

const MIRRORED_SECTIONS = [
	"## Instruction precedence",
	"## Commands",
	"## Code style guidelines",
	"## Security considerations",
	"## PR instructions",
] as const;

const PROJECT_OVERVIEW_DIRECTORY =
	/`((?:applications|libraries|examples|tools|\{\{projectName\}\})\/[^`\n]*)`/gu;

describe("templates", () => {
	test("aGENTS.md files stay within the context budget", () => {
		for (const file of ["AGENTS.md", ...MIRRORED_TEMPLATE_FILES]) {
			const content = readFileSync(resolveFromRepositoryRoot(file), "utf8");
			const lines = content.trimEnd().split("\n").length;
			const words = content.trim().split(/\s+/u).length;

			assert.ok(
				lines <= MAX_AGENTS_LINES,
				`${file}: ${lines} lines exceeds the ${MAX_AGENTS_LINES}-line AGENTS.md budget. Remove detail or move it to a skill reference.`,
			);

			assert.ok(
				words <= MAX_AGENTS_WORDS,
				`${file}: ${words} words exceeds the ${MAX_AGENTS_WORDS}-word AGENTS.md budget. Keep only repo-specific deltas.`,
			);
		}
	});

	test("root and template AGENTS.md mirrored sections stay in sync", () => {
		for (const sectionStart of MIRRORED_SECTIONS) {
			const rootSection = getSection(
				resolveFromRepositoryRoot("AGENTS.md"),
				sectionStart,
				true,
			);

			for (const templateFile of MIRRORED_TEMPLATE_FILES) {
				const templateSection = getSection(
					resolveFromRepositoryRoot(templateFile),
					sectionStart,
					true,
				);

				assert.equal(
					templateSection,
					rootSection,
					`${templateFile} drifted in "${sectionStart}": ${MIRROR_INSTRUCTION}`,
				);
			}
		}
	});

	test("template bootstrap documents scaffold setup and hook recovery", () => {
		for (const templateFile of MIRRORED_TEMPLATE_FILES) {
			const section = getSection(
				resolveFromRepositoryRoot(templateFile),
				"## Bootstrap",
				true,
			);

			assert.match(
				section,
				/`stack create` already runs `pnpm install` and `stack install`/u,
				`${templateFile} must say that \`stack create\` installs dependencies and hooks.`,
			);

			assert.match(
				section,
				/`stack install` writes/u,
				`${templateFile} must document hook installation and recovery.`,
			);

			assert.match(
				section,
				/`devEngines`/u,
				`${templateFile} must point at \`devEngines\` instead of hardcoded versions.`,
			);
		}
	});

	test("root and template bootstrap document the actual install commands", () => {
		const files = ["AGENTS.md", ...MIRRORED_TEMPLATE_FILES];

		for (const file of files) {
			const section = getSection(resolveFromRepositoryRoot(file), "## Bootstrap", true);

			assert.match(section, /`devEngines`/u, `${file} must point at \`devEngines\`.`);

			assert.match(
				section,
				/`pnpm install --frozen-lockfile`/u,
				`${file} must document the frozen-lockfile bootstrap.`,
			);

			assert.match(section, /`stack install`/u, `${file} must document hook installation.`);
		}

		const rootSection = getSection(
			resolveFromRepositoryRoot("AGENTS.md"),
			"## Bootstrap",
			true,
		);

		assert.match(
			rootSection,
			/`pnpm --filter stack build && stack install`/u,
			"AGENTS.md must document the root lifecycle install command.",
		);
	});

	test("template project overview references existing template directories", () => {
		for (const file of MIRRORED_TEMPLATE_FILES) {
			const section = getSection(
				resolveFromRepositoryRoot(file),
				"## Project overview",
				true,
			);

			for (const match of section.matchAll(PROJECT_OVERVIEW_DIRECTORY)) {
				const [, projectPath = ""] = match;
				const [topLevelDirectory = ""] = projectPath.split("/");
				const templateDirectory = dirname(file);

				const targetDirectory = resolveFromRepositoryRoot(
					templateDirectory,
					topLevelDirectory,
				);

				assert.ok(
					existsSync(targetDirectory),
					`${file} references missing template directory \`${topLevelDirectory}\`.`,
				);
			}
		}
	});

	test("workflow and README labels match the default stack check scope", () => {
		const files = [
			".github/workflows/workflow.yml",
			"stack/templates/single-project/.github/workflows/workflow.yml",
			"stack/templates/multi-projects/.github/workflows/workflow.yml",
			"stack/README.md",
		];

		for (const file of files) {
			const content = readFileSync(resolveFromRepositoryRoot(file), "utf8");

			assert.ok(
				content.includes("static analysis including linters and types"),
				`${file} must describe the default \`stack check\` scope without commit-message checks.`,
			);

			assert.doesNotMatch(
				content,
				/including linters, types, and commit message/u,
				`${file} must not claim that the default \`stack check\` runs commit-message checks.`,
			);
		}
	});
});

/**
 * Resolve a repository-root-relative path to an absolute one.
 *
 * @param path - The repository-root-relative path segments.
 * @returns The resolved absolute path.
 */
const resolveFromRepositoryRoot = (...path: string[]) => {
	return resolve(import.meta.dirname, "../..", ...path);
};

/**
 * Get a section from an AGENTS.md file, or fail fast when the heading is missing.
 *
 * @param path - The absolute AGENTS.md path.
 * @param heading - The level-two heading that starts the section.
 * @param stopAtNextHeading - Stop at the next `## ` heading; otherwise include the rest of the
 *   file.
 * @returns The section text.
 */
const getSection = (path: string, heading: string, stopAtNextHeading: boolean) => {
	const content = readFileSync(path, "utf8");
	const startIndex = content.indexOf(heading);

	assert.ok(
		startIndex !== -1,
		`${path} must contain the mirrored section starting with "${heading}".`,
	);

	if (!stopAtNextHeading) {
		return content.slice(startIndex);
	}

	const nextHeadingIndex = content.indexOf("\n## ", startIndex + heading.length);

	return content.slice(startIndex, nextHeadingIndex === -1 ? undefined : nextHeadingIndex);
};
