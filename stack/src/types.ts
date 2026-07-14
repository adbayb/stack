import type { Termost } from "termost";

export type CommandFactory = (program: Termost) => void;
export type Filenames = string[];

export type PackageJson = {
	name: string;
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
	peerDependencies: Record<string, string>;
};
