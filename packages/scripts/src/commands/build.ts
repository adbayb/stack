import path from "path";
import esbuild from "esbuild";

esbuild.build({});

console.log("plop", process.cwd(), path.resolve(process.cwd()));
