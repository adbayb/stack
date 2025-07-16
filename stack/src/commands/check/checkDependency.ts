import { join } from "node:path";

import { helpers } from "termost";

import type { PackageJson } from "../../types";
import { assert, createError, require } from "../../helpers";

export const checkDependency = async () => {
	const stdout = await helpers.exec("pnpm recursive ls --json");

	const checkDependencyVersionMismatch =
		createPackagesVersionMismatchChecker();

	const packages = (
		JSON.parse(stdout) as {
			name?: string;
			path: string;
		}[]
	).map((package_) => {
		const packagePath = join(package_.path, "package.json");

		assert(package_.name, () =>
			createPackageError(`\`${packagePath}\` must have a name field.`),
		);

		const packageContent = require(packagePath) as Partial<PackageJson>;
		const peerDependencies = packageContent.peerDependencies ?? {};
		const devDependencies = packageContent.devDependencies ?? {};
		const dependencies = packageContent.dependencies ?? {};

		return {
			name: package_.name,
			dependencies,
			devDependencies,
			peerDependencies,
		};
	});

	for (const package_ of packages) {
		// Check version mismatches to guarantee a single copy for a given package in the monorepo (use case: prevent singleton-like issues with React contexts)
		checkDependencyVersionMismatch(package_);
		// Check version range accordingly to our dependency guidelines (ie. dev dependencies must be pinned and dependencies must have caret)
		checkDependencyVersionRange(package_);
	}
};

const checkDependencyVersionRange = ({
	name,
	dependencies,
	devDependencies,
	peerDependencies,
	// eslint-disable-next-line sonarjs/cyclomatic-complexity
}: PackageJson) => {
	for (const dependencyName of Object.keys(devDependencies)) {
		const version = devDependencies[dependencyName];

		assertVersion(version, { name: dependencyName, consumedBy: name });

		if (
			version !== "workspace:*" &&
			!isException(version) &&
			!/^\d/.test(version)
		)
			throw createPackageError(
				`As a dev dependency, \`${dependencyName}\` version must be fixed (or set as "workspace:*" for local packages) to reduce accidental breaking change risks due to an implicit semver upgrade.`,
				{
					name: dependencyName,
					consumedBy: name,
				},
			);
	}

	for (const dependencyName of Object.keys(dependencies)) {
		const version = dependencies[dependencyName];

		assertVersion(version, { name: dependencyName, consumedBy: name });

		if (
			version !== "workspace:^" &&
			!hasCaret(version) &&
			!isException(version)
		)
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

		if (!hasCaret(version) && !isException(version))
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
	const monorepoDevelopmentDependencies = new Map<string, string>();

	const lint = (
		package_: PackageJson,
		type: "development" | "production",
	) => {
		const packageName = package_.name;
		const isDevelopment = type === "development";

		const store = isDevelopment
			? monorepoDevelopmentDependencies
			: monorepoDependencies;

		const dependencies = isDevelopment
			? package_.devDependencies
			: package_.dependencies;

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
					`Mismatched versions: received version \`${depVersion}\` while others use \`${storedVersion}\`. To prevent issues with singleton-like code (React contexts, …), please make sure to update all packages to use the same \`${dependencyName}\` version (either \`${storedVersion}\` or \`${depVersion}\`).`,
					{
						name: dependencyName,
						consumedBy: packageName,
					},
				);
			}
		}
	};

	return (package_: PackageJson) => {
		lint(package_, "development");
		lint(package_, "production");
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
			: `\`${context.name}\` consumed by \`${context.consumedBy}\` doesn't conform to package guidelines.\n${message}`,
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

const isException = (version: string) => {
	const isPreReleaseVersion =
		/\d+\.\d+\.\d+-(alpha|beta|experimental|next|rc).*/.exec(version);

	const isNpmProtocol = version.startsWith("npm:");

	return isNpmProtocol || isPreReleaseVersion;
};

const hasCaret = (version: string) => version.startsWith("^");
