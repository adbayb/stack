import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, test } from "vitest";

const MIRROR_INSTRUCTION =
	'Root AGENTS.md and both stack/templates AGENTS.md files must stay in sync ("update all three files together"). Fix the mirrored wording, or extend SANCTIONED_TEMPLATE_DELTAS only for wordings templates deliberately keep generic.';

const MIRRORED_TEMPLATE_FILES = [
	"stack/templates/single-project/AGENTS.md",
	"stack/templates/multi-projects/AGENTS.md",
];

const CODE_STYLE_SECTION_START = "## Code style guidelines";
const COMMANDS_SECTION_START = "## Commands";

type SanctionedTemplateDelta = readonly [templateWording: string, rootWording: string];

/**
 * Template-only rewordings that keep repo-internal paths out of scaffolded projects. Any other
 * difference between the root section and a mirrored one fails this test.
 */
const SANCTIONED_TEMPLATE_DELTAS: SanctionedTemplateDelta[] = [
	["the shared `@adbayb/stack` presets", "the shared presets under `stack/configs/`"],
	["use parameterized exec helpers", "use the shared exec helpers in `stack/src/helpers.ts`"],
	[
		"the `software-design` skill (SKILL.md plus references)",
		"the `software-design` skill (`.agents/skills/software-design/`: SKILL.md plus references)",
	],
];

describe("templates mirror", () => {
	test("root and template AGENTS.md code style, security, and PR sections stay in sync", () => {
		const rootSection = getSection(
			resolveFromRepositoryRoot("AGENTS.md"),
			CODE_STYLE_SECTION_START,
			false,
		);

		for (const templateFile of MIRRORED_TEMPLATE_FILES) {
			const templateSection = getSection(
				resolveFromRepositoryRoot(templateFile),
				CODE_STYLE_SECTION_START,
				false,
			);

			assert.equal(
				getCanonicalSection(templateSection),
				rootSection,
				`${templateFile} drifted: ${MIRROR_INSTRUCTION}`,
			);
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

	test("root and template AGENTS.md command and testing sections stay in sync", () => {
		const rootSection = getSection(
			resolveFromRepositoryRoot("AGENTS.md"),
			COMMANDS_SECTION_START,
			true,
		);

		for (const templateFile of MIRRORED_TEMPLATE_FILES) {
			const templateSection = getSection(
				resolveFromRepositoryRoot(templateFile),
				COMMANDS_SECTION_START,
				true,
			);

			assert.equal(
				getCanonicalSection(templateSection),
				rootSection,
				`${templateFile} drifted: ${MIRROR_INSTRUCTION}`,
			);
		}
	});
});

/**
 * Reword a template section to the canonical root wording.
 *
 * @param templateSection - The template section text.
 * @returns The canonical root section text.
 */
const getCanonicalSection = (templateSection: string) => {
	return SANCTIONED_TEMPLATE_DELTAS.reduce((section, [templateWording, rootWording]) => {
		return section.replaceAll(templateWording, rootWording);
	}, templateSection);
};

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
