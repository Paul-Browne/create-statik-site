const utility = require("./utility.js");
const uglifyJS = require("uglify-js");
const babel = require("@babel/core");

module.exports = function(source, inPath, outPath){
	var transform = babel.transformSync(source).code;
	var result = uglifyJS.minify(transform);
	utility.writeOut(result.code, inPath, outPath);
};