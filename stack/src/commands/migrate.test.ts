import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exec } from "termost";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { VERSION } from "../constants";
import { createMigrateCommand } from "./migrate";
import { createCommandHarness } from "./test-helpers";

vi.mock(import("termost"), async (importOriginal) => {
	const original = await importOriginal();

	return { ...original, exec: vi.fn() };
});

const originalWorkingDirectory = process.cwd();
let workingDirectory: string;

describe(createMigrateCommand, () => {
	beforeEach(async () => {
		workingDirectory = await mkdtemp(join(tmpdir(), "stack-migrate-"));
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
	});

	test("should hand the merge over to the bumped version from the previous one", async () => {
		vi.mocked(exec).mockResolvedValueOnce("99.0.0");
		await createCommandHarness(createMigrateCommand)();

		expect(
			vi.mocked(exec).mock.calls.map(([command]) => {
				return command;
			}),
		).toStrictEqual([
			"pnpm view @adbayb/stack version",
			"pnpm add '@adbayb/stack@99.0.0' --save-dev --ignore-workspace-root-check",
			`pnpm stack migrate --from '${VERSION}'`,
		]);
	});
});
