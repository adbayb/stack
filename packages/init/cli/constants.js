const path = require("path");

const PROJECT_FOLDER = process.cwd();
const PACKAGE_FOLDER = path.resolve(__dirname, "../");
const TEMPLATES_FOLDER = path.join(PACKAGE_FOLDER, "templates");

module.exports = {
	PROJECT_FOLDER,
	TEMPLATES_FOLDER,
};
