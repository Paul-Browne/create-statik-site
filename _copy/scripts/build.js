const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const mime = require('mime-types');
const env = require('dotenv');
env.config();

// TODO
// add errors for [PH2] etc

const publicDirectoryName = process.env.PUBLIC_DIR_NAME || 'public';
const sourceDirectoryName = process.env.SOURCE_DIR_NAME || 'src';
const contentDirectoryName = process.env.CONTENT_DIR_NAME || 'content';
const contentDirectoryPath = sourceDirectoryName + '/' + contentDirectoryName;

const utility = require('./utility.js');
const cssFunc = require('./css.js');
const sassFunc = require('./sass.js');
const lessFunc = require('./less.js');
const jsFunc = require('./javascript.js');
const imgFunc = require('./images.js');
const svgFunc = require('./svg.js');
const htmlFunc = require('./html.js');


var htmlFuncCalled = false;

function jsons(){
    var arr = ["sitemap.json", "contentmap.json"];
    arr.forEach(function(element, index) {
       if (utility.fileHasBeenChangedSinceLastBuild(element)) {
           utility.consoleTimestampedMessage(chalk.cyan("processed: ") + element);
           utility.addTimeStamp(element);
           if(!htmlFuncCalled){
               htmlFuncCalled = true;
               htmlFunc();
           }
       } 
    });
}

function walkSync(inDirectory, outDirectory) {
    if (fs.statSync(inDirectory).isDirectory()) {
        fs.readdirSync(inDirectory).map(subDirectory => walkSync(path.join(inDirectory, subDirectory), path.join(outDirectory, subDirectory)))
    } else {
        if (utility.fileHasBeenChangedSinceLastBuild(inDirectory)) {
            if (inDirectory.indexOf(contentDirectoryPath) === 0) {
                utility.consoleTimestampedMessage(chalk.cyan("processed: ") + inDirectory);
                if(!htmlFuncCalled){
                    htmlFuncCalled = true;
                    htmlFunc();
                }
                utility.addTimeStamp(inDirectory);
            } else if (inDirectory.indexOf(sourceDirectoryName + '/css') === 0) {
                if (mime.lookup(inDirectory) === 'text/css') {
                    utility.consoleTimestampedMessage(chalk.cyan("processed: ") + inDirectory);
                    cssFunc(fs.readFileSync(inDirectory, 'utf8'), inDirectory, outDirectory);
                }
            } else if (inDirectory.indexOf(sourceDirectoryName + '/scss') === 0 || inDirectory.indexOf(sourceDirectoryName + '/sass') === 0) {
                if (mime.lookup(inDirectory) === 'text/x-scss' || mime.lookup(inDirectory) === 'text/x-sass') {
                    utility.consoleTimestampedMessage(chalk.cyan("processed: ") + inDirectory);
                    sassFunc(inDirectory, outDirectory);
                }
            } else if (inDirectory.indexOf(sourceDirectoryName + '/less') === 0) {
                if (mime.lookup(inDirectory) === 'text/less') {
                    utility.consoleTimestampedMessage(chalk.cyan("processed: ") + inDirectory);
                    lessFunc(fs.readFileSync(inDirectory, 'utf8'), inDirectory, outDirectory);
                }
            } else if (inDirectory.indexOf(sourceDirectoryName + '/js') === 0) {
                if (mime.lookup(inDirectory) === 'application/javascript') {
                    utility.consoleTimestampedMessage(chalk.cyan("processed: ") + inDirectory);
                    jsFunc(fs.readFileSync(inDirectory, 'utf8'), inDirectory, outDirectory)
                }
            } else if (inDirectory.indexOf(sourceDirectoryName + '/images') === 0) {
                if (mime.lookup(inDirectory) === 'image/jpeg' || mime.lookup(inDirectory) === 'image/png' || mime.lookup(inDirectory) === 'image/gif') { // todo check gif
                    utility.consoleTimestampedMessage(chalk.cyan("processed: ") + inDirectory);
                    imgFunc(inDirectory, outDirectory);
                } else if (mime.lookup(inDirectory) === 'image/svg+xml') {
                    utility.consoleTimestampedMessage(chalk.cyan("processed: ") + inDirectory);
                    // TODO: check if svg can be prettified
                    svgFunc(fs.readFileSync(inDirectory, 'utf8'), inDirectory, outDirectory);
                }
            } else if (inDirectory.indexOf(contentDirectoryPath) !== 0) {
                utility.consoleTimestampedMessage(chalk.cyan("processed: ") + inDirectory);
                // TODO: check files nested in subDirectories
                fs.copy(inDirectory, outDirectory, err => {
                    if (err) {
                        console.error(err)
                    } else {
                        utility.addTimeStamp(inDirectory);
                    }
                })
            }
        }
    }
}

walkSync(sourceDirectoryName, publicDirectoryName);
jsons();

module.exports = function() {
    jsons();
    walkSync(sourceDirectoryName, publicDirectoryName);
};