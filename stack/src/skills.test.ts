import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { describe, test } from "vitest";

const SKILLS_DIRECTORY = resolve(import.meta.dirname, "../../.agents/skills");

const LINT_INSTRUCTION =
	"Remove the glyph, or quote it inside inline code spans when documenting the rule itself.";

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/u;
const INLINE_CODE_SPAN = /`[^`\n]+`/gu;
const SKILL_REFERENCE = /references\/[A-Za-z0-9-]+\.md/gu;
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SEMANTIC_VERSION = /^\d+\.\d+\.\d+$/u;
const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_SKILL_NAME_LENGTH = 64;

type BannedGlyph = readonly [label: string, glyph: string];

/**
 * Glyphs banned as generated output by the neutral-artifacts rules, written with escape sequences
 * so this file stays free of them. The neutral-rules text quotes the banned characters inside
 * inline-code spans, which the scan strips before checking.
 */
const BANNED_GLYPHS: BannedGlyph[] = [
	["em-dash (U+2014)", "\u2014"],
	["decorative en-dash (U+2013)", "\u2013"],
	["no-break space (U+00A0)", "\u00A0"],
	["zero-width space (U+200B)", "\u200B"],
	["zero-width non-joiner (U+200C)", "\u200C"],
	["zero-width joiner (U+200D)", "\u200D"],
	["stray byte-order mark (U+FEFF)", "\uFEFF"],
];

type FrontmatterField = "description" | "name";

describe(".agents/skills artifacts", () => {
	test("the SKILL.md frontmatter names its folder and has a non-empty description", () => {
		for (const path of getSkillPaths()) {
			const frontmatter = getFrontmatter(readFileSync(path, "utf8"));
			const skillName = basename(dirname(path));
			const name = getFrontmatterField(frontmatter, "name");
			const description = getFrontmatterField(frontmatter, "description");

			assert.equal(
				name,
				skillName,
				`${path}: frontmatter \`name\` must equal its folder name (${skillName}).`,
			);

			assert.ok(
				description.length > 0,
				`${path}: frontmatter \`description\` must state when to load the skill.`,
			);
		}
	});

	test("the SKILL.md frontmatter satisfies Agent Skills field constraints", () => {
		for (const path of getSkillPaths()) {
			const frontmatter = getFrontmatter(readFileSync(path, "utf8"));
			const name = getFrontmatterField(frontmatter, "name");
			const description = getFrontmatterField(frontmatter, "description");
			const version = getMetadataField(frontmatter, "version");

			assert.match(
				name,
				SKILL_NAME,
				`${path}: frontmatter \`name\` must use lowercase letters, numbers, and single hyphens.`,
			);

			assert.ok(
				name.length <= MAX_SKILL_NAME_LENGTH,
				`${path}: frontmatter \`name\` must be at most ${MAX_SKILL_NAME_LENGTH} characters.`,
			);

			assert.ok(
				description.length <= MAX_DESCRIPTION_LENGTH,
				`${path}: frontmatter \`description\` must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
			);

			assert.match(
				version,
				SEMANTIC_VERSION,
				`${path}: frontmatter \`metadata.version\` must be a semantic version.`,
			);
		}
	});

	test("every SKILL.md and reference path points to an existing file", () => {
		for (const path of getMarkdownPaths()) {
			const content = readFileSync(path, "utf8");

			for (const reference of new Set(content.match(SKILL_REFERENCE))) {
				// `reference` is a repo-neutral relative path such as "references/checklist.md".
				const referencePath = resolve(dirname(path), ...reference.split("/"));

				assert.ok(
					existsSync(referencePath),
					`${path} points to missing reference \`${reference}\`.`,
				);
			}
		}
	});

	test("skill markdown stays free of banned glyphs outside inline code spans", () => {
		const violations = getMarkdownPaths().flatMap((path) => {
			const prose = readFileSync(path, "utf8").replaceAll(INLINE_CODE_SPAN, "");

			return prose.split("\n").flatMap((line, lineIndex) => {
				return BANNED_GLYPHS.filter((glyph) => {
					return line.includes(glyph[1]);
				}).map((glyph) => {
					return `${relative(SKILLS_DIRECTORY, path)}:${lineIndex + 1} ${glyph[0]}`;
				});
			});
		});

		assert.equal(
			violations.length,
			0,
			`Banned glyphs found in skill markdown:\n   ${violations.join("\n   ")}\n${LINT_INSTRUCTION}`,
		);
	});
});

/**
 * Get every SKILL.md path under the skills directory.
 *
 * @returns The absolute SKILL.md paths.
 */
const getSkillPaths = () => {
	return getMarkdownPaths().filter((path) => {
		return basename(path) === "SKILL.md";
	});
};

/**
 * Get every markdown artifact path under the skills directory.
 *
 * @returns The absolute markdown artifact paths.
 */
const getMarkdownPaths = () => {
	return readdirSync(SKILLS_DIRECTORY, { encoding: "utf8", recursive: true })
		.filter((file) => {
			return file.endsWith(".md");
		})
		.map((file) => {
			return resolve(SKILLS_DIRECTORY, file);
		});
};

/**
 * Get the frontmatter body between the opening `---` delimiters, or fail fast when missing.
 *
 * @param content - The whole SKILL.md text.
 * @returns The frontmatter body.
 */
const getFrontmatter = (content: string) => {
	return getOrThrow(
		FRONTMATTER.exec(content)?.[1],
		"SKILL.md must start with `---` frontmatter delimiters.",
	);
};

/**
 * Get a required frontmatter field value, or "" when it is missing (tests decide emptiness).
 *
 * @param frontmatter - The frontmatter body.
 * @param field - The required field.
 * @returns The field value.
 */
const getFrontmatterField = (frontmatter: string, field: FrontmatterField) => {
	return unquote(new RegExp(`^${field}:\\s*(.*)$`, "mu").exec(frontmatter)?.[1]?.trim() ?? "");
};

/**
 * Get a metadata field value, or "" when it is missing (tests decide emptiness).
 *
 * @param frontmatter - The frontmatter body.
 * @param field - The metadata field.
 * @returns The field value.
 */
const getMetadataField = (frontmatter: string, field: string) => {
	return unquote(
		new RegExp(`^\\s{2,}${field}:\\s*(.*)$`, "mu").exec(frontmatter)?.[1]?.trim() ?? "",
	);
};

/**
 * Remove matching YAML quotes from a scalar value.
 *
 * @param value - The raw scalar value.
 * @returns The unquoted value.
 */
const unquote = (value: string) => {
	return value.replace(/^"(.*)"$/u, "$1").replace(/^'(.*)'$/u, "$1");
};

/**
 * Get the provided value, or throw the message when it is absent.
 *
 * @param value - The value expected to exist.
 * @param message - The error message when it is absent.
 * @returns The narrowed value.
 */
const getOrThrow = <T>(value: T | undefined, message: string): T => {
	if (value === undefined) {
		throw new Error(message);
	}

	return value;
};
