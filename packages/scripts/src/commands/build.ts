import { build } from "esbuild";
import { CWD } from "../constants";
import { run } from "../helpers";

// @todo: invariant checks (if no source field is provided in package.json => error)
// @todo: clean before building (share clean method with the clean command)
// @todo: esm, cjs, umd builds depending on package.json fields

const main = async () => {
	await run(
		"Building 👷‍♂️",
		build({
			absWorkingDir: CWD,
			entryPoints: ["./src/index.ts"],
			outdir: "dist", // @todo: read from package.json
			tsconfig: "tsconfig.json",
			target: "es2015",
		})
	);
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
