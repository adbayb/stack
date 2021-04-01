/* eslint-disable @typescript-eslint/no-var-requires */
import { resolve } from "path";
import { BuildOptions, build } from "esbuild";
import ts from "typescript";
import { CWD } from "../constants";
import { run } from "../helpers";

// @todo: invariant/assert checks (if no source field is provided in package.json => error)
// @todo: clean before building (share clean method with the clean command)
// @todo: support externals
// @todo: run tsc to emit declaration file based upon pkgMetadata target

type BundleFormat = NonNullable<BuildOptions["format"]>;
type PackageMetadata = {
	main: string;
	module: string;
	source: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

const isObject = (value: unknown): value is Record<string, string> => {
	return value !== null && typeof value === "object";
};

const getInjectPresets = (pkg: PackageMetadata): BuildOptions["inject"] => {
	const dependencyField = pkg.dependencies;

	if (!isObject(dependencyField)) {
		return;
	}

	const dependencies = Object.keys(dependencyField);
	const availablePresets = ["preact", "react"]; // @note: the order is important (search first preact before react)
	const getPreset = (name: string) => {
		return resolve(__dirname, `../../public/buildPresets/${name}.js`);
	};

	for (const preset of availablePresets) {
		if (dependencies.includes(preset)) {
			return [getPreset(preset)];
		}
	}

	return;
};

const createBundler = () => {
	// @note: always get fresh package.json data while running bundle command:
	const pkgMetadata: PackageMetadata = require(resolve(CWD, "package.json"));
	const tsMetadata = ts.parseJsonConfigFileContent(
		require(resolve(CWD, "tsconfig.json")),
		ts.sys,
		CWD
	).options;

	// @todo: prevent issues if no typescript or tsconfig provided
	const tsTarget = tsMetadata.target || ts.ScriptTarget.ESNext;
	// @note: convert ts target value to esbuild ones (latest value is not supported)
	const target = [ts.ScriptTarget.ESNext, ts.ScriptTarget.Latest].includes(
		tsTarget
	)
		? "esnext"
		: ts.ScriptTarget[tsTarget]?.toLowerCase();

	return (format: BundleFormat, isProduction?: boolean) => {
		const outfile =
			format === "esm" ? pkgMetadata.module : pkgMetadata.main;

		return build({
			absWorkingDir: CWD,
			bundle: true,
			define: {
				"process.env.NODE_ENV": isProduction
					? '"production"'
					: '"development"',
			},
			entryPoints: [pkgMetadata.source],
			outfile,
			tsconfig: "tsconfig.json",
			target,
			format,
			minify: isProduction,
			sourcemap: !isProduction,
			inject: getInjectPresets(pkgMetadata),
		});
	};
};

const main = async () => {
	const bundle = createBundler();
	const formats: BundleFormat[] = ["cjs", "esm"];

	for (const format of formats) {
		await run(`Building ${format} 👷‍♂️`, bundle(format, false));
	}
};

main();

/*
Only certain `tsconfig` fields are supported by ESBuild:
- baseUrl
- extends
- importsNotUsedAsValues
- jsxFactory
- jsxFragmentFactory
- paths
- useDefineForClassFields
Source: https://esbuild.github.io/content-types/#tsconfig-json

For the `target`/`module`... a mapping is necessary
*/

/*
ESBuild is not intented to make type checking or generate declaration typing file.
For these use cases:
- Declaration: tsc with emitDeclarationOnly (no typing bundle)
- Declaration: https://github.com/timocov/dts-bundle-generator (to bundle typing)
- Check: tsc with noEmit (not needed in watch mode: will only slow down watching process + IDE highlighting is sufficient. Could be used during build and in typing check during pre-commit hook)
*/
