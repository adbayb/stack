import { createConfig } from "./helpers.js";
import { config as dependenciesConfig } from "./presets/dependencies.js";
import { config as eslintConfig } from "./presets/eslint.js";
import { config as importConfig } from "./presets/import.js";
import { config as jsdocConfig } from "./presets/jsdoc.js";
import { config as markdownConfig } from "./presets/markdown.js";
import { config as nodeConfig } from "./presets/node.js";
import { prettierConfig } from "./presets/prettier.js";
import { config as reactConfig } from "./presets/react.js";
import { config as sonarConfig } from "./presets/sonar.js";
import { config as stylisticConfig } from "./presets/stylistic.js";
import { config as testConfig } from "./presets/test.js";
import { config as typescriptConfig } from "./presets/typescript.js";
import { config as unicornConfig } from "./presets/unicorn.js";

export default createConfig(
	eslintConfig,
	typescriptConfig,
	prettierConfig,
	importConfig,
	jsdocConfig,
	markdownConfig,
	nodeConfig,
	reactConfig,
	sonarConfig,
	stylisticConfig,
	testConfig,
	unicornConfig,
	dependenciesConfig,
);
