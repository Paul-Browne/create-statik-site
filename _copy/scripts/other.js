var timerStart = Date.now();

const fs = require('fs-extra');
const env = require('dotenv');
const mime = require('mime-types');
const mkdirp = require('mkdirp');
env.config();
const publicDirectoryName = process.env.PUBLIC_DIR_NAME || 'public';
const sourceDirectoryName = process.env.SOURCE_DIR_NAME || 'src';
const contentDirectoryName = process.env.CONTENT_DIR_NAME || 'content';
const contentDirectoryPath = sourceDirectoryName + "/" + contentDirectoryName;

function readDirRecursive(inDirectory, outDirectory){
	fs.readdir(inDirectory, (err, files) => {
	    files.forEach(name => {
	    	if(!fs.lstatSync(inDirectory + name).isDirectory()){
	    		fs.copy(inDirectory + name, outDirectory + name, err => {
	    		  if (err){
					return console.error(err)
	    		  }else{
	    		  	var newTime = Date.now() - timerStart;
	    		  	console.log(outDirectory + name + " generated, total time elapsed " + (newTime / 1000).toFixed(2) + " seconds" );
	    		  }
	    		})
	    	}
	    });
	})
}

readDirRecursive(sourceDirectoryName + "/", publicDirectoryName + "/");