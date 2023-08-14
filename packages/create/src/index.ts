#!/usr/bin/env node

/**
 * Package proxy using `@adbayb/stack` to benefit from NPM initializer `npm init @adbayb`
 * @see https://docs.npmjs.com/cli/v9/commands/npm-init
 */
import { helpers } from "termost";

helpers.exec("pnpm dlx @adbayb/stack create", { hasLiveOutput: true });
