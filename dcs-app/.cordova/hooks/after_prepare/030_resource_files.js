#!/usr/bin/env node

//
// This hook copies various resource files from our version control system directories into the appropriate platform specific location
//


// configure all the files to copy.  Key of object is the source file, value is the destination location.  It's fine to put all platforms' icons and splash screen files here, even if we don't build for all platforms on each developer's box.
var filestocopy = [{
    "config/android/res/hdpi/icon.png": "platforms/android/res/drawable-hdpi/icon.png"
}, {
    "config/android/res/ldpi/icon.png": "platforms/android/res/drawable-ldpi/icon.png"
}, {
    "config/android/res/xxhpi/icon.png": "platforms/android/res/drawable-xxhpi/icon.png"
}, {
    "config/android/res/xxxhpi/icon.png": "platforms/android/res/drawable-xxxhpi/icon.png"
}, {
    "config/android/res/mdpi/icon.png": "platforms/android/res/drawable-mdpi/icon.png"
}, {
    "config/android/res/xhdpi/icon.png": "platforms/android/res/drawable-xhdpi/icon.png"
},];

var fs = require('fs');
var path = require('path');

// no need to configure below
var rootdir = process.argv[2];

filestocopy.forEach(function(obj) {
    Object.keys(obj).forEach(function(key) {
        var val = obj[key];
        var srcfile = path.join(rootdir, key);
        var destfile = path.join(rootdir, val);
        //console.log("copying "+srcfile+" to "+destfile);
        var destdir = path.dirname(destfile);
        if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
            fs.createReadStream(srcfile).pipe(fs.createWriteStream(destfile));
        }
    });
});
