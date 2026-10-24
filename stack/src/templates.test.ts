import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, test } from "vitest";

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
	test("agent instructions stay within the context budget", () => {
		for (const file of ["AGENTS.md", ...MIRRORED_TEMPLATE_FILES]) {
			const content = readFileSync(resolveFromRepositoryRoot(file), "utf8");
			const lines = content.trimEnd().split("\n").length;
			const words = content.trim().split(/\s+/u).length;

			expect(
				lines,
				`${file}: ${lines} lines exceeds the ${MAX_AGENTS_LINES}-line AGENTS.md budget. Remove detail or move it to a skill reference.`,
			).toBeLessThanOrEqual(MAX_AGENTS_LINES);

			expect(
				words,
				`${file}: ${words} words exceeds the ${MAX_AGENTS_WORDS}-word AGENTS.md budget. Keep only repo-specific deltas.`,
			).toBeLessThanOrEqual(MAX_AGENTS_WORDS);
		}
	});

	test("root and template AGENTS.md mirrored sections stay in sync", () => {
		for (const sectionStart of MIRRORED_SECTIONS) {
			const rootSection = getSection(resolveFromRepositoryRoot("AGENTS.md"), sectionStart);

			for (const templateFile of MIRRORED_TEMPLATE_FILES) {
				const templateSection = getSection(
					resolveFromRepositoryRoot(templateFile),
					sectionStart,
				);

				expect(
					templateSection,
					`${templateFile} drifted in "${sectionStart}": ${MIRROR_INSTRUCTION}`,
				).toBe(rootSection);
			}
		}
	});

	test.each([
		["AGENTS.md", "pnpm --filter stack build && stack install"],
		...MIRRORED_TEMPLATE_FILES.map((file) => {
			return [file, "`pnpm install` and `stack install`"];
		}),
	])("%s documents bootstrap and hook recovery", (file, setupCommand) => {
		const section = getSection(resolveFromRepositoryRoot(file), "## Bootstrap");

		expect(section, `${file} must point at \`devEngines\`.`).toMatch(/`devEngines`/u);

		expect(section, `${file} must document the frozen-lockfile bootstrap.`).toMatch(
			/`pnpm install --frozen-lockfile`/u,
		);

		expect(section, `${file} must document hook installation and recovery.`).toMatch(
			/`stack install` writes/u,
		);

		expect(section, `${file} must document its setup commands: ${setupCommand}.`).toContain(
			setupCommand,
		);
	});

	test("template project overview references existing template directories", () => {
		for (const file of MIRRORED_TEMPLATE_FILES) {
			const section = getSection(resolveFromRepositoryRoot(file), "## Project overview");

			for (const match of section.matchAll(PROJECT_OVERVIEW_DIRECTORY)) {
				const [, projectPath = ""] = match;
				const [topLevelDirectory = ""] = projectPath.split("/");
				const templateDirectory = dirname(file);

				const targetDirectory = resolveFromRepositoryRoot(
					templateDirectory,
					topLevelDirectory,
				);

				expect(
					existsSync(targetDirectory),
					`${file} references missing template directory \`${topLevelDirectory}\`.`,
				).toBe(true);
			}
		}
	});
});

const resolveFromRepositoryRoot = (...path: string[]) => {
	return resolve(import.meta.dirname, "../..", ...path);
};

const getSection = (path: string, heading: string) => {
	const content = readFileSync(path, "utf8");
	const startIndex = content.indexOf(heading);

	expect(
		startIndex,
		`${path} must contain the mirrored section starting with "${heading}".`,
	).not.toBe(-1);

	const nextHeadingIndex = content.indexOf("\n## ", startIndex + heading.length);

	return content.slice(startIndex, nextHeadingIndex === -1 ? undefined : nextHeadingIndex);
};
