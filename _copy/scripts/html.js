const chalk = require('chalk');
const fs = require('fs-extra');
const env = require('dotenv');
env.config();
const mkdirp = require('mkdirp');
const minify = require('html-minifier').minify;
const request = require('request');
const utility = require('./utility.js');


// template engines 
const mustache = require('mustache');
const handlebars = require('handlebars');
const underscore = require('underscore');
const art = require('art-template');
const ejs = require('ejs');
const dot = require('dot');
const pug = require('pug');

const publicDirectoryName = process.env.PUBLIC_DIR_NAME || 'public';
const sourceDirectoryName = process.env.SOURCE_DIR_NAME || 'src';
const contentDirectoryName = process.env.CONTENT_DIR_NAME || 'content';
const contentDirectoryPath = sourceDirectoryName + "/" + contentDirectoryName;

function _request(url, template) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                resolve(body);
            } else {
                console.log("error in '" + template + "' url: '" + url + "' not found");
            }
        })
    })
}

function replacePlaceholdersWithDefaults(html){
    if (html.match(/\[\[.*?\|\|.*?\]\]/g)) {
        html.match(/\[\[.*?\|\|.*?\]\]/g).forEach(function(ph) {
            var def = ph.match(/\|\|.*?\]\]/)[0].slice(2).replace("]]", "");
            html = html.replace(ph, def);
        }, this)
    }
    return html;
}


function removeUnusedPlaceholders(html) {
    if (html.match(/\[\[(\w|-|_)*?\]\]/g)) {
        html.match(/\[\[(\w|-|_)*?\]\]/g).forEach(function(ph) {
            html = html.replace(ph, "");
        }, this)
    }
    return html;
}

function replacePlaceholders(filename, obj) {
    if (filename.match(/\[\w*\d+\]/g)) {
        filename.match(/\[\w*\d+\]/g).forEach(function(ph, index) {
            filename = filename.replace(ph, obj[ph.replace(/\D/g, "")]);
        }, this)
    }
    return filename;
}

function isExternal(path) {
    if (/^https?:\/\//.test(path)) {
        return true;
    } else {
        return false;
    }
}

async function generateHTML(inHTML, temp){
    var output;
    for (var key in inHTML) {
        var string = new RegExp("\\[\\[" + inHTML[key].replace + "(\\|\\|.*?\\]\\]\|\\]\\])");
        var fileContents;
        var template;
        var data;
        if (inHTML[key].replace === "html") {
            if (isExternal(inHTML[key].content)) {
                output = await _request(inHTML[key].content, temp);
            } else {
                try {
                    output = fs.readFileSync(contentDirectoryPath + "/" + inHTML[key].content + ".html", 'utf8');
                } catch(e) {
                    console.log("error in " + temp + " " + contentDirectoryPath + "/" + inHTML[key].content + ".html" + " not found");
                }
            }
        }else if(inHTML[key].engine || inHTML[key].data) {
            if (isExternal(inHTML[key].content)) {
                template = await _request(inHTML[key].content, temp);
            } else {
                try {
                    template = fs.readFileSync(contentDirectoryPath + "/" + inHTML[key].content, 'utf8');
                } catch(e) {
                    console.log("error in '" + temp + "' '" + contentDirectoryPath + "/" + inHTML[key].content + "' not found");
                }
            }
            if (isExternal(inHTML[key].data)) {
                data = await _request(inHTML[key].data, temp);
            } else {
                try {
                    data = fs.readFileSync(contentDirectoryPath + "/" + inHTML[key].data, 'utf8');
                } catch(e) {
                    console.log("error in '" + temp + "' file: '" + contentDirectoryPath + "/" + inHTML[key].data + "' not found");
                }
            }
            if (inHTML[key].object) {
                if(data !== undefined && JSON.parse(data)[inHTML[key].object]){
                    data = JSON.parse(data)[inHTML[key].object];
                }else{
                    console.log("error in '" + temp + "' object: '" + inHTML[key].object + "' not found in '" + inHTML[key].data + "'");
                }
            } else {
                if(data !== undefined){
                    data = JSON.parse(data);
                }
            }
            if (template !== undefined && data !== undefined && inHTML[key].engine) {
                if (inHTML[key].engine === "mustache") {
                    fileContents = mustache.render(template, data);
                } else if (inHTML[key].engine === "ejs") {
                    fileContents = ejs.render(template, data);
                } else if (inHTML[key].engine === "handlebars") {
                    template = handlebars.compile(template);
                    fileContents = template(data);
                } else if (inHTML[key].engine === "underscore" || inHTML[key].engine === "_") {
                    template = underscore.template(template);
                    fileContents = template(data);
                } else if (inHTML[key].engine === "dot") {
                    template = dot.template(template);
                    fileContents = template(data);
                } else if (inHTML[key].engine === "pug") {
                    template = pug.compile(template);
                    fileContents = template(data);
                } else if (inHTML[key].engine === "art") {
                    fileContents = art.render(template, data);
                }else{
                    console.log("error in '" + temp + "' no such template engine named: '" + inHTML[key].engine + "'");
                    console.log('\x1b[35m%s\x1b[0m',"use: mustache, handlebars, underscore, ejs, dot, pug or art");
                }
            } else if(template !== undefined && data !== undefined) {
                fileContents = mustache.render(template, data);
            }            
        }else {
            try {
                if (isExternal(inHTML[key].content)) {
                    fileContents = await _request(inHTML[key].content, temp);
                } else {
                    fileContents = fs.readFileSync(contentDirectoryPath + "/" + inHTML[key].content + ".html", 'utf8');
                }
            } catch (err) {
                if(~inHTML[key].content.indexOf("/")){
                    console.log("warning in '" + temp + "' '" + inHTML[key].content + "' looks like a path, but '" + contentDirectoryPath + "/" + inHTML[key].content + ".html' wasn't found");
                }
                fileContents = inHTML[key].content;
            }
        }
        output = output.replace(string, fileContents);
    }
    return output;
}

