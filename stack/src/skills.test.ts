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
const PREREQUISITE = /^([a-z0-9]+(?:-[a-z0-9]+)*) >=(\d+\.\d+\.\d+)$/u;
const LEVEL_TWO_HEADING = /^## (.+)$/gmu;
const WORKFLOW_SECTION = /(?:^|\n)## Workflow\n([\s\S]*?)(?=\n## |$)/u;
const WORKFLOW_STEP = /^### (\d+)\. \S/gmu;
const FINDINGS_HEADER = /^\| *# *\|.*$/mu;
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

/** Level-two SKILL.md sections, in the order `skill-design` reference `anatomy.md` defines. */
const SKILL_SECTIONS = [
	"Prerequisite",
	"Acronym glossary",
	"Workflow",
	"Output",
	"Example",
	"Missing rule?",
] as const;

const REQUIRED_SKILL_SECTIONS = ["Workflow", "Output", "Example"] as const;

/** Audit skills, the rule-owning skill each one requires, and their checklist dimension count. */
const AUDIT_SKILLS = [
	{ name: "software-audit", dimensions: 7, owner: "software-design" },
	{ name: "skill-audit", dimensions: 6, owner: "skill-design" },
] as const;

type FrontmatterField = "description" | "license" | "name";

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

			for (const match of content.matchAll(CROSS_SKILL_REFERENCE)) {
				const [, skill = "", reference = ""] = match;
				const referencePath = resolve(SKILLS_DIRECTORY, skill, "references", reference);

				assert.ok(
					existsSync(referencePath),
					`${path} points to missing cross-skill reference \`${skill}/${reference}\`.`,
				);
			}
		}
	});

	test("every skill mentions only itself and its declared prerequisites", () => {
		const skills = getSkillDirectories().map((directory) => {
			return basename(directory);
		});

		for (const path of getMarkdownPaths()) {
			const content = readFileSync(path, "utf8");
			const [owner = ""] = relative(SKILLS_DIRECTORY, path).split("/");
			const allowedSkills = new Set([owner, ...getRequiredSkills(owner)]);

			const undeclaredSkills = skills.filter((skill) => {
				return !allowedSkills.has(skill);
			});

			for (const skill of undeclaredSkills) {
				assert.doesNotMatch(
					content,
					new RegExp(`(?<![a-z0-9-])${skill}(?![a-z0-9-])`, "u"),
					`${path} names \`${skill}\` without declaring it as a prerequisite. State the boundary by artifact so each skill installs and runs alone.`,
				);
			}
		}
	});

	test("every SKILL.md follows the shared skill-design anatomy", () => {
		for (const path of getSkillPaths()) {
			const { body, frontmatter, sections, steps } = getSkillAnatomy(path);
			const title = getSkillTitle(basename(dirname(path)));

			assert.match(
				body,
				new RegExp(`^\\s*# ${title}\\n\\n[^#\\s]`, "u"),
				`${path}: start the body with "# ${title}" and an intro paragraph.`,
			);

			assert.ok(
				getFrontmatterField(frontmatter, "license") !== "",
				`${path}: set the frontmatter \`license\`.`,
			);

			for (const field of ["author", "repository"]) {
				assert.ok(
					getMetadataField(frontmatter, field) !== "",
					`${path}: set the frontmatter \`metadata.${field}\`.`,
				);
			}

			assert.deepEqual(
				sections,
				SKILL_SECTIONS.filter((section) => {
					return sections.includes(section);
				}),
				`${path}: use only the anatomy sections, in this order: ${SKILL_SECTIONS.join(", ")}.`,
			);

			for (const section of REQUIRED_SKILL_SECTIONS) {
				assert.ok(
					sections.includes(section),
					`${path}: add the \`## ${section}\` section.`,
				);
			}

			assert.equal(
				sections.includes("Prerequisite"),
				getMetadataField(frontmatter, "requires") !== "",
				`${path}: add \`## Prerequisite\` exactly when \`metadata.requires\` is set.`,
			);

			assert.ok(steps.length > 0, `${path}: write workflow steps as \`### 1. <Step>\`.`);

			assert.deepEqual(
				steps,
				steps.map((_, index) => {
					return index + 1;
				}),
				`${path}: number workflow steps from 1 without gaps.`,
			);
		}
	});

	test("every dependent skill gates its prerequisite version and install", () => {
		for (const dependent of getDependentSkills()) {
			const { description, body, path, prerequisite, requiredVersion, requires } = dependent;

			assert.match(
				requires,
				PREREQUISITE,
				`${path}: \`metadata.requires\` must read "<skill> >=X.Y.Z".`,
			);

			assert.ok(
				existsSync(resolve(SKILLS_DIRECTORY, prerequisite, "SKILL.md")),
				`${path}: \`metadata.requires\` must name a skill in this repo.`,
			);

			const prerequisiteVersion = getMetadataField(
				getFrontmatter(getSkillContent(prerequisite)),
				"version",
			);

			assert.ok(
				description.endsWith(`Requires the \`${prerequisite}\` skill.`),
				`${path}: end the description with "Requires the \`${prerequisite}\` skill."`,
			);

			assert.ok(
				body.includes(`pnpm dlx skills add adbayb/stack --skill ${prerequisite} -g`),
				`${path}: document the \`${prerequisite}\` install command.`,
			);

			assert.match(body, /stop before/u, `${path}: stop when the prerequisite is missing.`);

			assert.match(
				body,
				/explicit approval/u,
				`${path}: install only with explicit approval.`,
			);

			assert.match(body, /metadata\.requires/u, `${path}: point at \`metadata.requires\`.`);

			assert.ok(
				isVersionAtLeast(prerequisiteVersion, requiredVersion),
				`${path} requires ${prerequisite} ${requiredVersion}, but the repo ships ${prerequisiteVersion}.`,
			);

			assert.equal(
				requiredVersion.split(".")[0],
				prerequisiteVersion.split(".")[0],
				`Raise the ${path} prerequisite after a ${prerequisite} major change.`,
			);
		}
	});

	test("audit skills require their rule owner and reuse its glossary", () => {
		for (const { name, owner } of AUDIT_SKILLS) {
			const skill = getSkillContent(name);

			assert.deepEqual(
				getRequiredSkills(name),
				[owner],
				`${name} must require \`${owner}\`, the owner of the rules it audits.`,
			);

			assert.ok(
				!skill.includes("## Acronym glossary"),
				`${name} must not duplicate the ${owner} glossary.`,
			);

			assert.equal(
				skill.includes(`Acronyms are expanded once in the \`${owner}\` glossary`),
				getSkillContent(owner).includes("## Acronym glossary"),
				`${name} must point at the ${owner} glossary exactly when ${owner} defines one.`,
			);
		}
	});

	test("audit skills map every reference of their rule owner", () => {
		for (const { name, owner } of AUDIT_SKILLS) {
			const corpus = `${getSkillContent(name)}\n${getChecklistContent(name)}`;

			for (const reference of getAuditReferences(owner)) {
				assert.ok(
					corpus.includes(`\`${owner}\` reference \`${reference}\``),
					`${name} must map \`${owner}\` reference \`${reference}\` from SKILL.md or checklist.md.`,
				);
			}
		}
	});

	test("audit checklists point each dimension at their rule owner", () => {
		for (const { name, dimensions, owner } of AUDIT_SKILLS) {
			const checklist = getChecklistContent(name);

			const sections = checklist.split(/^## /mu).filter((section) => {
				return /^[A-Z]\./u.test(section);
			});

			assert.equal(
				sections.length,
				dimensions,
				`${name} checklist must define ${dimensions} dimensions.`,
			);

			for (const section of sections) {
				assert.match(
					section,
					new RegExp(`^Rules: \`${owner}\` reference \`[A-Za-z0-9-]+\\.md\``, "mu"),
					`${name} checklist dimension ${section.slice(0, 1)} must point at a ${owner} reference.`,
				);
			}

			assert.doesNotMatch(
				checklist,
				/\bfallback\b/iu,
				`${name} must link to ${owner} rules instead of carrying fallback copies.`,
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
		for (const { name } of AUDIT_SKILLS) {
			const checklist = getChecklistContent(name);
			const severityHeading = checklist.indexOf("\n## Severity\n");

			assert.ok(
				severityHeading !== -1,
				`${name}: the checklist must contain a severity guide.`,
			);

			assert.doesNotMatch(
				checklist.slice(0, severityHeading),
				/\b(?:Blocker|Major|Minor)\b/u,
				`${name}: dimension-specific severity labels duplicate the canonical severity guide.`,
			);

			assert.match(
				checklist.slice(severityHeading),
				/demonstrated impact/u,
				`${name}: severity must follow demonstrated impact, not the name of a smell, pattern, or rule.`,
			);
		}
	});

	test("audit skills share one findings table header", () => {
		const [expected = "", ...headers] = AUDIT_SKILLS.map(({ name }) => {
			return getFindingsHeader(name);
		});

		assert.notEqual(expected, "", "audit skills must report findings in a table.");

		for (const header of headers) {
			assert.equal(
				header,
				expected,
				"every audit skill must use the same findings table header.",
			);
		}
	});

	test("the package README documents every installable skill and its prerequisite", () => {
		const readme = readFileSync(resolve(SKILLS_DIRECTORY, "../../stack/README.md"), "utf8");

		for (const directory of getSkillDirectories()) {
			const skill = basename(directory);

			assert.ok(
				readme.includes(`--skill ${skill}`),
				`stack/README.md must document the \`${skill}\` install command.`,
			);

			for (const prerequisite of getRequiredSkills(skill)) {
				assert.ok(
					readme.includes(`requires \`${prerequisite}\``),
					`stack/README.md must document the ${skill} prerequisite.`,
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
 * Get the references of a rule-owning skill that its audit skill must map. Non-normative sources
 * are excluded because they are not audit dimensions.
 *
 * @param owner - The rule-owning skill name.
 * @returns The relative reference paths the audit skill must mention.
 */
const getAuditReferences = (owner: string) => {
	return getReferenceFiles(resolve(SKILLS_DIRECTORY, owner)).filter((reference) => {
		return !NON_AUDIT_SKILL_REFERENCES.has(reference);
	});
};

/**
 * Get the parts of a SKILL.md that the shared anatomy constrains. Fenced code is stripped so
 * template headings inside examples do not count as sections.
 *
 * @param path - The SKILL.md path.
 * @returns The frontmatter, the body without fenced code, its level-two section titles, and its
 *   workflow step numbers.
 */
const getSkillAnatomy = (path: string) => {
	const content = readFileSync(path, "utf8");
	const body = content.replace(FRONTMATTER, "").replaceAll(FENCED_CODE_BLOCK, "");
	const [, workflow = ""] = WORKFLOW_SECTION.exec(body) ?? [];

	return {
		body,
		frontmatter: getFrontmatter(content),
		sections: Array.from(body.matchAll(LEVEL_TWO_HEADING), ([, section = ""]) => {
			return section;
		}),
		steps: Array.from(workflow.matchAll(WORKFLOW_STEP), ([, step = ""]) => {
			return Number(step);
		}),
	};
};

/**
 * Get every skill that declares a `metadata.requires` prerequisite.
 *
 * @returns Each dependent skill's path, body, description, raw `requires` value, and parsed
 *   prerequisite name and minimum version (empty when `requires` is malformed).
 */
const getDependentSkills = () => {
	return getSkillPaths()
		.map((path) => {
			const content = readFileSync(path, "utf8");
			const frontmatter = getFrontmatter(content);
			const requires = getMetadataField(frontmatter, "requires");
			const [, prerequisite = "", requiredVersion = ""] = PREREQUISITE.exec(requires) ?? [];

			return {
				description: getFrontmatterField(frontmatter, "description"),
				body: content.replace(FRONTMATTER, ""),
				path,
				prerequisite,
				requiredVersion,
				requires,
			};
		})
		.filter(({ requires }) => {
			return requires !== "";
		});
};

/**
 * Get a skill's SKILL.md text.
 *
 * @param skill - The skill name.
 * @returns The SKILL.md text.
 */
const getSkillContent = (skill: string) => {
	return readFileSync(resolve(SKILLS_DIRECTORY, skill, "SKILL.md"), "utf8");
};

/**
 * Get an audit skill's checklist text.
 *
 * @param skill - The audit skill name.
 * @returns The checklist text.
 */
const getChecklistContent = (skill: string) => {
	return readFileSync(resolve(SKILLS_DIRECTORY, skill, "references", "checklist.md"), "utf8");
};

/**
 * Get an audit skill's findings table header without cell padding.
 *
 * @param skill - The audit skill name.
 * @returns The header cells joined by `|`, or an empty string when SKILL.md has no findings table.
 */
const getFindingsHeader = (skill: string) => {
	const [header = ""] = FINDINGS_HEADER.exec(getSkillContent(skill)) ?? [];

	return header
		.split("|")
		.map((cell) => {
			return cell.trim();
		})
		.filter((cell) => {
			return cell !== "";
		})
		.join("|");
};

/**
 * Get the title-case heading the anatomy expects for a skill name.
 *
 * @param skill - The skill name, such as `skill-design`.
 * @returns The title, such as `Skill Design`.
 */
const getSkillTitle = (skill: string) => {
	return skill
		.split("-")
		.map((word) => {
			return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
		})
		.join(" ");
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
	const requires = getMetadataField(getFrontmatter(getSkillContent(skill)), "requires");
	const prerequisite = PREREQUISITE.exec(requires)?.[1];

	return prerequisite ? [prerequisite] : [];
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
