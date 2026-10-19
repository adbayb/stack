import { strict as assert } from "node:assert";
import { describe, test } from "vitest";
import { createCleanCommand, isPreservedPath } from "./clean";

describe(createCleanCommand, () => {
	test("preserves installed dependencies and local environment files", () => {
		for (const path of [
			"node_modules",
			"node_modules/package",
			".env",
			".env.local",
			"src/.env.production",
		]) {
			assert.equal(isPreservedPath(path), true, `${path} must be preserved`);
		}
	});

	test("removes generated files without preserving lookalikes", () => {
		for (const path of ["dist", "src/app.ts", "my.env", ".envrc"]) {
			assert.equal(isPreservedPath(path), false, `${path} must remain removable`);
		}
	});
});
