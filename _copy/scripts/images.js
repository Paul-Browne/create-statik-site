var timerStart = Date.now();

const fs = require('fs-extra');
const env = require('dotenv');
const jimp = require('jimp');
const mime = require('mime-types');
const sizeOf = require('image-size');
env.config();
const publicDirectoryName = process.env.PUBLIC_DIR_NAME || 'public';
const sourceDirectoryName = process.env.SOURCE_DIR_NAME || 'src';
const contentDirectoryName = process.env.CONTENT_DIR_NAME || 'content';
const contentDirectoryPath = sourceDirectoryName + "/" + contentDirectoryName;

function reformatOutputDirectory(dirOut, width) {
    var out = dirOut.replace("images", "images/" + width);
    return out;
}

function imageMaker(obj) {
    if (obj.width && sizeOf(obj.dirIn + obj.fileName).width >= obj.width) {
        jimp.read(obj.dirIn + obj.fileName, (err, file) => {
            if (err) {
                console.log(err);
            } else {
                file
                    .resize(obj.width, jimp.AUTO)
                    .quality(obj.quality)
                    .write(reformatOutputDirectory(obj.dirOut, obj.width) + obj.fileName);
                console.log(reformatOutputDirectory(obj.dirOut, obj.width) + obj.fileName + " generated, total time elapsed " + ((Date.now() - timerStart) / 1000).toFixed(2) + " seconds");
            }
        });
    } else if (!obj.width) {
        jimp.read(obj.dirIn + obj.fileName, (err, file) => {
            if (err) {
                console.log(err);
            } else {
                file
                    .quality(obj.quality)
                    .write(obj.dirOut + obj.fileName);
                console.log(obj.dirOut + obj.fileName + " generated, total time elapsed " + ((Date.now() - timerStart) / 1000).toFixed(2) + " seconds");
            }
        });
    }
}

function readDirRecursive(inDirectory, outDirectory) {
    fs.readdir(inDirectory, (err, filesOrDirectories) => {
        filesOrDirectories.forEach(name => {
            if (fs.lstatSync(inDirectory + name).isDirectory()) {
                readDirRecursive(inDirectory + name + "/", outDirectory + name + "/");
            } else {
                if (mime.lookup(name) === "image/jpeg" || mime.lookup(name) === "image/png" || mime.lookup(name) === "image/gif") { // todo check gif
                    imageMaker({
                        dirIn: inDirectory,
                        dirOut: outDirectory,
                        fileName: name,
                        width: 40,
                        quality: 0
                    });
                    imageMaker({
                        dirIn: inDirectory,
                        dirOut: outDirectory,
                        fileName: name,
                        width: 400,
                        quality: 80
                    });
                    imageMaker({
                        dirIn: inDirectory,
                        dirOut: outDirectory,
                        fileName: name,
                        width: 800,
                        quality: 80
                    });
                    imageMaker({
                        dirIn: inDirectory,
                        dirOut: outDirectory,
                        fileName: name,
                        width: 1200,
                        quality: 80
                    });
                    imageMaker({
                        dirIn: inDirectory,
                        dirOut: outDirectory,
                        fileName: name,
                        width: 1600,
                        quality: 80
                    });
                    imageMaker({
                        dirIn: inDirectory,
                        dirOut: outDirectory,
                        fileName: name,
                        width: 2000,
                        quality: 80
                    });
                    imageMaker({
                        dirIn: inDirectory,
                        dirOut: outDirectory,
                        fileName: name,
                        quality: 80
                    });
                } else if (mime.lookup(name) === "image/svg+xml") {
                    fs.copy(inDirectory + name, outDirectory + name, err => {
                        if (err) {
                            return console.error(err)
                        } else {
                            var newTime = Date.now() - timerStart;
                            console.log(outDirectory + name + " generated, total time elapsed " + (newTime / 1000).toFixed(2) + " seconds");
                        }
                    })
                }
            }
        });
    })
}

readDirRecursive(sourceDirectoryName + "/images/", publicDirectoryName + "/images/");