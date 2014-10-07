var FileSystemInterface = {
    init: function() {},
    moveFile: function(url, callbacks) {}
};

(function() {
    CordovaFileSytem = function() {
        console.log('CordovaFileSytem constructor');
    }

    var _fsReady;

    CordovaFileSytem.prototype = Object.create( FileSystemInterface );

    CordovaFileSytem.prototype.constructor = FileSystemInterface;

    CordovaFileSytem.prototype.init = function() {
        //Making static with assumption that there will be only one type of filessytem to intreact with
        if(!_fsReady)
            _fsReady = initFileSystem();
    }

    CordovaFileSytem.prototype.moveFile = function(imageUrl, callbacks) {
        getFileAndDestDirEntry(imageUrl, moveToDir, callbacks);
    }

    CordovaFileSytem.prototype.copyFile = function(imageUrl, callbacks) {
        getFileAndDestDirEntry(imageUrl, copyToDir, callbacks);
    }

    CordovaFileSytem.prototype.fileNameToURL = function(fileName, onSuccess) {
        fileNameToFileEntry(fileName, function(fileEntry) {
            onSuccess(fileEntry.toURL());
        });
    }

    CordovaFileSytem.prototype.fileNameToFile = function(fileName, onSuccess) {
        fileNameToFileEntry(fileName, function(file, type) {
            onSuccess(file, type);
        });
    }

    CordovaFileSytem.prototype.fileNameToFileInfo = function(fileName, onSuccess) {
        fileNameToFileEntry(fileName, function(fileEntry) {
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

    var initFileSystem = function() {
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

    var getFileAndDestDirEntry = function(imageUrl, onSuccess, callbacks) {
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

    var moveToDir = function(dirEntry, fileEntry, callbacks) {
        console.log('fileEntry.toURL:' + fileEntry.toURL());
        fileEntry.moveTo(dirEntry, fileEntry.name, function(newFileEntry) {
            console.log('moved file to media folder. New url: ' + newFileEntry.toURL());
            callbacks.success(newFileEntry.toURL(), newFileEntry.name);
        }, callbacks.error);
    }

    var copyToDir = function(dirEntry, fileEntry, callbacks) {
        // Hack to get the real name instead of asset number /media/external/images/media/397
        var filePathArray = fileEntry.toURL().split('/');
        var fileName = filePathArray[filePathArray.length-1];
        console.log('copy to dir; fileName: ' + fileName + '; fileEntry.toURL:' + fileEntry.toURL());
        fileEntry.copyTo(dirEntry, fileName, function(newFileEntry) {
            console.log('copied selected file to media folder. New url: ' + newFileEntry.toURL());
            callbacks.success(newFileEntry.toURL(), newFileEntry.name);
        }, callbacks.error);
    }

    var fileNameToFileEntry = function(fileName, onSuccess) {
        _fsReady.then(function(fs) {
            console.log('fileName in fileNameToFileEntry: ' + fileName)
            fs.root.getFile('dcs/' + fileName, {create: false}, function(fileEntry) {
                onSuccess(fileEntry);
            }, function() {
                console.log('error trying to get file: ' + fileName);
            });
        });
    }

}());

var fileSystem = new CordovaFileSytem();
