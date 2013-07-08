#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');
var OUTPUT_FILE = "out.json";
var CHECKSFILE_DEFAULT = "checks.json";
var HTMLFILE_DEFAULT = null; //"index.html";
var HTMLURL_DEFAULT = null; //"http://secure-sea-5136.herokuapp.com/";

var buildfn = function(checksfile) {
  var response2console = function(result, response) {
    if (result instanceof Error) {
      console.error('Error: ' + util.format(response.message));
      process.exit(1);
    } else {
      var checkJson = checkHtmlFile(result, checksfile);
      var outJson = JSON.stringify(checkJson, null, 4);
      fs.writeFileSync(OUTPUT_FILE, outJson);
      console.log(outJson);
    }
  };
  return response2console;
};

var checkHtmlFromUrl = function(url, checksfile) {
  var response2console = buildfn(checksfile);
  rest.get(url).on('complete', response2console);
};

var assertUrlExists = function(inUrl) {
  var instr = inUrl.toString();
  return instr;
};

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if(!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
  }
  return instr;
};

var cheerioHtmlFile = function(htmlfile) {
  return cheerio.load(htmlfile);
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
  $ = cheerioHtmlFile(htmlfile);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var checkHtmlFromFile = function(file, checks) {
  var fileData = fs.readFileSync(file);
  var checkJson = checkHtmlFile(fileData, checks);
  var outJson = JSON.stringify(checkJson, null, 4);
  fs.writeFileSync(OUTPUT_FILE, outJson);
  console.log(outJson);
};

var clone = function(fn) {
  // Workaround for commander.js issue.
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

var init = function(checks, file, url) {
  if (file) {
    checkHtmlFromFile(file, checks);
  } if (url) {
    checkHtmlFromUrl(url, checks);
  } else {
    console.error("Enter file or url");
  }
};

if(require.main == module) {
  program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <url_link>', 'link of index.html', clone(assertUrlExists), HTMLURL_DEFAULT)
    .parse(process.argv);
  init(program.checks, program.file, program.url);
} else {
  exports.checkHtmlFile = checkHtmlFile;
}
