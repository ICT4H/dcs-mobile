(function() {
    CordovaFileSytem = function() {
        console.log('CordovaFileSytem constructor');
    }

    var _fsReady, _working_dir;

    CordovaFileSytem.prototype = Object.create( FileSystemInterface );

    CordovaFileSytem.prototype.constructor = FileSystemInterface;

    CordovaFileSytem.prototype.init = function() {
        //Making var static with assumption that there will be only one filessytem to intreact with
        if(!_fsReady)
            _fsReady = initFileSystem();
    };

    CordovaFileSytem.prototype.getFs = function() {
        return _fsReady;
    };

    /*
    * This creates and or sets _working_dir to dirEntry for file to be copied/read into/from.
    * The working dir should be set before copying/moving/reading file.
    *
    * dirEntry created as: dcs/user_email/project_name; special chars replaced with _ (underscore)
    */
    CordovaFileSytem.prototype.setWorkingDir = function(user_email, project_name) {
        var deffered = Q.defer();

        _fsReady.then(function(fs) {
            // TODO read the dcs (app_path) from config
            var path = 'dcs/' + slugify(user_email) + '/' + slugify(project_name);
            console.log('trying to create path: ' + path);

            createPath(fs.root, path).then(function() {
                setCurrentDirTo(path, fs, deffered);
            },
                deffered.reject
            );
        }, deffered.reject);

        return _working_dir = deffered.promise;
    };

    CordovaFileSytem.prototype.getWorkingDirEntry = function() {
        return _working_dir;
    };

    CordovaFileSytem.prototype.setWorkingDirForTest = function(working_dir) {
        _working_dir = working_dir;
    };

    CordovaFileSytem.prototype.moveFile = function(imageUrl, callbacks) {
        getFileAndDestDirEntry(imageUrl, moveToDir, callbacks);
    };

    CordovaFileSytem.prototype.copyFile = function(imageUrl, callbacks) {
        getFileAndDestDirEntry(imageUrl, copyToDir, callbacks);
    };

    CordovaFileSytem.prototype.fileNameToURL = function(fileName, onSuccess, onError) {
        fileNameToFileEntry(fileName).then(function(fileEntry) {
            onSuccess(fileEntry.toURL());
        }, onError);
    };

    CordovaFileSytem.prototype.fileNameToFile = function(fileName, onSuccess, onError) {
        fileNameToFileEntry(fileName).then(function(fileEntry) {
            onSuccess(file);
        }, onError);
    };

    CordovaFileSytem.prototype.fileNameToFileInfo = function(fileName, onSuccess, onError) {
        fileNameToFileEntry(fileName).then(function(fileEntry) {
            fileEntry.file(function(file) {
                var slice = file.slice(0,4);

                var reader = new FileReader();
                reader.onload = function() {
                    console.log('in reader.load');
                    onSuccess( fileEntry.toURL(), file.type );
                };
                reader.onerror = function() {
                    console.log('error trying to get file: ' + fileName);
                    onError();
                };
                reader.readAsArrayBuffer( slice );
            });
        }, onError);

    };

    CordovaFileSytem.prototype.deleteFile = function(fileName) {
        return fileNameToFileEntry(fileName).then(removeFileEntry);
    };

    CordovaFileSytem.prototype.deleteCurrentFolder = function(folderName) {
        var deffered = Q.defer();
        _working_dir.then(function(workingDirEntry) {
            workingDirEntry.removeRecursively(function() {
                console.log('Directory removed.');
                deffered.resolve();
            }, deffered.reject);
        })
        return deffered.promise;
    };

    var removeFileEntry = function(fileEntry) {
        var deffered = Q.defer();
        fileEntry.remove(function() {
                console.log('File removed.');
                deffered.resolve();
            },
            deffered.reject
        );
        return deffered.promise;
    }

    var initFileSystem = function() {
        var deffered = Q.defer();
        var fileSystemRequest  = window.requestFileSystem || window.webkitRequestFileSystem;

        fileSystemRequest(
            LocalFileSystem.PERSISTENT,
            0,
            deffered.resolve,
            deffered.reject);
        console.log('cordovaMediaManager init called');
        return deffered.promise;
    };

    var slugify = function(text) {
        // convert text to lowercase and replaces non alpa chars and -(hypen) with _ (underscore)
        return text
            .toLowerCase()
            .replace(/[^\w-]+/g,'_');
    };

    var createPath = function(rootDirEntry, path) {
        var deffered = Q.defer();
        var folders = path.split('/');
        _createSubFoldersRecursively(rootDirEntry, folders, deffered);
        return deffered.promise;
    }

    var _createSubFoldersRecursively = function(rootDirEntry, folders, deffered) {
        folders = _cleanCurrentPath(folders);
        var currentParent = folders[0];

        rootDirEntry.getDirectory(currentParent, {
            create: true
            }, function(dirEntry) {
                var isNonLeafFolder = folders.length > 1;
                if (isNonLeafFolder) {
                    var subFolders = folders.slice(1);
                    _createSubFoldersRecursively(dirEntry, subFolders, deffered);
                } else {
                    deffered.resolve();
                }
            },
            deffered.reject
        );
    };

    var _cleanCurrentPath = function(folders) {
        // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
        if (folders[0] == '.' || folders[0] == '') {
            folders = folders.slice(1);
        }
        return folders;
    }

    var setCurrentDirTo = function(path, fs, deffered) {
        console.log('trying to set current dir to: ' + path);
        fs.root.getDirectory(
            path,
            {create:true, exclusive:false},
            deffered.resolve,
            deffered.reject
        );
    }

    var getFileAndDestDirEntry = function(imageUrl, onSuccess, callbacks) {
        var resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
        console.log('in getFileAndDestDirEntry: ' + imageUrl);
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

    var fileNameToFileEntry = function(fileName) {
        var deffered = Q.defer();

        console.log('fileName in fileNameToFileEntry: ' + fileName);
        _working_dir.then(function(dirEntry) {
            dirEntry.getFile(fileName, {create: false}, function(fileEntry) {
                console.log('fileEntry found...' + Object.keys(fileEntry));
                deffered.resolve(fileEntry);
            }, function(e) {
                console.log('error trying to get file: ' + fileName);
                deffered.reject();
            });
        });

        return deffered.promise;
    };

}());


