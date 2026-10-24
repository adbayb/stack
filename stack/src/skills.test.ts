import { strict as assert } from "node:assert";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { describe, test } from "vitest";

const SKILLS_DIRECTORY = resolve(import.meta.dirname, "../skills");

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
const MAX_MARKDOWN_LINES = 100;
const NON_AUDIT_SKILL_REFERENCES = new Set(["sources.md"]);
const PREREQUISITE = /^([a-z0-9]+(?:-[a-z0-9]+)*) >=(\d+\.\d+\.\d+)$/u;
const LEVEL_TWO_HEADING = /^## (.+)$/gmu;
const WORKFLOW_SECTION = /(?:^|\n)## Workflow\n([\s\S]*?)(?=\n## |$)/u;
const WORKFLOW_STEP = /^### (\d+)\. \S/gmu;
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
	test("repository skills link to the package's canonical skills directory", () => {
		const repositorySkills = resolve(import.meta.dirname, "../../.agents/skills");

		assert.ok(lstatSync(repositorySkills).isSymbolicLink());
		assert.equal(realpathSync(repositorySkills), SKILLS_DIRECTORY);
	});

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

	test("every skill reference exists and is linked from its SKILL.md", () => {
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

		for (const path of getMarkdownPaths()) {
			const content = readFileSync(path, "utf8");

			for (const reference of new Set(content.match(SKILL_REFERENCE))) {
				const referencePath = resolve(dirname(path), reference);

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

	test("audit checklists map the rules of their declared owner", () => {
		for (const { name, dimensions, owner } of AUDIT_SKILLS) {
			const skill = getSkillContent(name);
			const checklist = getChecklistContent(name);
			const corpus = `${skill}\n${checklist}`;

			assert.deepEqual(
				getRequiredSkills(name),
				[owner],
				`${name} must require \`${owner}\`, the owner of the rules it audits.`,
			);

			assert.ok(
				!skill.includes("## Acronym glossary"),
				`${name} must not duplicate the ${owner} glossary.`,
			);

			for (const reference of getAuditReferences(owner)) {
				assert.ok(
					corpus.includes(`\`${owner}\` reference \`${reference}\``),
					`${name} must map \`${owner}\` reference \`${reference}\` from SKILL.md or checklist.md.`,
				);
			}

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
		}
	});

	test("the package README documents every installable skill and its prerequisite", () => {
		const readme = readFileSync(resolve(SKILLS_DIRECTORY, "../README.md"), "utf8");

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

	test("glossary definitions are unique within a skill and consistent across skills", () => {
		const definitions: GlossaryEntry[] = [];

		for (const path of getSkillPaths()) {
			const body = readFileSync(path, "utf8").replace(FRONTMATTER, "");
			const seen = new Set<string>();

			for (const [token, expansion] of getGlossaryEntries(body)) {
				assert.ok(
					!seen.has(token),
					`${relative(SKILLS_DIRECTORY, path)}: acronym \`${token}\` is defined twice.`,
				);

				seen.add(token);
				definitions.push([token, expansion]);
			}
		}

		for (const [token, entries] of Map.groupBy(definitions, ([acronym]) => {
			return acronym;
		})) {
			const expansions = entries.map(([, expansion]) => {
				return expansion;
			});

			assert.equal(
				new Set(expansions).size,
				1,
				`acronym \`${token}\` has conflicting glossary expansions: ${expansions.join(" / ")}`,
			);
		}
	});

	test("skill bodies and references stay within the progressive-disclosure budget", () => {
		for (const path of getSkillPaths()) {
			assert.ok(
				readFileSync(path, "utf8").replace(FRONTMATTER, "").split("\n").length <=
					MAX_MARKDOWN_LINES,
				`${path}: exceeds the ${MAX_MARKDOWN_LINES}-line load budget. Split detail by concern.`,
			);
		}

		for (const directory of getSkillDirectories()) {
			for (const reference of getReferenceFiles(directory)) {
				const path = resolve(directory, "references", reference);

				assert.ok(
					readFileSync(path, "utf8").split("\n").length <= MAX_MARKDOWN_LINES,
					`${path}: exceeds the ${MAX_MARKDOWN_LINES}-line load budget. Split detail by concern.`,
				);
			}
		}
	});
});

const getSkillPaths = () => {
	return getSkillDirectories().map((directory) => {
		return resolve(directory, "SKILL.md");
	});
};

const getSkillDirectories = () => {
	return readdirSync(SKILLS_DIRECTORY, { withFileTypes: true })
		.filter((entry) => {
			return entry.isDirectory();
		})
		.map((entry) => {
			return resolve(SKILLS_DIRECTORY, entry.name);
		});
};

const getMarkdownPaths = () => {
	return readdirSync(SKILLS_DIRECTORY, { encoding: "utf8", recursive: true })
		.filter((file) => {
			return file.endsWith(".md");
		})
		.map((file) => {
			return resolve(SKILLS_DIRECTORY, file);
		});
};

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

// Non-normative sources are not audit dimensions.
const getAuditReferences = (owner: string) => {
	return getReferenceFiles(resolve(SKILLS_DIRECTORY, owner)).filter((reference) => {
		return !NON_AUDIT_SKILL_REFERENCES.has(reference);
	});
};

// Ignore example headings inside fenced code when checking the anatomy.
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

const getSkillContent = (skill: string) => {
	return readFileSync(resolve(SKILLS_DIRECTORY, skill, "SKILL.md"), "utf8");
};

const getChecklistContent = (skill: string) => {
	return readFileSync(resolve(SKILLS_DIRECTORY, skill, "references", "checklist.md"), "utf8");
};

const getSkillTitle = (skill: string) => {
	return skill
		.split("-")
		.map((word) => {
			return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
		})
		.join(" ");
};

// Exclude definitions from prose so only acronym uses need a glossary lookup.
const getSkillCorpora = (): SkillCorpus[] => {
	return getSkillDirectories().map((directory) => {
		const body = readFileSync(resolve(directory, "SKILL.md"), "utf8").replace(FRONTMATTER, "");
		const glossary = GLOSSARY_SECTION.exec(body)?.[0] ?? "";

		const references = readdirSync(directory, { encoding: "utf8", recursive: true })
			.filter((file) => {
				return file.endsWith(".md") && file !== "SKILL.md";
			})
			.map((file) => {
				return readFileSync(resolve(directory, file), "utf8");
			});

		return [
			basename(directory),
			new Map(getGlossaryEntries(body)),
			[body.replace(glossary, ""), ...references].join("\n"),
		] as const;
	});
};

const getBareAcronyms = (prose: string) => {
	return (
		prose
			.replaceAll(FENCED_CODE_BLOCK, "")
			.replaceAll(INLINE_CODE_SPAN, "")
			.replaceAll(/https?:\/\/\S+/gu, "")
			.replaceAll(/\b[A-Z][A-Z0-9]*\.md\b/gu, "")
			.replaceAll(/\bU\+[0-9A-F]+\b/gu, "")
			.match(ACRONYM_CANDIDATE) ?? []
	);
};

// Preserve duplicate definitions and expand slash-grouped tokens for validation.
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

const getFrontmatter = (content: string) => {
	const frontmatter = FRONTMATTER.exec(content)?.[1];

	assert.ok(frontmatter, "SKILL.md must start with `---` frontmatter delimiters.");

	return frontmatter;
};

const getFrontmatterField = (frontmatter: string, field: FrontmatterField) => {
	return unquote(new RegExp(`^${field}:\\s*(.*)$`, "mu").exec(frontmatter)?.[1]?.trim() ?? "");
};

const getMetadataField = (frontmatter: string, field: string) => {
	return unquote(
		new RegExp(`^\\s{2,}${field}:\\s*(.*)$`, "mu").exec(frontmatter)?.[1]?.trim() ?? "",
	);
};

const getRequiredSkills = (skill: string) => {
	const requires = getMetadataField(getFrontmatter(getSkillContent(skill)), "requires");
	const prerequisite = PREREQUISITE.exec(requires)?.[1];

	return prerequisite ? [prerequisite] : [];
};

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

const unquote = (value: string) => {
	return value.replace(/^"(.*)"$/u, "$1").replace(/^'(.*)'$/u, "$1");
};

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
