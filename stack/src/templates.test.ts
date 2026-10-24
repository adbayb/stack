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
	test("agent instructions stay within the context budget", () => {
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
			const rootSection = getSection(resolveFromRepositoryRoot("AGENTS.md"), sectionStart);

			for (const templateFile of MIRRORED_TEMPLATE_FILES) {
				const templateSection = getSection(
					resolveFromRepositoryRoot(templateFile),
					sectionStart,
				);

				assert.equal(
					templateSection,
					rootSection,
					`${templateFile} drifted in "${sectionStart}": ${MIRROR_INSTRUCTION}`,
				);
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

		assert.match(section, /`devEngines`/u, `${file} must point at \`devEngines\`.`);

		assert.match(
			section,
			/`pnpm install --frozen-lockfile`/u,
			`${file} must document the frozen-lockfile bootstrap.`,
		);

		assert.match(
			section,
			/`stack install` writes/u,
			`${file} must document hook installation and recovery.`,
		);

		assert.ok(
			section.includes(setupCommand),
			`${file} must document its setup commands: ${setupCommand}.`,
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

				assert.ok(
					existsSync(targetDirectory),
					`${file} references missing template directory \`${topLevelDirectory}\`.`,
				);
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

	assert.ok(
		startIndex !== -1,
		`${path} must contain the mirrored section starting with "${heading}".`,
	);

	const nextHeadingIndex = content.indexOf("\n## ", startIndex + heading.length);

	return content.slice(startIndex, nextHeadingIndex === -1 ? undefined : nextHeadingIndex);
};
