
var cordovaMediaManager = (function($) {
    "use strict";
    console.log('in cordovaMediaManager');
    var init, captureAndMove, copyFromGallery, fileNameToURL, fileNameToFile, fileNameToFileInfo,
        _fsReady,
        _moveFile, _copyFile, _getFileAndDestDirEntry, _moveToDir, _copyToDir, _initFileSystem, _fileNameToFileEntry;

    //TODO handle errors in all functions.

    init = function() {
        _fsReady = _initFileSystem();
    }

    captureAndMove = function(callbacks) {
        navigator.camera.getPicture(
            function(imageUrl) {
                _moveFile(imageUrl, callbacks);
            }, function() {
                console.log('failed as no imageData');
                callbacks.error();
            }, {quality: 50,
                destinationType: Camera.DestinationType.NATIVE_URI,
                saveToPhotoAlbum: false,
                allowEdit: false
            }
        );
    }

    copyFromGallery = function(callbacks) {
        navigator.camera.getPicture(
            function(imageUrl) {
                _copyFile(imageUrl, callbacks);
            }, function() {
                console.log('failed as no imageData');
                callbacks.error();
            }, {quality: 50,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                destinationType: Camera.DestinationType.NATIVE_URI,
                allowEdit: false
            }
        );
    }

    fileNameToURL = function(fileName, onSuccess) {
        _fileNameToFileEntry(fileName, function(fileEntry) {
            onSuccess(fileEntry.toURL());
        });
    }

    fileNameToFile = function(fileName, onSuccess) {
        _fileNameToFileEntry(fileName, function(file, type) {
            onSuccess(file, type);
        });
    }

    _fileNameToFileEntry = function(fileName, onSuccess) {
        _fsReady.then(function(fs) {
            console.log('fileName in _fileNameToFileEntry: ' + fileName)
            fs.root.getFile('dcs/' + fileName, {create: false}, function(fileEntry) {
                onSuccess(fileEntry);
            }, function() {
                console.log('error trying to get file: ' + fileName);
            });
        });
    }

    fileNameToFileInfo = function(fileName, onSuccess) {
        _fileNameToFileEntry(fileName, function(fileEntry) {
            fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onload = function( e ) {
                    console.log('in reader.load');
                    onSuccess( fileEntry.toURL(), file.type );
                };
                reader.onerror = function( e ) {
                    console.log('error trying to get file: ' + fileName);
                };
                reader.readAsArrayBuffer( file );
            });
        });

    }

    _moveFile = function(imageUrl, callbacks) {
        _getFileAndDestDirEntry(imageUrl, _moveToDir, callbacks);
    }

    _copyFile = function(imageUrl, callbacks) {
        _getFileAndDestDirEntry(imageUrl, _copyToDir, callbacks);
    }

    _getFileAndDestDirEntry = function(imageUrl, onSuccess, callbacks) {
        var resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

        resolveLocalFileSystemURL(imageUrl, function(fileEntry) {

            fileEntry.file(function(file){
                console.log('fileEntry.file.size: ' + file.size);
                if (file.size > 0) {
                    _fsReady.then(function(fs) {
                        console.log('in _fsReady then');
                        //TODO /dcs/media can't be created by one call. Make a recurssive method to handle this
                        fs.root.getDirectory('dcs/', {create:true, exclusive:false},
                            function(dirEntry) {
                                onSuccess(dirEntry, fileEntry, callbacks);
                            }, callbacks.error
                        );
                    }, callbacks.error);
                } else {
                    callbacks.error('Empty file');
                }
            },callbacks.error);
        });
    }

    _moveToDir = function(dirEntry, fileEntry, callbacks) {
        console.log('fileEntry.toURL:' + fileEntry.toURL());
        fileEntry.moveTo(dirEntry, fileEntry.name, function(newFileEntry) {
            console.log('moved file to media folder. New url: ' + newFileEntry.toURL());
            callbacks.success(newFileEntry.toURL(), newFileEntry.name);
        }, callbacks.error);
    }

    _copyToDir = function(dirEntry, fileEntry, callbacks) {
        // Hack to get the real name instead of asset number /media/external/images/media/397
        var filePathArray = fileEntry.toURL().split('/');
        var fileName = filePathArray[filePathArray.length-1];
        console.log('copy to dir; fileName: ' + fileName + '; fileEntry.toURL:' + fileEntry.toURL());
        fileEntry.copyTo(dirEntry, fileName, function(newFileEntry) {
            console.log('copied picked file to media folder. New url: ' + newFileEntry.toURL());
            callbacks.success(newFileEntry.toURL(), newFileEntry.name);
        }, callbacks.error);
    }


    _initFileSystem = function() {
        var deffered = $.Deferred();
        var fileSystemRequest  = window.requestFileSystem || window.webkitRequestFileSystem;

        fileSystemRequest(
            LocalFileSystem.PERSISTENT,
            0,
            deffered.resolve,
            deffered.reject);
        console.log('cordovaMediaManager init called');
        return deffered.promise();
    }

    //Init will be called after device ready from cordova-index
    //init();

    return {
        init: init,
        captureAndMove: captureAndMove,
        copyFromGallery: copyFromGallery,
        fileNameToURL: fileNameToURL,
        fileNameToFile: fileNameToFile,
        fileNameToFileInfo: fileNameToFileInfo
    };

} )(jQuery);