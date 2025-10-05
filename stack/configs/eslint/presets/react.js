import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactPlugin from "@eslint-react/eslint-plugin";

import { createConfig } from "../helpers.js";
import { JAVASCRIPT_FILES, JAVASCRIPT_LIKE_FILES } from "../constants.js";

const {
	configs: { all: reactPluginConfig },
} = reactPlugin;

export const config = createConfig(
	{
		files: JAVASCRIPT_LIKE_FILES,
		plugins: {
			...reactPluginConfig.plugins,
			"react-hooks": reactHooksPlugin,
		},
		rules: {
			"@eslint-react/dom/no-dangerously-set-innerhtml": "error",
			"@eslint-react/dom/no-dangerously-set-innerhtml-with-children":
				"error",
			"@eslint-react/dom/no-find-dom-node": "error",
			"@eslint-react/dom/no-flush-sync": "error",
			"@eslint-react/dom/no-hydrate": "error",
			"@eslint-react/dom/no-missing-button-type": "error",
			"@eslint-react/dom/no-missing-iframe-sandbox": "error",
			"@eslint-react/dom/no-namespace": "error",
			"@eslint-react/dom/no-render": "error",
			"@eslint-react/dom/no-render-return-value": "error",
			"@eslint-react/dom/no-script-url": "error",
			"@eslint-react/dom/no-string-style-prop": "error",
			"@eslint-react/dom/no-unsafe-iframe-sandbox": "error",
			"@eslint-react/dom/no-unsafe-target-blank": "error",
			"@eslint-react/dom/no-use-form-state": "error",
			"@eslint-react/dom/no-void-elements-with-children": "error",
			"@eslint-react/hooks-extra/no-direct-set-state-in-use-effect":
				"error",
			"@eslint-react/jsx-no-comment-textnodes": "error",
			"@eslint-react/jsx-no-iife": "error",
			"@eslint-react/jsx-shorthand-boolean": "error",
			"@eslint-react/jsx-shorthand-fragment": "error",
			"@eslint-react/naming-convention/component-name": "error",
			"@eslint-react/naming-convention/context-name": "error",
			"@eslint-react/naming-convention/use-state": "error",
			"@eslint-react/no-access-state-in-setstate": "error",
			"@eslint-react/no-children-prop": "error",
			"@eslint-react/no-class-component": "error",
			"@eslint-react/no-context-provider": "error",
			"@eslint-react/no-create-ref": "error",
			"@eslint-react/no-default-props": "error",
			"@eslint-react/no-direct-mutation-state": "error",
			"@eslint-react/no-duplicate-key": "error",
			"@eslint-react/no-forbidden-props": "error",
			"@eslint-react/no-forward-ref": "error",
			"@eslint-react/no-implicit-key": "error",
			"@eslint-react/no-leaked-conditional-rendering": "error",
			"@eslint-react/no-missing-component-display-name": "error",
			"@eslint-react/no-missing-key": "error",
			"@eslint-react/no-misused-capture-owner-stack": "error",
			"@eslint-react/no-nested-component-definitions": "error",
			"@eslint-react/no-nested-lazy-component-declarations": "error",
			"@eslint-react/no-prop-types": "error",
			"@eslint-react/no-string-refs": "error",
			"@eslint-react/no-unnecessary-key": "error",
			"@eslint-react/no-unnecessary-use-callback": "error",
			"@eslint-react/no-unnecessary-use-memo": "error",
			"@eslint-react/no-unnecessary-use-prefix": "error",
			"@eslint-react/no-unstable-context-value": "error",
			"@eslint-react/no-unstable-default-props": "error",
			"@eslint-react/no-unused-props": "error",
			"@eslint-react/no-use-context": "error",
			"@eslint-react/no-useless-forward-ref": "error",
			"@eslint-react/no-useless-fragment": "error",
			"@eslint-react/prefer-use-state-lazy-initialization": "error",
			"@eslint-react/web-api/no-leaked-event-listener": "error",
			"@eslint-react/web-api/no-leaked-interval": "error",
			"@eslint-react/web-api/no-leaked-resize-observer": "error",
			"@eslint-react/web-api/no-leaked-timeout": "error",
			"react-hooks/exhaustive-deps": "warn",
			"react-hooks/rules-of-hooks": "error",
		},
		settings: reactPluginConfig.settings,
	},
	{
		files: JAVASCRIPT_FILES,
		rules: {
			/*
			 * Disable type-checked-related rules for JavaScript files to prevent unconfigured TypeScript parser errors.
			 * Until the React X plugin provides a `disableTypeChecked`-like preset, we must maintain the rule list manually
			 * following the [documentation](https://eslint-react.xyz/docs/configuration/configure-project-config#type-information).
			 */
			"@eslint-react/no-leaked-conditional-rendering": "off",
			"@eslint-react/no-unused-props": "off",
		},
	},
);
