module.exports = {
	"$schema": "http://json.schemastore.org/prettierrc",
	"arrowParens": "always",
	"bracketSpacing": true,
	"endOfLine": "lf",
	"printWidth": 80,
	"semi": true,
	"singleAttributePerLine": true,
	"singleQuote": false,
	"trailingComma": "all",
	"useTabs": true,
    plugins: [require.resolve('prettier-plugin-astro')],
    overrides: [{
        files: '*.astro',
        options: {
            parser: 'astro',
        },
    }],
};