#!/usr/bin/env node
 
//this hook installs all your plugins
 
// add your plugins to this list--either
// the identifier, the filesystem location
// or the URL
var pluginlist = [
  'https://github.com/ICT4H/Cordova-SQLitePlugin.git',
  'org.apache.cordova.camera',
  'org.apache.cordova.dialogs',
  'org.apache.cordova.file',
  'org.apache.cordova.file-transfer',
  'org.apache.cordova.media-capture',
  'uk.co.whiteoctober.cordova.appversion'
];
 
// no need to configure below
 
var sys = require('sys')
var exec = require('child_process').exec;
 
function puts(error, stdout, stderr) {
    sys.puts(stdout)
}
 
pluginlist.forEach(function(plug) {
    exec("cordova plugin add " + plug, puts);
});
