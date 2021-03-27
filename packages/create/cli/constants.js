const path = require("path");

// @todo: allow padding-line-between-statements breakline after require (to avoid conflicting with import breakline rule)
// eslint-disable-next-line padding-line-between-statements
const PROJECT_FOLDER = process.cwd();
const PACKAGE_FOLDER = path.resolve(__dirname, "../");
const TEMPLATES_FOLDER = path.join(PACKAGE_FOLDER, "templates");

module.exports = {
	PROJECT_FOLDER,
	TEMPLATES_FOLDER,
};
