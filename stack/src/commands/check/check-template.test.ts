import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exec } from "termost";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { VERSION } from "../../constants";
import { logger } from "../../helpers";
import { checkTemplate } from "./check-template";

vi.mock(import("termost"), async (importOriginal) => {
	const original = await importOriginal();

	return { ...original, exec: vi.fn() };
});

const originalWorkingDirectory = process.cwd();
let workingDirectory: string;

describe(checkTemplate, () => {
	beforeEach(async () => {
		workingDirectory = await mkdtemp(join(tmpdir(), "stack-check-template-"));
		process.chdir(workingDirectory);

		await writeFile(
			"package.json",
			JSON.stringify({ devDependencies: { "@adbayb/stack": VERSION } }),
		);

		vi.mocked(exec).mockReset().mockResolvedValue("");
	});

	afterEach(async () => {
		process.chdir(originalWorkingDirectory);
		await rm(workingDirectory, { force: true, recursive: true });
		vi.restoreAllMocks();
	});

	test("should warn and skip when the template sources cannot be reached", async () => {
		const warn = vi.spyOn(logger, "warn").mockReturnValue(undefined);

		vi.mocked(exec).mockResolvedValueOnce("false").mockRejectedValueOnce(new Error("offline"));
		await expect(checkTemplate()).resolves.toBeUndefined();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("offline"));
	});
});
