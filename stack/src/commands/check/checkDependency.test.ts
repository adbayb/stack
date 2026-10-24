import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exec } from "termost";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { checkDependency } from "./checkDependency";

vi.mock(import("termost"), async (importOriginal) => {
	const original = await importOriginal();

	return {
		...original,
		exec: vi.fn(),
	};
});

type PackageManifest = {
	name: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

let workingDirectory: string;

describe(checkDependency, () => {
	beforeEach(async () => {
		workingDirectory = await mkdtemp(join(tmpdir(), "stack-check-dependency-"));
	});

	afterEach(async () => {
		await rm(workingDirectory, { force: true, recursive: true });
	});

	test("accepts dependency protocols, ranges, and permitted exclusions", async () => {
		await mockPackages({
			name: "app",
			dependencies: {
				"npm-alias": "npm:actual-package@1.0.0",
				"preview": "1.0.0-beta.1",
				"runtime": "^1.2.3",
				"workspace-package": "workspace:^",
			},
			devDependencies: {
				"eslint": "9.2.0",
				"preview-tool": "3.0.0-rc.1",
				"workspace-package": "workspace:*",
			},
			peerDependencies: {
				"preview-peer": "1.0.0-next.0",
				"react": "^18.0.0",
			},
		});

		await expect(checkDependency()).resolves.toBeUndefined();
	});

	test("rejects a ranged development dependency", async () => {
		await mockPackages({
			name: "app",
			devDependencies: { eslint: "^9.0.0" },
		});

		await expect(checkDependency()).rejects.toThrow(
			"As a dev dependency, `eslint` version must be fixed",
		);
	});

	test("rejects a production dependency without a caret range", async () => {
		await mockPackages({
			name: "app",
			dependencies: { runtime: "1.2.3" },
		});

		await expect(checkDependency()).rejects.toThrow(
			"As a dependency, `runtime` version must be prefixed with a caret",
		);
	});

	test("rejects a peer dependency without an explicit caret range", async () => {
		await mockPackages({
			name: "app",
			peerDependencies: { react: "workspace:^" },
		});

		await expect(checkDependency()).rejects.toThrow(
			"As a peer dependency, `react` version must be explicit",
		);
	});

	test("rejects mismatched versions of a dependency across packages", async () => {
		await mockPackages(
			{ name: "app", dependencies: { runtime: "^1.0.0" } },
			{ name: "library", dependencies: { runtime: "^2.0.0" } },
		);

		await expect(checkDependency()).rejects.toThrow("Mismatched versions");
	});

	test("rejects mismatched development dependency versions across packages", async () => {
		await mockPackages(
			{ name: "app", devDependencies: { vitest: "3.0.0" } },
			{ name: "library", devDependencies: { vitest: "4.0.0" } },
		);

		await expect(checkDependency()).rejects.toThrow("Mismatched versions");
	});

	test("permits different versions between development and production dependencies", async () => {
		await mockPackages(
			{ name: "app", devDependencies: { runtime: "1.0.0" } },
			{ name: "library", dependencies: { runtime: "^2.0.0" } },
		);

		await expect(checkDependency()).resolves.toBeUndefined();
	});

	test.each(["dependencies", "devDependencies", "peerDependencies"] as const)(
		"rejects a missing version in %s",
		async (dependencyType) => {
			await mockPackages({ name: "app", [dependencyType]: { runtime: "" } });

			await expect(checkDependency()).rejects.toThrow(
				"`runtime` must have a valid version specified",
			);
		},
	);

	test("requires package names before checking their manifests", async () => {
		vi.mocked(exec).mockResolvedValue(
			JSON.stringify([{ path: join(workingDirectory, "unnamed") }]),
		);

		await expect(checkDependency()).rejects.toThrow("must have a name field");
	});

	test.each(["{}", "null"])("rejects non-array package-manager output %s", async (output) => {
		vi.mocked(exec).mockResolvedValue(output);

		await expect(checkDependency()).rejects.toThrow(
			"Expected the `pnpm recursive ls --json` output to be a JSON array.",
		);
	});

	test("reports invalid package-manager output", async () => {
		vi.mocked(exec).mockResolvedValue("not json");

		await expect(checkDependency()).rejects.toThrow(
			"Cannot parse the `pnpm recursive ls --json` output as JSON.",
		);
	});
});

const mockPackages = async (...manifests: PackageManifest[]) => {
	const packages = await Promise.all(
		manifests.map(async (manifest, index) => {
			const packageDirectory = join(workingDirectory, `package-${index}`);

			await mkdir(packageDirectory);
			await writeFile(join(packageDirectory, "package.json"), JSON.stringify(manifest));

			return {
				name: manifest.name,
				path: packageDirectory,
			};
		}),
	);

	vi.mocked(exec).mockResolvedValue(JSON.stringify(packages));
};