function flatten(json, placeholders, output, rep){
    for(var key in json){
        var obj = {};
        if(typeof json[key] === 'object' && json[key] !== null){
            flatten(json[key], placeholders, output, key);
        }else{
            obj.replace = rep;
            if(key !== "content" && key !== "template"){
                obj.replace = key;
            }
            obj.content = replacePlaceholders(json[key], placeholders);
            if(key === "engine" || key === "data" || key === "object"){
                output[output.length-1][key] = replacePlaceholders(json[key], placeholders);
            }else{
                output.push(obj);
            }
        }
    }
}

function createFile(name, dir, obj) {
    name = ~name.indexOf(".") ? name : name + ".html";
    var dirPath = dir ? "/" + dir : "";
    var data = fs.readFileSync('contentmap.json', 'utf8');
    var json = JSON.parse(data);
    var html = [];
    if(json[obj[0]]){
        flatten(json[obj[0]], obj, html, "html");
        generateHTML(html, obj[0]).then(out => {
            html = removeUnusedPlaceholders(out);
            html = replacePlaceholdersWithDefaults(html);
            html = minify(html, {
                removeAttributeQuotes: false,
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                removeComments: true,
                decodeEntities: true
            });
            fs.writeFile(publicDirectoryName + dirPath + "/" + name, html, function(err) {
                if (err) {
                    console.error(err);
                }else{
                    utility.consoleTimestampedMessage(chalk.green("generated:  ") + publicDirectoryName + dirPath + "/" + name)
                }
            });
        });
    }else{
        console.log("error in sitemap.json entry: " + dirPath + "/" + name.replace(".html", "") + " the template '" + obj[0] + "' is not found in contentmap.json");
    }
}

function jsonWalker(obj, lvl) {
    for (var key in obj) {
        if (typeof obj[key] === 'object' && !(obj[key] instanceof Array) && !(obj[key] instanceof String)) {
            if (lvl) {
                mkdirp(publicDirectoryName + "/" + lvl + "/" + key, function(err) {
                    if (err) {
                        console.error(err);
                    }
                });
                jsonWalker(obj[key], lvl + "/" + key);
            } else {
                mkdirp(publicDirectoryName + "/" + key, function(err) {
                    if (err) {
                        console.error(err);
                    }
                });
                jsonWalker(obj[key], key);
            }
        } else if (obj[key] instanceof Array) {
            createFile(key, lvl, obj[key]);
        }
    }
}

function buildHtml() {
    fs.readFile('sitemap.json', 'utf8', function(err, data) {
        if (err) {
            console.error(err);
        } else {
            mkdirp(publicDirectoryName, function(err) {
                if (err) {
                    console.error(err);
                } else {
                    jsonWalker(JSON.parse(data));
                }
            });
        }
    });
}


module.exports = function(){
    buildHtml();
};