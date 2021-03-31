/* eslint-disable @typescript-eslint/no-var-requires */
import { BuildOptions, build } from "esbuild";
import { resolve } from "path";
import { CWD } from "../constants";
import { run } from "../helpers";

// @todo: invariant checks (if no source field is provided in package.json => error)
// @todo: clean before building (share clean method with the clean command)
// @todo: esm, cjs, umd builds depending on package.json fields

const pkgMetadata = require(resolve(CWD, "package.json"));
const tsMetadata = require(resolve(CWD, "tsconfig.json"));

// @todo: run tsc to emit declaration file based upon pkgMetadata target
console.warn(tsMetadata, __dirname);

type BundleFormat = NonNullable<BuildOptions["format"]>;

const bundle = (format: BundleFormat, isProduction?: boolean) => {
	const outfile = format === "esm" ? pkgMetadata.module : pkgMetadata.main;

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
		target: "es2015",
		format,
		minify: isProduction,
		sourcemap: !isProduction,
		// @todo: inject only if react-jsx / react-jsx-dev is defined (use typescript api to read the whole flatten tsconfig)
		// @todo: choose preact or react preset based upon pkg dependencies! (if dependencies.preact key exists -> preact preset -> else if dependencies.react key exists -> react presets -> else do nothing)
		inject: [resolve(__dirname, "../../public/buildPresets/preact.js")],
	});
};

const main = async () => {
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
