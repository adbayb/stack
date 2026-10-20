import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { describe, test } from "vitest";

const SKILLS_DIRECTORY = resolve(import.meta.dirname, "../../.agents/skills");

const LINT_INSTRUCTION =
	"Remove the glyph, or quote it inside inline code spans when documenting the rule itself.";

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/u;
const INLINE_CODE_SPAN = /`[^`\n]+`/gu;
const FENCED_CODE_BLOCK = /```[\s\S]*?```/gu;
const SKILL_REFERENCE = /references\/[A-Za-z0-9-]+\.md/gu;
const SHORTHAND_REFERENCE = /`([a-z0-9-]+\.md)`/gu;
const CROSS_SKILL_REFERENCE = /`([a-z0-9]+(?:-[a-z0-9]+)*)`\s+reference\s+`([A-Za-z0-9-]+\.md)`/gu;
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SEMANTIC_VERSION = /^\d+\.\d+\.\d+$/u;
const QUOTED_DESCRIPTION = /^description:\s*"(?:[^"\\]|\\.)*"$/mu;
const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_SKILL_NAME_LENGTH = 64;
const MAX_BODY_LINES = 100;
const MAX_REFERENCE_LINES = 100;
const NON_AUDIT_SKILL_REFERENCES = new Set(["sources.md"]);
const GLOSSARY_SECTION = /(?:^|\n)## Acronym glossary\n([\s\S]*?)(?=\n## |$)/u;
const GLOSSARY_ENTRY = /\*\*([A-Za-z0-9][A-Za-z0-9 /.-]+?)\*\*:\s*([^*\n]+?)(?=\.\s+\*\*|\.?$)/gu;

const ACRONYM_CANDIDATE =
	/(?<![A-Za-z0-9+])((?:[A-Z][A-Z0-9]{0,11}\/)+[A-Z][A-Z0-9]{0,11}|[A-Z][A-Z0-9]{1,11})(?![A-Za-z0-9])(?!\.[A-Za-z0-9])/gu;

type BannedGlyph = readonly [label: string, glyph: string];

type GlossaryEntry = readonly [token: string, expansion: string];

type SkillCorpus = readonly [skill: string, tokens: Map<string, string>, prose: string];

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

describe("skills", () => {
	test("the SKILL.md frontmatter satisfies Agent Skills field constraints", () => {
		for (const path of getSkillPaths()) {
			const frontmatter = getFrontmatter(readFileSync(path, "utf8"));
			const skillName = basename(dirname(path));
			const name = getFrontmatterField(frontmatter, "name");
			const description = getFrontmatterField(frontmatter, "description");
			const version = getMetadataField(frontmatter, "version");

			assert.equal(
				name,
				skillName,
				`${path}: frontmatter \`name\` must equal its folder name (${skillName}).`,
			);

			assert.ok(
				description.length > 0,
				`${path}: frontmatter \`description\` must state when to load the skill.`,
			);

			assert.match(
				description,
				/Use (?:when|whenever)/u,
				`${path}: frontmatter \`description\` must include an explicit "Use when" or "Use whenever" trigger.`,
			);

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
				frontmatter,
				QUOTED_DESCRIPTION,
				`${path}: frontmatter \`description\` must be a double-quoted YAML scalar so colons stay safe.`,
			);

			assert.match(
				version,
				SEMANTIC_VERSION,
				`${path}: frontmatter \`metadata.version\` must be a semantic version.`,
			);
		}
	});

	test("every skill directory contains a SKILL.md", () => {
		for (const directory of getSkillDirectories()) {
			const skillName = basename(directory);

			assert.ok(
				existsSync(resolve(directory, "SKILL.md")),
				`${skillName}: every skill directory must contain a SKILL.md.`,
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

			const localContent = content.replaceAll(CROSS_SKILL_REFERENCE, "");

			for (const match of localContent.matchAll(SHORTHAND_REFERENCE)) {
				const [, reference = ""] = match;
				const referencePath = resolve(dirname(path), reference);

				assert.ok(
					existsSync(referencePath),
					`${path} points to missing shorthand reference \`${reference}\`.`,
				);
			}
		}
	});

	test("every cross-skill reference points to an existing reference file", () => {
		for (const path of getMarkdownPaths()) {
			const content = readFileSync(path, "utf8");
			const [owner = ""] = relative(SKILLS_DIRECTORY, path).split("/");
			const allowedSkills = new Set([owner, ...getRequiredSkills(owner)]);

			for (const match of content.matchAll(CROSS_SKILL_REFERENCE)) {
				const [, skill = "", reference = ""] = match;
				const referencePath = resolve(SKILLS_DIRECTORY, skill, "references", reference);

				assert.ok(
					existsSync(referencePath),
					`${path} points to missing cross-skill reference \`${skill}/${reference}\`.`,
				);

				assert.ok(
					allowedSkills.has(skill),
					`${path} relies on \`${skill}\` without declaring it as a prerequisite.`,
				);
			}
		}
	});

	test("code-audit requires software-design and stops when it is missing", () => {
		const skill = readFileSync(resolve(SKILLS_DIRECTORY, "code-audit/SKILL.md"), "utf8");

		const checklist = readFileSync(
			resolve(SKILLS_DIRECTORY, "code-audit/references/checklist.md"),
			"utf8",
		);

		const frontmatter = getFrontmatter(skill);
		const requires = getMetadataField(frontmatter, "requires");

		const softwareDesignSkill = readFileSync(
			resolve(SKILLS_DIRECTORY, "software-design/SKILL.md"),
			"utf8",
		);

		const softwareDesignVersion = getMetadataField(
			getFrontmatter(softwareDesignSkill),
			"version",
		);

		assert.match(skill, /^## Prerequisite$/mu);
		assert.match(skill, /Requires the `software-design` skill\./u);
		assert.match(skill, /stop before auditing/u);
		assert.match(skill, /pnpm dlx skills add adbayb\/stack --skill software-design -g/u);
		assert.match(skill, /explicit approval/u);
		assert.match(skill, /metadata\.requires/u);
		assert.match(requires, /^software-design >=\d+\.\d+\.\d+$/u);

		const requiredVersion = requires.slice("software-design >=".length);

		assert.ok(
			isVersionAtLeast(softwareDesignVersion, requiredVersion),
			`code-audit requires software-design ${requiredVersion}, but the repo ships ${softwareDesignVersion}.`,
		);

		assert.equal(
			requiredVersion.split(".")[0],
			softwareDesignVersion.split(".")[0],
			"Raise code-audit's prerequisite after a software-design major change.",
		);

		assert.ok(
			!checklist.includes("Naming fallback"),
			"code-audit must not reintroduce a naming fallback.",
		);
	});

	test("code-audit reuses the software-design glossary", () => {
		const skill = readFileSync(resolve(SKILLS_DIRECTORY, "code-audit/SKILL.md"), "utf8");

		assert.match(skill, /Acronyms are expanded once in the `software-design` glossary/u);

		assert.ok(
			!skill.includes("## Acronym glossary"),
			"code-audit must not duplicate the software-design glossary.",
		);
	});

	test("code-audit maps every software-design reference", () => {
		const skill = readFileSync(resolve(SKILLS_DIRECTORY, "code-audit/SKILL.md"), "utf8");

		const checklist = readFileSync(
			resolve(SKILLS_DIRECTORY, "code-audit/references/checklist.md"),
			"utf8",
		);

		const corpus = `${skill}\n${checklist}`;

		for (const reference of getAuditReferences()) {
			assert.ok(
				corpus.includes(`\`software-design\` reference \`${reference}\``),
				`code-audit must map \`software-design\` reference \`${reference}\` from SKILL.md or checklist.md.`,
			);
		}
	});

	test("the code-audit checklist points each dimension at software-design", () => {
		const checklist = readFileSync(
			resolve(SKILLS_DIRECTORY, "code-audit/references/checklist.md"),
			"utf8",
		);

		const dimensions = checklist.split(/^## /mu).filter((section) => {
			return /^[A-G]\./u.test(section);
		});

		assert.equal(dimensions.length, 7, "code-audit checklist must define dimensions A-G.");

		for (const dimension of dimensions) {
			assert.match(
				dimension,
				/^Rules: `software-design` reference `[A-Za-z0-9-]+\.md`/mu,
				`code-audit checklist dimension ${dimension.slice(0, 1)} must point at a software-design reference.`,
			);
		}
	});

	test("every reference file is linked from its SKILL.md", () => {
		for (const directory of getSkillDirectories()) {
			const skillPath = resolve(directory, "SKILL.md");
			const skill = readFileSync(skillPath, "utf8");

			for (const reference of getReferenceFiles(directory)) {
				assert.ok(
					skill.includes(`references/${reference}`),
					`${skillPath} must link to \`references/${reference}\`.`,
				);
			}
		}
	});

	test("audit dimensions delegate severity to one impact-based guide", () => {
		const checklist = readFileSync(
			resolve(SKILLS_DIRECTORY, "code-audit/references/checklist.md"),
			"utf8",
		);

		const severityHeading = checklist.indexOf("\n## Severity\n");

		assert.ok(severityHeading !== -1, "The checklist must contain a severity guide.");

		assert.doesNotMatch(
			checklist.slice(0, severityHeading),
			/\b(?:Blocker|Major|Minor)\b/u,
			"Dimension-specific severity labels duplicate the canonical severity guide.",
		);

		assert.match(
			checklist.slice(severityHeading),
			/demonstrated impact/u,
			"Severity must follow demonstrated impact, not the name of a smell or pattern.",
		);
	});

	test("the package README documents both installable skills and the prerequisite", () => {
		const readme = readFileSync(resolve(SKILLS_DIRECTORY, "../../stack/README.md"), "utf8");

		for (const skill of ["software-design", "code-audit"]) {
			assert.ok(
				readme.includes(`--skill ${skill}`),
				`stack/README.md must document the \`${skill}\` install command.`,
			);
		}

		assert.match(
			readme,
			/requires `software-design`/u,
			"stack/README.md must document the code-audit prerequisite.",
		);
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

	test("every acronym used bare in a skill is defined in its own or a prerequisite glossary", () => {
		const corpora = getSkillCorpora();
		const glossaries = new Map<string, Map<string, string>>();

		for (const [skill, tokens] of corpora) {
			glossaries.set(skill, tokens);
		}

		for (const [skill, tokens, prose] of corpora) {
			const allowedTokens = getAllowedTokens(skill, tokens, glossaries);

			for (const candidate of getBareAcronyms(prose)) {
				for (const token of candidate.split("/")) {
					assert.ok(
						allowedTokens.has(token),
						`${skill}: acronym \`${token}\` is used bare but missing from its glossary or a prerequisite glossary.`,
					);
				}
			}
		}
	});

	test("no skill glossary defines the same acronym twice", () => {
		for (const path of getSkillPaths()) {
			const body = readFileSync(path, "utf8").replace(FRONTMATTER, "");
			const seen = new Set<string>();

			for (const [token] of getGlossaryEntries(body)) {
				assert.ok(
					!seen.has(token),
					`${relative(SKILLS_DIRECTORY, path)}: acronym \`${token}\` is defined twice.`,
				);

				seen.add(token);
			}
		}
	});

	test("acronyms defined in more than one skill glossary carry identical expansions", () => {
		const shared = getSharedGlossaryTokens();

		for (const [token, expansions] of shared) {
			assert.equal(
				new Set(expansions.values()).size,
				1,
				`acronym \`${token}\` has conflicting glossary expansions: ${Array.from(expansions, formatGlossaryExpansion).join(" / ")}`,
			);
		}
	});

	test("the SKILL.md body stays within the 100-line progressive-disclosure budget", () => {
		for (const path of getSkillPaths()) {
			const body = readFileSync(path, "utf8").replace(FRONTMATTER, "");

			assert.ok(
				body.split("\n").length <= MAX_BODY_LINES,
				`${path}: SKILL.md body exceeds the ${MAX_BODY_LINES}-line load budget.`,
			);
		}
	});

	test("reference files stay within the 100-line progressive-disclosure budget", () => {
		for (const directory of getSkillDirectories()) {
			for (const reference of getReferenceFiles(directory)) {
				const path = resolve(directory, "references", reference);
				const lines = readFileSync(path, "utf8").split("\n").length;

				assert.ok(
					lines <= MAX_REFERENCE_LINES,
					`${path}: reference exceeds the ${MAX_REFERENCE_LINES}-line load budget. Split it by concern.`,
				);
			}
		}
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
 * Get every skill directory under the skills directory.
 *
 * @returns The absolute skill directory paths.
 */
const getSkillDirectories = () => {
	return readdirSync(SKILLS_DIRECTORY, { withFileTypes: true })
		.filter((entry) => {
			return entry.isDirectory();
		})
		.map((entry) => {
			return resolve(SKILLS_DIRECTORY, entry.name);
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
 * Get every markdown reference under a skill's references directory.
 *
 * @param directory The skill directory.
 * @returns The relative reference paths, or an empty list when the skill has no references.
 */
const getReferenceFiles = (directory: string) => {
	const referencesDirectory = resolve(directory, "references");

	if (!existsSync(referencesDirectory)) {
		return [];
	}

	return readdirSync(referencesDirectory, { encoding: "utf8", recursive: true }).filter(
		(file) => {
			return file.endsWith(".md");
		},
	);
};

/**
 * Get the `software-design` references that `code-audit` must map. Authoring-only sources are
 * excluded because they are not audit dimensions.
 *
 * @returns The relative reference paths code-audit must mention.
 */
const getAuditReferences = () => {
	return getReferenceFiles(resolve(SKILLS_DIRECTORY, "software-design")).filter((reference) => {
		return !NON_AUDIT_SKILL_REFERENCES.has(reference);
	});
};

/**
 * Get each skill's parsed glossary tokens and acronym prose corpus (body minus glossary plus
 * references).
 *
 * @returns Per-skill `[name, token map, prose]` tuples.
 */
const getSkillCorpora = (): SkillCorpus[] => {
	return readdirSync(SKILLS_DIRECTORY, { withFileTypes: true })
		.filter((entry) => {
			return entry.isDirectory();
		})
		.map((entry) => {
			const directory = resolve(SKILLS_DIRECTORY, entry.name);

			const body = readFileSync(resolve(directory, "SKILL.md"), "utf8").replace(
				FRONTMATTER,
				"",
			);

			const glossary = GLOSSARY_SECTION.exec(body)?.[0] ?? "";

			const references = readdirSync(directory, { encoding: "utf8", recursive: true })
				.filter((file) => {
					return file.endsWith(".md") && file !== "SKILL.md";
				})
				.map((file) => {
					return readFileSync(resolve(directory, file), "utf8");
				});

			return [
				entry.name,
				parseGlossaryMap(body),
				[body.replace(glossary, ""), ...references].join("\n"),
			] as const;
		});
};

/**
 * Remove inline code, URLs, and file names that are not prose acronyms.
 *
 * @param content - The skill body or reference text.
 * @returns The prose to scan for bare acronyms.
 */
const stripNonProse = (content: string) => {
	return content
		.replaceAll(FENCED_CODE_BLOCK, "")
		.replaceAll(INLINE_CODE_SPAN, "")
		.replaceAll(/https?:\/\/\S+/gu, "")
		.replaceAll(/\b[A-Z][A-Z0-9]*\.md\b/gu, "")
		.replaceAll(/\bU\+[0-9A-F]+\b/gu, "");
};

/**
 * Get every bare acronym candidate from prose, excluding inline code, URLs, and file names.
 *
 * @param prose - The skill body or reference text.
 * @returns The acronym candidates in source order.
 */
const getBareAcronyms = (prose: string) => {
	return stripNonProse(prose).match(ACRONYM_CANDIDATE) ?? [];
};

/**
 * Format a glossary expansion for a conflict message.
 *
 * @param entry - The skill name and glossary expansion.
 * @returns The formatted expansion.
 */
const formatGlossaryExpansion = (entry: readonly [string, string]) => {
	const [skill, expansion] = entry;

	return `${skill}: ${expansion}`;
};

/**
 * Group every acronym token defined by more than one skill glossary.
 *
 * @returns Tokens shared across skills mapped to per-skill expansions.
 */
const getSharedGlossaryTokens = () => {
	const tokens = new Map<string, Map<string, string>>();

	for (const [skill, glossary] of getSkillCorpora()) {
		for (const [token, expansion] of glossary) {
			const expansions = tokens.get(token) ?? new Map<string, string>();

			expansions.set(skill, expansion);
			tokens.set(token, expansions);
		}
	}

	return [...tokens].filter(([, expansions]) => {
		return expansions.size > 1;
	});
};

/**
 * Parse a SKILL.md glossary section into acronym to expansion entries.
 *
 * @param body - The whole SKILL.md body below the frontmatter.
 * @returns Every registered token, with slash-grouped entries registering each token.
 */
const parseGlossaryMap = (body: string) => {
	const tokens = new Map<string, string>();

	for (const [token, expansion] of getGlossaryEntries(body)) {
		tokens.set(token, expansion);
	}

	return tokens;
};

/**
 * Read glossary entries in source order, including duplicate definitions.
 *
 * @param body - The whole SKILL.md body below the frontmatter.
 * @returns Every `[token, expansion]` pair in the glossary.
 */
const getGlossaryEntries = (body: string): GlossaryEntry[] => {
	const entries: GlossaryEntry[] = [];
	const section = GLOSSARY_SECTION.exec(body)?.[1] ?? "";

	for (const line of section.split("\n")) {
		for (const match of line.matchAll(GLOSSARY_ENTRY)) {
			const [, rawTokens = "", rawExpansion = ""] = match;
			const expansion = rawExpansion.replace(/\.$/u, "").trim();

			for (const token of rawTokens
				.split("/")
				.map((part) => {
					return part.trim();
				})
				.filter(Boolean)) {
				entries.push([token, expansion]);
			}
		}
	}

	return entries;
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
 * Get the skill names declared as prerequisites in a skill's frontmatter.
 *
 * @param skill - The skill name.
 * @returns The prerequisite skill names.
 */
const getRequiredSkills = (skill: string) => {
	const content = readFileSync(resolve(SKILLS_DIRECTORY, skill, "SKILL.md"), "utf8");
	const requires = getMetadataField(getFrontmatter(content), "requires");
	const match = /^([a-z0-9]+(?:-[a-z0-9]+)*) >=\d+\.\d+\.\d+$/u.exec(requires);

	return match?.[1] ? [match[1]] : [];
};

/**
 * Get the glossary tokens a skill may use bare: its own plus its prerequisites'.
 *
 * @param skill - The skill name.
 * @param tokens - The skill's own glossary tokens.
 * @param glossaries - Every skill's own glossary tokens.
 * @returns The allowed tokens.
 */
const getAllowedTokens = (
	skill: string,
	tokens: Map<string, string>,
	glossaries: Map<string, Map<string, string>>,
) => {
	const allowedTokens = new Set(tokens.keys());

	for (const prerequisite of getRequiredSkills(skill)) {
		const prerequisiteTokens = glossaries.get(prerequisite);

		if (!prerequisiteTokens) {
			continue;
		}

		for (const token of prerequisiteTokens.keys()) {
			allowedTokens.add(token);
		}
	}

	return allowedTokens;
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

/**
 * Compare two semantic versions numerically.
 *
 * @param actual - The version to check.
 * @param minimum - The minimum required version.
 * @returns Whether the actual version is at least the minimum.
 */
const isVersionAtLeast = (actual: string, minimum: string) => {
	const [actualMajor = 0, actualMinor = 0, actualPatch = 0] = actual.split(".").map(Number);
	const [minimumMajor = 0, minimumMinor = 0, minimumPatch = 0] = minimum.split(".").map(Number);

	if (actualMajor !== minimumMajor) {
		return actualMajor > minimumMajor;
	}

	if (actualMinor !== minimumMinor) {
		return actualMinor > minimumMinor;
	}

	return actualPatch >= minimumPatch;
};
