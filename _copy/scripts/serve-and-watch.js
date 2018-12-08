const fs = require('fs');
const os = require('os');
const http = require('http');
const http2 = require('spdy');
const serveStatic = require('serve-static');
const compression = require('compression');
const express = require('express');
const childProcess = require('child_process');
const chokidar = require('chokidar');
const env = require('dotenv');
env.config();

const publicDirectoryName = process.env.PUBLIC_DIR_NAME || 'public';
const sourceDirectoryName = process.env.SOURCE_DIR_NAME || 'src';
const contentDirectoryName = process.env.CONTENT_DIR_NAME || 'content';
const contentDirectoryPath = sourceDirectoryName + "/" + contentDirectoryName;

function serverSetup(protocal) {
    var app = express();
    app.use(compression())
    app.use(serveStatic(publicDirectoryName, {
        'extensions': ['html'],
        'maxAge': 3600000   // 1 hour
    }))
    if (protocal === "https") {
        http2.createServer({
            key: fs.readFileSync(os.homedir() + process.env.SSL_KEY_PATH, 'utf8'),
            cert: fs.readFileSync(os.homedir() + process.env.SSL_CRT_PATH, 'utf8')
        }, app).listen(8888);
    } else {
        http.createServer(app).listen(8888);
    }
    console.log(protocal + "://localhost:8888");
}


function startServer(){
    fs.open('./.env', 'r', (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log("no .env file found");
                serverSetup("http");
            }
        } else {
            fs.readFile('./.env', 'utf8', (err, data) => {
                if (data.indexOf('SSL_CRT_PATH') < 0 || data.indexOf('SSL_KEY_PATH') < 0) {
                    console.log("no SSL_CRT_PATH and/or SSL_KEY_PATH found in .env file");
                    serverSetup("http");
                } else {
                    serverSetup("https");
                }
            })
        }
    })
}

startServer();

function runScript(scriptPath, callback) {
    var invoked = false;
    var process = childProcess.fork(scriptPath);
    process.on('error', function(err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });
    process.on('exit', function(code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
}

function watching(watchDir, scriptPath, ignoreDir){
    var watched = chokidar.watch(watchDir, {
        ignored: ignoreDir,
        persistent: true,
        ignoreInitial: true
    });
    runScript(scriptPath, function(err) {
        if (err) {
            console.error(err);
        }
    });
    watched.on('all', (event, path) => {
        runScript(scriptPath, function(err) {
            if (err) {
                console.error(err);
            }
            console.log("file: " + path + " " + event);
        });
    });
}

watching(sourceDirectoryName + '/js', 'scripts/js.js');
watching(sourceDirectoryName + '/css', 'scripts/css.js');
watching(sourceDirectoryName + '/images', 'scripts/images.js');
watching([contentDirectoryPath, "contentmap.json", "sitemap.json"], 'scripts/build.js');
watching(sourceDirectoryName, 'scripts/other.js', sourceDirectoryName + "/*/*.*");


