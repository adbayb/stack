#!/usr/bin/env node

const command = process.argv[2]

switch(command) {
    case "build":
        require("./commands/build")
        break;
    case "check":
    case "fix":
    case "watch":
        console.log(`TODO: ${command}`)
        break;
    default:
        // @todo: make a log library that could be used across the monorepo:
        throw new ReferenceError("Command not found")
}