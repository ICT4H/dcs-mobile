describe('File system handler', function(){

    var fileSystem = new CordovaFileSytem();
    LocalFileSystem = {
        PERSISTENT: window.TEMPORARY
    }

    beforeEach(function() {
        fileSystem.init();
    });

    describe("apis", function() {
        it('should init the file system', function(done) {
            fileSystem.getFs().then(function(fs) {
                expect(fs.root).not.toBeNull();
                done();
            });
        })

        it("should change the working dir", function(done) {
            fileSystem.init();
            fileSystem.setWorkingDir('user@gmail.com', '3projectuuid4');

            fileSystem.getWorkingDirEntry().then(function(entry) {
                expect(entry.toURL()).toMatch('dcs/user_gmail_com/3projectuuid4');
                done();
            });
        });
    });

    describe('delete file api', function() {

        beforeEach(function(done) {
            fileSystem.init();
            fileSystem.setWorkingDir('user@gmail.com', '3projectuuid4').then(function(currentDir) {
                createDummyMediaFiles(['file1.jpg', 'file2.jpg'], currentDir).then(done);
            });
        });

        it("should delete the specific files inside the working dir", function(done) {
            fileSystem.deleteFiles(['file1.jpg']).then(function() {
                passWhenFileNotFound('file1.jpg', done);
            });
        });

        it("should retain other files when deleting a file", function(done) {
            fileSystem.deleteFiles(['file1.jpg']).then(function() {
                fileSystem.fileNameToURL('file2.jpg', done, failTest);
            });
        });

        it("should be reject when trying to delete non existing file", function(done) {
            fileSystem.deleteFiles(['non_eixting_file.jpg'])
                .then(failTest, done);
        });
        
        var createDummyMediaFiles = function(mediaFiles, currentDir) {
            var promises = [];
            $(mediaFiles).each(function() {
                promises.push(createEmptyFile(this, currentDir));
            });
            return Q.all(promises);
        }
    });

    describe('delete folder apis', function() {

        beforeEach(function(done) {
            fileSystem.init();
            fileSystem.setWorkingDir('user@gmail.com', '3projectuuid4').then(done);
        });

        it("should delete given folders of user", function(done) {
            fileSystem.deleteUserFolders('user@gmail.com', ['3projectuuid4']).then(function() {
                passWhenDirNotFound(done);
            }, failTest);
        })

        it("should delete given sub-folders of user", function(done) {
            createTwoSubFolders().then(function() {
                fileSystem.deleteUserFolders('user@gmail.com', ['3projectuuid4/s1', '3projectuuid4/s2']).then(function() {
                    verfiySubFolderAreDeleted(done);
                }, failTest);
            });
        })

        it("should not-fail to delete non-existing folder", function(done) {
            fileSystem.deleteUserFolders('user@gmail.com', ['non-existing-folder'])
                .then(done, failTest);
        })

        it("should not-fail to delete list of folders with existing or non-existing folders", function(done) {
            fileSystem.deleteUserFolders('user@gmail.com', ['3projectuuid4', 'non-existing-folder']).then(function() {
                    passWhenDirNotFound(done);
                }, failTest);
        })

        it("should delete all folders of given user", function(done) {
            fileSystem.deleteAllFoldersOfUser('user@gmail.com').then(function() {
                    passWhenDirNotFound(done);
                }, failTest);
        })

        function createTwoSubFolders() {
            return fileSystem.setWorkingDir('user@gmail.com', '3projectuuid4/s1').then(function() {
                return fileSystem.setWorkingDir('user@gmail.com', '3projectuuid4/s2');

            });
        }

        var _getFolderEntry = function(fs, path) {
            var deffered = Q.defer();
            fs.root.getDirectory(
                path, {create: false},
                deffered.resolve,
                deffered.reject
            );
            return deffered.promise;
        }

        function verfiySubFolderAreDeleted(done) {
            fileSystem.getFs().then(function(fs) {
                _getFolderEntry(fs, 'dcs/user_gmail_com/3projectuuid4/s1').then(function() {},
                    function(folderNotFound) {
                        _getFolderEntry(fs, 'dcs/user_gmail_com/3projectuuid4/s2').then(function() {},
                            done);
                    });
            })

        }

        var passWhenDirNotFound = function(done) {
            //TODO create new api to verify folder not exists
            fileSystem.getWorkingDirEntry().then(function(currentDirEntry) {
                var dirReader = currentDirEntry.createReader();
                dirReader.readEntries(function(results) {
                    failTest
                }, done);
            });
        }
    });

    describe('file maniputaion apis', function() {
        var sourceDirUrl;
        var FILE_WITH_CONTENT = 'fileWithContent.txt';

        beforeEach(function(done) {
            fileSystem.init();
            fileSystem.changeToTempAndClear('user@gmail.com').then(function(sourceDirEntry) {
                sourceDirUrl = sourceDirEntry.toURL();
                createFileWithDummyContent(sourceDirEntry).then(done);
            });
        });

        it('should copy file from source url to working dir', function(done) {
            fileSystem.setWorkingDir('user@gmail.com', 'destination').then(function(workingDir) {
                
                fileSystem.copyFile(sourceDirUrl + '/' + FILE_WITH_CONTENT, {success:function() {
                    
                    passWhenFileFound(FILE_WITH_CONTENT, done);
                }});
            });
        });

        it('should move file from source url to working dir', function(done) {
            fileSystem.setWorkingDir('user@gmail.com', 'destination').then(function(workingDir) {

                fileSystem.moveFile(sourceDirUrl + '/' + FILE_WITH_CONTENT, {success:function() {
                    
                    passWhenFileFound(FILE_WITH_CONTENT, done);
                }});
            });
        });

        it('should move files from tmp to the submission folder', function(done) {
            fileSystem.moveTempFilesToFolder('user@gmail.com', 'pid/sid').then(function() {
                fileSystem.setWorkingDir('user@gmail.com', 'pid/sid').then(function() {
                    passWhenFileFound(FILE_WITH_CONTENT, done);
                });
            })
        });

        it('should not-move other than tmp folder contents', function(done) {
            addTestFileToAnotherFolder().then(function() {
                fileSystem.moveTempFilesToFolder('user@gmail.com', 'pid/sid').then(function() {
                    verfiyNonTmpFolerContentNotMoved(done);
                })
            });
        });

        function verfiyNonTmpFolerContentNotMoved(done) {
            fileSystem.setWorkingDir('user@gmail.com', 'another_folder').then(function() {
                passWhenFileFound(FILE_WITH_CONTENT, done);
            });
        }


        function addTestFileToAnotherFolder() {
            var defered = Q.defer();
            fileSystem.setWorkingDir('user@gmail.com', 'another_folder').then(function(workingDir) {
                fileSystem.copyFile(sourceDirUrl + '/' + FILE_WITH_CONTENT, {success:defered.resolve});
            });
            return defered.promise;
        }

        function createFileWithDummyContent(dirEntry) {
            return createEmptyFile(FILE_WITH_CONTENT, dirEntry)
                .then(writeDummyContent);
        }

        function writeDummyContent(fileEntry) {
            var defered = Q.defer();
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = defered.resolve;
                var blob = new Blob(['Lorem Ipsum'], {type: 'text/plain'});
                fileWriter.write(blob);
            }, defered.reject);
            return defered.promise;
        }
    });

    var passWhenFileFound = function(fileName, done) {
        fileSystem.fileNameToFileInfo(fileName, done, failTest);
    }

    var passWhenFileNotFound = function(fileName, done) {
        fileSystem.fileNameToFileInfo(fileName, function() {}, done);
    }

    var failTest = function() {
        throw Error();
    }

    var createEmptyFile = function(fileName, dirEntry) {
        console.log('trying to create file: ' + fileName + ' in dir: ' + dirEntry.toURL());
        var deffered = Q.defer();
        dirEntry.getFile(fileName,
            {create: true, exclusive: false},
            deffered.resolve,
            deffered.reject
        );
        return deffered.promise;
    }
});