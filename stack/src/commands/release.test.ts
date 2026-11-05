import { exec } from "termost";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createReleaseCommand } from "./release";
import { createCommandHarness } from "./test-helpers";

vi.mock(import("termost"), async (importOriginal) => {
	const original = await importOriginal();

	return { ...original, exec: vi.fn() };
});

describe(createReleaseCommand, () => {
	beforeEach(() => {
		vi.mocked(exec).mockReset().mockResolvedValue("");
	});

	test.each([
		["changelog", ["changeset"]],
		["emptyChangelog", ["changeset --empty"]],
		["bump", ["changeset version"]],
		[
			"snapshot",
			["changeset version --snapshot next", "changeset publish --tag next --no-git-tag"],
		],
		["publish", ["stack build && changeset publish"]],
	])("should execute only the release action selected by the %s flag", async (flag, commands) => {
		await createCommandHarness(createReleaseCommand)({ [flag]: true });

		expect(vi.mocked(exec).mock.calls).toStrictEqual(
			commands.map((command) => {
				return [command, { hasLiveOutput: true }];
			}),
		);
	});

	test("should not release anything when no flag is supplied", async () => {
		await createCommandHarness(createReleaseCommand)();
		expect(exec).not.toHaveBeenCalled();
	});

	test("should not publish a snapshot when versioning fails", async () => {
		vi.mocked(exec).mockRejectedValueOnce(new Error("version failure"));

		await expect(
			createCommandHarness(createReleaseCommand)({ snapshot: true }),
		).rejects.toThrow("`changeset` command failed.\nError: version failure");

		expect(exec).toHaveBeenCalledExactlyOnceWith("changeset version --snapshot next", {
			hasLiveOutput: true,
		});
	});

	test("should run multiple selected release actions in their declared order", async () => {
		await createCommandHarness(createReleaseCommand)({ bump: true, changelog: true });

		expect(vi.mocked(exec).mock.calls).toStrictEqual([
			["changeset", { hasLiveOutput: true }],
			["changeset version", { hasLiveOutput: true }],
		]);
	});

	test("should report a failed snapshot publication after versioning succeeds", async () => {
		vi.mocked(exec)
			.mockResolvedValueOnce("")
			.mockRejectedValueOnce(new Error("publish failure"));

		await expect(
			createCommandHarness(createReleaseCommand)({ snapshot: true }),
		).rejects.toThrow("`changeset` command failed.\nError: publish failure");

		expect(exec).toHaveBeenCalledTimes(2);
	});
});
