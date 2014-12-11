(function() {
    CordovaFileSytem = function() {
        console.log('CordovaFileSytem constructor');
    }

    var _fsReady, _working_dir;

    CordovaFileSytem.prototype = Object.create( FileSystemInterface );

    CordovaFileSytem.prototype.constructor = FileSystemInterface;

    CordovaFileSytem.prototype.init = function() {
        //Making static with assumption that there will be only one type of filessytem to intreact with
        if(!_fsReady)
            _fsReady = initFileSystem();
    };

    /*
    * This sets _working_dir for file to be copied/read into/from.
    * This working dir should be set before copying/moving/reading file.
    */
    CordovaFileSytem.prototype.setWorkingDir = function(user_email, project_name) {
        var deffered = $.Deferred();

        _fsReady.then(function(fs) {
            // TODO read the dcs (app_path) from config
            var path = 'dcs/' + slugify(user_email) + '/' + slugify(project_name);
            console.log('fs is ready creating/setting current directory to: ' + path);
            createDir(fs.root, path.split('/'), deffered.reject);
            // dirs created, set _working_dir to it.
            fs.root.getDirectory(
                path,
                {create:true, exclusive:false},
                deffered.resolve,
                deffered.reject
            );
        }, deffered.reject);

        _working_dir = deffered.promise();
    };

    CordovaFileSytem.prototype.getWorkingDirEntry = function() {
        return _working_dir;
    };
    var slugify = function(text) {
        // convert text to lowercase and replaces non alpa chars and -(hypen) with _ (underscore)
        return text
            .toLowerCase()
            .replace(/[^\w-]+/g,'_');
    };

    function createDir(rootDirEntry, folders, errorHandler) {
        console.log('in createDirEntry: ' + folders);
        // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
      if (folders[0] == '.' || folders[0] == '') {
        folders = folders.slice(1);
      }

      rootDirEntry.getDirectory(folders[0], {create: true}, function(dirEntry) {
        if (folders.length > 1) {
          createDir(dirEntry, folders.slice(1), errorHandler);
        }
      }, errorHandler);
    };

    CordovaFileSytem.prototype.moveFile = function(imageUrl, callbacks) {
        getFileAndDestDirEntry(imageUrl, moveToDir, callbacks);
    };

    CordovaFileSytem.prototype.copyFile = function(imageUrl, callbacks) {
        getFileAndDestDirEntry(imageUrl, copyToDir, callbacks);
    };

    CordovaFileSytem.prototype.fileNameToURL = function(fileName, onSuccess) {
        fileNameToFileEntry(fileName, function(fileEntry) {
            onSuccess(fileEntry.toURL());
        });
    };

    CordovaFileSytem.prototype.fileNameToFile = function(fileName, onSuccess) {
        fileNameToFileEntry(fileName, function(file, type) {
            onSuccess(file, type);
        });
    };

    CordovaFileSytem.prototype.fileNameToFileInfo = function(fileName, onSuccess) {
        fileNameToFileEntry(fileName, function(fileEntry) {
            fileEntry.file(function(file) {
                var slice = file.slice(0,4);

                var reader = new FileReader();
                reader.onload = function() {
                    console.log('in reader.load');
                    onSuccess( fileEntry.toURL(), file.type );
                };
                reader.onerror = function() {
                    console.log('error trying to get file: ' + fileName);
                };
                reader.readAsArrayBuffer( slice );
            });
        });

    };

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
    };

    var getFileAndDestDirEntry = function(imageUrl, onSuccess, callbacks) {
        var resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

        resolveLocalFileSystemURL(imageUrl, function(fileEntry) {

            fileEntry.file(function(file){
                console.log('fileEntry.file.size: ' + file.size);
                // fileSizeInBytes
                if (file.size > 0) {
                    _working_dir.then(function(dirEntry) {
                        onSuccess(dirEntry, fileEntry, callbacks);
                    }, callbacks.error);
                } else {
                    callbacks.error('Empty file');
                }
            },callbacks.error);
        });
    };

    var moveToDir = function(dirEntry, fileEntry, callbacks) {
        console.log('fileEntry.toURL:' + fileEntry.toURL());
        fileEntry.moveTo(dirEntry, fileEntry.name, function(newFileEntry) {
            console.log('moved file to media folder. New url: ' + newFileEntry.toURL());
            callbacks.success(newFileEntry.toURL(), newFileEntry.name);
        }, callbacks.error);
    };

    var copyToDir = function(dirEntry, fileEntry, callbacks) {
        // Hack to get the real name instead of asset number /media/external/images/media/397
        var filePathArray = fileEntry.toURL().split('/');
        var fileName = filePathArray[filePathArray.length-1];
        console.log('copy to dir; fileName: ' + fileName + '; fileEntry.toURL:' + fileEntry.toURL());
        fileEntry.copyTo(dirEntry, fileName, function(newFileEntry) {
            console.log('copied selected file to media folder. New url: ' + newFileEntry.toURL());
            callbacks.success(newFileEntry.toURL(), newFileEntry.name);
        }, callbacks.error);
    };

    var fileNameToFileEntry = function(fileName, onSuccess) {
        _fsReady.then(function(fs) {
            console.log('fileName in fileNameToFileEntry: ' + fileName)
            _working_dir.then(function(dirEntry) {
                dirEntry.getFile(fileName, {create: false}, function(fileEntry) {
                    onSuccess(fileEntry);
                }, function() {
                    console.log('error trying to get file: ' + fileName);
                });
            });
        });
    };

}());

var fileSystem = new CordovaFileSytem();
