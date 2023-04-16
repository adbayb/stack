#!/usr/bin/env node

import { termost } from "termost";

console.log("Hello TS");

const program = termost({
	name: "@adbayb/create",
	description: "Toolbox to easily scaffold a JavaScript/TypeScript project",
});

program.task({
	label: "Hello",
	handler() {
		console.log("hello");
	},
});
