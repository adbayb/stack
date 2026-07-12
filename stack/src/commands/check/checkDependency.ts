import { join } from "node:path";
import { helpers } from "termost";
import { assert, createError, require } from "../../helpers";
import type { PackageJson } from "../../types";

export const checkDependency = async () => {
	const stdout = await helpers.exec("pnpm recursive ls --json");
	const checkDependencyVersionMismatch = createPackagesVersionMismatchChecker();
	const parsedCommandOutput = JSON.parse(stdout) as { name?: string; path: string }[];

	const packages = parsedCommandOutput.map((pkg) => {
		const packagePath = join(pkg.path, "package.json");

		assert(pkg.name, () => createPackageError(`\`${packagePath}\` must have a name field.`));

		const packageContent = require(packagePath) as Partial<PackageJson>;
		const peerDependencies = packageContent.peerDependencies ?? {};
		const devDependencies = packageContent.devDependencies ?? {};
		const dependencies = packageContent.dependencies ?? {};

		return {
			dependencies,
			devDependencies,
			name: pkg.name,
			peerDependencies,
		};
	});

	for (const pkg of packages) {
		// Check version mismatches to guarantee a single copy for a given package in the monorepo (use case: prevent singleton-like issues with React contexts)
		checkDependencyVersionMismatch(pkg);
		// Check version range accordingly to our dependency guidelines (ie. dev dependencies must be pinned and dependencies must have caret)
		checkDependencyVersionRange(pkg);
	}
};

const checkDependencyVersionRange = ({
	dependencies,
	devDependencies,
	name,
	peerDependencies,
	// eslint-disable-next-line sonarjs/cyclomatic-complexity
}: PackageJson) => {
	for (const [dependencyName, version] of Object.entries(devDependencies)) {
		assertVersion(version, { consumedBy: name, name: dependencyName });

		if (version !== "workspace:*" && !isExcluded(version) && !/^\d/u.test(version))
			throw createPackageError(
				`As a dev dependency, \`${dependencyName}\` version must be fixed (or set as "workspace:*" for local packages) to reduce accidental breaking change risks due to an implicit semver upgrade.`,
				{
					consumedBy: name,
					name: dependencyName,
				},
			);
	}

	for (const [dependencyName, version] of Object.entries(dependencies)) {
		assertVersion(version, { consumedBy: name, name: dependencyName });

		if (version !== "workspace:^" && !hasCaret(version) && !isExcluded(version))
			throw createPackageError(
				`As a dependency, \`${dependencyName}\` version must be prefixed with a caret (or set as "workspace:^" for local packages) to optimize the size (whether of installation or bundle output) on the consumer side.`,
				{
					consumedBy: name,
					name: dependencyName,
				},
			);
	}

	for (const [dependencyName, version] of Object.entries(peerDependencies)) {
		assertVersion(version, { consumedBy: name, name: dependencyName });

		if (!hasCaret(version) && !isExcluded(version))
			/*
			 * Why disallowing workspace protocol as a version resolver?
			 * To reduce the update frequency needs consumer-side and guarantee on our side the minimum compatible version,
			 * the best practice should be to keeping an explicit number version which represents the lowest compatible version from an API perspective.
			 */
			throw createPackageError(
				`As a peer dependency, \`${dependencyName}\` version must be explicit (i.e. the "workspace:^" protocol a version resolver is not allowed) and prefixed with a caret to optimize the size (whether of installation or bundle output) on the consumer side.`,
				{
					consumedBy: name,
					name: dependencyName,
				},
			);
	}
};

const createPackagesVersionMismatchChecker = () => {
	const monorepoDependencies = new Map<string, string>();
	const monorepoDevelopmentDependencies = new Map<string, string>();

	const lint = (pkg: PackageJson, type: "development" | "production") => {
		const packageName = pkg.name;
		const isDevelopment = type === "development";
		const store = isDevelopment ? monorepoDevelopmentDependencies : monorepoDependencies;
		const dependencies = pkg[isDevelopment ? "devDependencies" : "dependencies"];

		for (const [dependencyName, dependencyVersion] of Object.entries(dependencies)) {
			if (!dependencyVersion) continue;

			const storedVersion = store.get(dependencyName);

			if (!storedVersion) {
				store.set(dependencyName, dependencyVersion);

				continue;
			}

			const isSameMonorepoVersion = dependencyVersion === storedVersion;

			if (!isSameMonorepoVersion) {
				throw createPackageError(
					`Mismatched versions: received version \`${dependencyVersion}\` while others use \`${storedVersion}\`. To prevent issues with singleton-like code (React contexts, …), please make sure to update all packages to use the same \`${dependencyName}\` version (either \`${storedVersion}\` or \`${dependencyVersion}\`).`,
					{
						consumedBy: packageName,
						name: dependencyName,
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
	consumedBy: PackageJson["name"];
	name: PackageJson["name"];
};

const createPackageError = (message: string, context?: PackageErrorContext) => {
	return createError(
		"stack check",
		context
			? `\`${context.name}\` consumed by \`${context.consumedBy}\` doesn't conform to package guidelines.\n${message}`
			: message,
	);
};

function assertVersion(
	version: string | undefined,
	{ consumedBy, name }: PackageErrorContext,
): asserts version {
	assert(version, () =>
		createPackageError(
			`\`${name}\` must have a valid version specified (current version equals to \`${String(version)}\`).`,
			{
				consumedBy,
				name,
			},
		),
	);
}

const isExcluded = (version: string) => {
	const isPreReleaseVersion = /\d+\.\d+\.\d+-(alpha|beta|experimental|next|rc).*/u.exec(version);
	const isNpmProtocol = version.startsWith("npm:");

	return isNpmProtocol || isPreReleaseVersion;
};

const hasCaret = (version: string) => version.startsWith("^");
