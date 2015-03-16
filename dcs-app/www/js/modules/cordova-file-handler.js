(function() {
    CordovaFileSytem = function() {
        console.log('CordovaFileSytem constructor');
    }

    var _fsReady, _working_dir;

    CordovaFileSytem.prototype = Object.create( FileSystemInterface );

    CordovaFileSytem.prototype.constructor = FileSystemInterface;

    CordovaFileSytem.prototype.init = function() {
        //Making var static with assumption that there will be only one filessytem to interact with
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
    * dirEntry created as: dcs/user_email/project_uuid; special chars replaced with _ (underscore)
    */
    CordovaFileSytem.prototype.setWorkingDir = function(user_email, project_uuid) {
        _working_dir = _getDeferredEntry(user_email, project_uuid);
        return _working_dir;
    };

    CordovaFileSytem.prototype.changeToTempAndClear = function(userEmail) {
        var that = this;

        //TODO how to call for resolved or reject
        return this.deleteUserFolders(userEmail, ['tmp']).then(function() {
            return that.setWorkingDir(userEmail, 'tmp');
        }, function(e) {
            return that.setWorkingDir(userEmail, 'tmp');
        });
    }

    function _getDeferredEntry(user_email, project_uuid) {
        var deferred = Q.defer();

        _fsReady.then(function(fs) {
            var path = _getPathToFolder(user_email) + project_uuid;
            console.log('trying to create path: ' + path);

            createPath(fs.root, path).then(function() {
                setCurrentDirTo(path, fs, deferred);
            },
                deferred.reject
            );
        }, deferred.reject);

        return deferred.promise;
    }

    var _getPathToFolder = function(user_email) {
        // TODO read the dcs (app_path) from config
        return 'dcs/' + slugify(user_email) + '/';
    }

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

    CordovaFileSytem.prototype.deleteFiles = function(fileNames) {
        var promises = fileNames.map(_deleteFileName);
        return Q.all(promises);
    };

    var _deleteFileName = function(fileName) {
        return fileNameToFileEntry(fileName).then(removeFileEntry);
    }

    var removeFileEntry = function(fileEntry) {
        var deferred = Q.defer();
        fileEntry.remove(function() {
                console.log('File removed.');
                deferred.resolve();
            },
            deferred.reject
        );
        return deferred.promise;
    }

    CordovaFileSytem.prototype.deleteUserFolders = function(userEmail, folderNames) {
        var userPath = _getPathToFolder(userEmail);
        return _fsReady.then(function(fs) {
            return _deleteFolders(fs, userPath, folderNames);
        });
    };

    CordovaFileSytem.prototype.deleteAllFoldersOfUser = function(userEmail) {
        var userPath = _getPathToFolder(userEmail);
        return _fsReady.then(function(fs) {
            return _getFolderEntry(fs, userPath).then(_deleteFolderEntry);
        });
    };

    CordovaFileSytem.prototype.moveTempFilesToFolder = function(userEmail, destFolder) {
        return _getDeferredEntry(userEmail, destFolder).then(function(destEntry) {
            return _moveTempFilesTo(userEmail, destEntry);
        })
    }

    CordovaFileSytem.prototype.moveTempFilesToCurrentDir = function(userEmail) {
        return _working_dir.then(function(destEntry) {
            return _moveTempFilesTo(userEmail, destEntry);
        })
    }

    var _moveTempFilesTo = function(userEmail, destEntry) {
        console.log('moveTempFilesTo: ' + destEntry.toURL());
        var userPath = _getPathToFolder(userEmail);

        return _fsReady.then(function(fs) {
            return _getFolderEntry(fs, userPath + 'tmp').then(function(folderEntry) {
                return getSubDirs(folderEntry).then(function(entries) {
                    return _moveFileEntriesTo(entries, destEntry);
                })
            });
        });
    }

    function toArray(list) {
        return Array.prototype.slice.call(list || [], 0);
    }

    function getSubDirs(folderEntry) {
        console.log('in getSubDirs; of: ' + folderEntry.fullPath);

        var deferred = Q.defer();

        var dirReader = folderEntry.createReader();
        var entries = [];
        // Call the reader.readEntries() until no more results are returned.
        var readEntries = function() {
            dirReader.readEntries(function(results) {
                if (!results.length) {
                    deferred.resolve(entries);
                } else {
                    entries = entries.concat(toArray(results));
                    readEntries();
                }
            }, deferred.reject);
        };
        readEntries();
        return deferred.promise;
    }

    function _moveFileEntriesTo(entries, destEntry) {
        console.log('in _moveFileEntriesTo; entries: ' + entries.length);
        var promises = [];
        var deferred = Q.defer();

        entries.forEach(function(entry, i) {
            promises.push(moveToDirDeferred(destEntry, entry))
        });
        Q.all(promises).then(deferred.resolve);

        return deferred.promise;
    }

    var _deleteFolders = function(fs, userPath, folderNames) {
        var folderEntriesPromises = folderNames.map(function(folderName) {
            console.log('fetching folderEntry of: ' + folderName);
            return _getFolderEntry(fs, userPath + folderName);
        });
        return _deleteFolderEntries(folderEntriesPromises);
    }

    var _getFolderEntry = function(fs, path) {
        var deferred = Q.defer();
        fs.root.getDirectory(
            path,
            {create:true, exclusive:false},
            deferred.resolve,
            function() {
                console.log('folder entry not-found: ' + path);
                deferred.reject()
            }
        );
        return deferred.promise;
    }

    var _deleteFolderEntries = function(folderEntriesPromises) {
        var deferred = Q.defer();
        Q.all(folderEntriesPromises).then(function(folderEntries) {
            var deletePromises = folderEntries.map(_deleteFolderEntry);
            Q.all(deletePromises).then(deferred.resolve);
        }, deferred.reject);
        return deferred.promise;
    }

    var _deleteFolderEntry = function(folderEntry) {
        var deferred = Q.defer();
        if (!folderEntry) deferred.resolve();

        folderEntry.removeRecursively(function() {
            console.log('Directory removed: ' + folderEntry.fullPath);
            deferred.resolve();
        }, deferred.reject);
        return deferred.promise;
    }

    var initFileSystem = function() {
        var deferred = Q.defer();
        var fileSystemRequest  = window.requestFileSystem || window.webkitRequestFileSystem;

        fileSystemRequest(
            LocalFileSystem.PERSISTENT,
            0,
            deferred.resolve,
            deferred.reject);
        console.log('cordovaMediaManager init called');
        return deferred.promise;
    };

    var slugify = function(text) {
        // convert text to lowercase and replaces non alpa chars and -(hypen) with _ (underscore)
        return text
            .toLowerCase()
            .replace(/[^\w-]+/g,'_');
    };

    var createPath = function(rootDirEntry, path) {
        var deferred = Q.defer();
        var folders = path.split('/');
        _createSubFoldersRecursively(rootDirEntry, folders, deferred);
        return deferred.promise;
    }

    var _createSubFoldersRecursively = function(rootDirEntry, folders, deferred) {
        folders = _cleanCurrentPath(folders);
        var currentParent = folders[0];

        rootDirEntry.getDirectory(currentParent, {
            create: true
            }, function(dirEntry) {
                var isNonLeafFolder = folders.length > 1;
                if (isNonLeafFolder) {
                    var subFolders = folders.slice(1);
                    _createSubFoldersRecursively(dirEntry, subFolders, deferred);
                } else {
                    deferred.resolve();
                }
            },
            deferred.reject
        );
    };

    var _cleanCurrentPath = function(folders) {
        // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
        if (folders[0] == '.' || folders[0] == '') {
            folders = folders.slice(1);
        }
        return folders;
    }

    var setCurrentDirTo = function(path, fs, deferred) {
        console.log('trying to set current dir to: ' + path);
        fs.root.getDirectory(
            path,
            {create:true, exclusive:false},
            deferred.resolve,
            deferred.reject
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


    var moveToDirDeferred = function(dirEntry, fileEntry) {
        var deferred = Q.defer();

        console.log('fileEntry.toURL:' + fileEntry.toURL());
        fileEntry.moveTo(dirEntry, fileEntry.name, function(newFileEntry) {
            console.log('moved file to media folder. New url: ' + newFileEntry.toURL());
            deferred.resolve(newFileEntry.toURL(), newFileEntry.name)
        }, deferred.reject);

        return deferred.promise;
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
        var deferred = Q.defer();

        console.log('fileName in fileNameToFileEntry: ' + fileName);
        _working_dir.then(function(dirEntry) {
            dirEntry.getFile(fileName, {create: false}, function(fileEntry) {
                console.log('fileEntry found...' + Object.keys(fileEntry));
                deferred.resolve(fileEntry);
            }, function(e) {
                console.log('error trying to get file: ' + fileName);
                deferred.reject();
            });
        });

        return deferred.promise;
    };

}());


