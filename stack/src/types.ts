import type { Termost } from "termost";

export type CommandFactory = (program: Termost) => void;

export type Filenames = string[];

export type PackageJson = {
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
	name: string;
	peerDependencies: Record<string, string>;
};
