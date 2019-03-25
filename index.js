#!/usr/bin/env node
var args = process.argv[2];
var exec = require('child_process').exec;
var gitString = "git clone https://github.com/Paul-Browne/statik-site.git";
if(args){
	gitString += " " + args;
}

exec(gitString, function(err, stdout, stderr){
	var dirName = args ? args : "statik-site";
	console.log(" ");
	console.log("project '" + dirName + "' created in " + process.cwd() + "/" + dirName);
	console.log(" ");
	console.log("to get started simply...");
	console.log(" ");
	console.log("cd " + dirName);
	console.log("npm install");
	console.log("npm start");
	console.log(" ");
})
