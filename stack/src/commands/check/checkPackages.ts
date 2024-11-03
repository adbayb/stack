import { join } from "node:path";

import { helpers } from "termost";

import type { PackageJson } from "../../types";
import { assert, createError, require } from "../../helpers";

export const checkPackages = async () => {
	const stdout = await helpers.exec("pnpm recursive ls --json");
	const checkPackagesVersionMismatch = createPackagesVersionMismatchChecker();

	const packages = (
		JSON.parse(stdout) as {
			name?: string;
			path: string;
		}[]
	).map((pkg) => {
		const pkgPath = join(pkg.path, "package.json");

		assert(pkg.name, () =>
			createPackageError(`\`${pkgPath}\` must have a name field.`),
		);

		const pkgContent = require(pkgPath) as Partial<PackageJson>;
		const peerDependencies = pkgContent.peerDependencies ?? {};
		const devDependencies = pkgContent.devDependencies ?? {};
		const dependencies = pkgContent.dependencies ?? {};

		return {
			name: pkg.name,
			dependencies,
			devDependencies,
			peerDependencies,
		};
	});

	for (const pkg of packages) {
		// Check version mismatches to guarantee a single copy for a given package in the monorepo (use case: prevent singleton-like issues with React contexts)
		checkPackagesVersionMismatch(pkg);
		// Check version range accordingly to our dependency guidelines (ie. dev dependencies must be pinned and dependencies must have caret)
		checkPackagesVersionRange(pkg);
	}
};

const checkPackagesVersionRange = ({
	name,
	dependencies,
	devDependencies,
	peerDependencies,
}: PackageJson) => {
	for (const dependencyName of Object.keys(devDependencies)) {
		const version = devDependencies[dependencyName];

		assertVersion(version, { name: dependencyName, consumedBy: name });

		if (version !== "workspace:*" && !/^\d/.exec(version))
			throw createPackageError(
				`As a dev dependency, \`${dependencyName}\` version must be fixed (or set as "workspace:*" for local packages) to reduce accidental breaking change risks due to an implicit semver upgrade.`,
				{
					name: dependencyName,
					consumedBy: name,
				},
			);
	}

	const isPreReleaseVersion = (version: string) =>
		/\d+\.\d+\.\d+-(alpha|beta|experimental|next|rc).*/.exec(version);

	const hasNoCaret = (version: string) =>
		!isPreReleaseVersion(version) && !/^\^/.exec(version);

	for (const dependencyName of Object.keys(dependencies)) {
		const version = dependencies[dependencyName];

		assertVersion(version, { name: dependencyName, consumedBy: name });

		if (version !== "workspace:^" && hasNoCaret(version))
			throw createPackageError(
				`As a dependency, \`${dependencyName}\` version must be prefixed with a caret (or set as "workspace:^" for local packages) to optimize the size (whether of installation or bundle output) on the consumer side.`,
				{
					name: dependencyName,
					consumedBy: name,
				},
			);
	}

	for (const dependencyName of Object.keys(peerDependencies)) {
		const version = peerDependencies[dependencyName];

		assertVersion(version, { name: dependencyName, consumedBy: name });

		if (hasNoCaret(version))
			/*
			 * Why disallowing workspace protocol as a version resolver?
			 * To reduce the update frequency needs consumer-side and guarantee on our side the minimum compatible version,
			 * the best practice should be to keeping an explicit number version which represents the lowest compatible version from an API perspective.
			 */
			throw createPackageError(
				`As a peer dependency, \`${dependencyName}\` version must be explicit (i.e. the "workspace:^" protocol a version resolver is not allowed) and prefixed with a caret to optimize the size (whether of installation or bundle output) on the consumer side.`,
				{
					name: dependencyName,
					consumedBy: name,
				},
			);
	}
};

const createPackagesVersionMismatchChecker = () => {
	const monorepoDependencies = new Map<string, string>();
	const monorepoDevDependencies = new Map<string, string>();

	const lint = (pkg: PackageJson, type: "development" | "production") => {
		const pkgName = pkg.name;
		const isDev = type === "development";
		const store = isDev ? monorepoDevDependencies : monorepoDependencies;
		const dependencies = isDev ? pkg.devDependencies : pkg.dependencies;

		for (const dependencyName of Object.keys(dependencies)) {
			const depVersion = dependencies[dependencyName];

			if (!depVersion) continue;

			const storedVersion = store.get(dependencyName);

			if (!storedVersion) {
				store.set(dependencyName, depVersion);

				continue;
			}

			const isSameMonorepoVersion = depVersion === storedVersion;

			if (!isSameMonorepoVersion) {
				throw createPackageError(
					`Mismatched versions: received version \`${depVersion}\` while others use \`${storedVersion}\`. To prevent issues with singleton-like code (React contexts, ...), please make sure to update all packages to use the same \`${dependencyName}\` version (either \`${storedVersion}\` or \`${depVersion}\`.`,
					{
						name: dependencyName,
						consumedBy: pkgName,
					},
				);
			}
		}
	};

	return (pkg: PackageJson) => {
		lint(pkg, "development");
		lint(pkg, "production");
	};
};

type PackageErrorContext = {
	name: PackageJson["name"];
	consumedBy: PackageJson["name"];
};

const createPackageError = (message: string, context?: PackageErrorContext) => {
	return createError(
		"stack check",
		!context
			? message
			: `\`${context.name}\` consumed by \`${context.consumedBy}\` doesn't conform to our package policy.\n${message}`,
	);
};

function assertVersion(
	version: string | undefined,
	{ name, consumedBy }: PackageErrorContext,
): asserts version {
	assert(version, () =>
		createPackageError(
			`\`${name}\` must have a valid version specified (current version equals to \`${String(version)}\`).`,
			{
				name,
				consumedBy,
			},
		),
	);
}
