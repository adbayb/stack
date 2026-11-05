import { exec } from "termost";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCommandHarness } from "../test-helpers";
import { createCheckCommand } from "./check";

vi.mock(import("termost"), async (importOriginal) => {
	const original = await importOriginal();

	return { ...original, exec: vi.fn() };
});

describe(createCheckCommand, () => {
	beforeEach(() => {
		vi.mocked(exec).mockReset().mockResolvedValue("");
	});

	test("should check dependencies, formatting, and code by default, but not commits", async () => {
		vi.mocked(exec).mockResolvedValueOnce("").mockResolvedValueOnce("[]");
		await createCommandHarness(createCheckCommand)();

		expect(
			vi.mocked(exec).mock.calls.map(([command]) => {
				return command;
			}),
		).toStrictEqual([
			"turbo run build --filter !@examples/*",
			"pnpm recursive ls --json",
			"oxfmt '--disable-nested-config' '--no-error-on-unmatched-pattern' '--check'",
			"oxlint '--disable-nested-config' '--no-error-on-unmatched-pattern'",
		]);
	});

	test.each([
		[
			"code",
			"oxlint 'src/my file.ts' '--disable-nested-config' '--no-error-on-unmatched-pattern'",
		],
		[
			"formatting",
			"oxfmt 'src/my file.ts' '--disable-nested-config' '--no-error-on-unmatched-pattern' '--check'",
		],
	])(
		"should forward filenames and exclude other checks with the %s filter",
		async (filter, command) => {
			await createCommandHarness(createCheckCommand)({ filter }, ["src/my file.ts"]);

			expect(vi.mocked(exec).mock.calls).toStrictEqual([
				["turbo run build --filter !@examples/*", { hasLiveOutput: false }],
				[command],
			]);
		},
	);

	test("should exclude formatting and code checks with the dependency filter", async () => {
		vi.mocked(exec).mockResolvedValueOnce("").mockResolvedValueOnce("[]");
		await createCommandHarness(createCheckCommand)({ filter: "dependency" });

		expect(vi.mocked(exec).mock.calls).toStrictEqual([
			["turbo run build --filter !@examples/*", { hasLiveOutput: false }],
			["pnpm recursive ls --json"],
		]);
	});

	test("should skip the build and all project checks with the commit filter", async () => {
		await createCommandHarness(createCheckCommand)({ filter: "commit" });

		expect(exec).toHaveBeenCalledExactlyOnceWith(
			'commitlint --extends "@commitlint/config-conventional" --edit',
		);
	});

	test("should stop before checking files if preparation fails", async () => {
		vi.mocked(exec).mockRejectedValueOnce(new Error("build failure"));
		await expect(createCommandHarness(createCheckCommand)()).rejects.toThrow("build failure");

		expect(exec).toHaveBeenCalledExactlyOnceWith("turbo run build --filter !@examples/*", {
			hasLiveOutput: false,
		});
	});

	test.each([
		["code", "oxlint", [""]],
		["formatting", "oxfmt", [""]],
		["commit", "commitlint", []],
	] as const)(
		"should report the failing binary for %s checks",
		async (filter, binary, outputs) => {
			vi.mocked(exec).mockRejectedValue(new Error("compliance failure"));
			mockSuccessfulCommands(outputs);

			await expect(createCommandHarness(createCheckCommand)({ filter })).rejects.toThrow(
				`\`${binary}\` command failed.\nError: compliance failure`,
			);
		},
	);
});

const mockSuccessfulCommands = (outputs: readonly string[]) => {
	for (const output of outputs) {
		vi.mocked(exec).mockResolvedValueOnce(output);
	}
};
