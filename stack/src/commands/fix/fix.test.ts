import { exec } from "termost";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCommandHarness } from "../test-helpers";
import { createFixCommand } from "./fix";

vi.mock(import("termost"), async (importOriginal) => {
	const original = await importOriginal();

	return { ...original, exec: vi.fn() };
});

describe(createFixCommand, () => {
	beforeEach(() => {
		vi.mocked(exec).mockReset().mockResolvedValue("");
	});

	test("builds before formatting and linting the selected files", async () => {
		await createCommandHarness(createFixCommand)({}, ["src/my file.ts"]);

		expect(vi.mocked(exec).mock.calls).toStrictEqual([
			["turbo run build --filter !@examples/*", { hasLiveOutput: false }],
			[
				"oxfmt 'src/my file.ts' '--disable-nested-config' '--no-error-on-unmatched-pattern' '--write'",
			],
			[
				"oxlint 'src/my file.ts' '--disable-nested-config' '--no-error-on-unmatched-pattern' '--fix-dangerously'",
			],
		]);
	});

	test("fixes the whole project when no filenames are supplied", async () => {
		await createCommandHarness(createFixCommand)();

		expect(
			vi.mocked(exec).mock.calls.map(([command]) => {
				return command;
			}),
		).toStrictEqual([
			"turbo run build --filter !@examples/*",
			"oxfmt '--disable-nested-config' '--no-error-on-unmatched-pattern' '--write'",
			"oxlint '--disable-nested-config' '--no-error-on-unmatched-pattern' '--fix-dangerously'",
		]);
	});

	test("stops before linting if formatting fails", async () => {
		vi.mocked(exec)
			.mockResolvedValueOnce("")
			.mockRejectedValueOnce(new Error("format failure"));

		await expect(createCommandHarness(createFixCommand)()).rejects.toThrow(
			"`oxfmt` command failed.\nError: format failure",
		);

		expect(exec).toHaveBeenCalledTimes(2);
	});

	test("does not modify files if the build fails", async () => {
		vi.mocked(exec).mockRejectedValueOnce(new Error("build failure"));

		await expect(createCommandHarness(createFixCommand)()).rejects.toThrow(
			"`turbo` command failed.\nError: build failure",
		);

		expect(exec).toHaveBeenCalledExactlyOnceWith("turbo run build --filter !@examples/*", {
			hasLiveOutput: false,
		});
	});

	test("reports a lint failure after formatting completes", async () => {
		vi.mocked(exec)
			.mockResolvedValueOnce("")
			.mockResolvedValueOnce("")
			.mockRejectedValueOnce(new Error("lint failure"));

		await expect(createCommandHarness(createFixCommand)()).rejects.toThrow(
			"`oxlint` command failed.\nError: lint failure",
		);
	});
});
