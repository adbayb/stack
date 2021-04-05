#!/usr/bin/env node

import { setup } from "@adbayb/terminal-kit";

setup();

const command = process.argv[2] || "";

import(`./commands/${command}`)
	.then((module) => module.main())
	.catch((error) => {
		if (error.code === "MODULE_NOT_FOUND") {
			throw new ReferenceError(`Command "${command}" not found`);
		} else {
			throw error;
		}
	});
