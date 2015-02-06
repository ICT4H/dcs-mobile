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
            fileSystem.setWorkingDir('user@gmail.com', 'some cool project');

            fileSystem.getWorkingDirEntry().then(function(entry) {
                expect(entry.toURL()).toMatch('dcs/user_gmail_com/some_cool_project');
                done();
            });
        });
    });

    describe('delete api', function() {

        beforeEach(function(done) {
            fileSystem.init();
            fileSystem.setWorkingDir('user@gmail.com', 'some cool project').then(function(currentDir) {
                createDummyMediaFiles(['file1.jpg', 'file2.jpg'], currentDir).then(done);
            });
        });

        it("should delete the specific files inside the working dir", function(done) {
            fileSystem.deleteFile('file1.jpg').then(function() {
                passWhenFileNotFound('file1.jpg', done);
            });
        });

        it("should retain other files when deleting a file", function(done) {
            fileSystem.deleteFile('file1.jpg').then(function() {
                fileSystem.fileNameToURL('file2.jpg', done, failTest);
            });
        });

        it("should be reject when trying to delete non existing file", function(done) {
            fileSystem.deleteFile('non_eixting_file.jpg')
                .then(failTest, done);
        });
        
        it("should delete the working dir", function(done) {
            fileSystem.deleteCurrentFolder().then(function() {
                    passWhenDirNotFound(done);
                }, failTest);
        })

        var createDummyMediaFiles = function(mediaFiles, currentDir) {
            var promises = [];
            $(mediaFiles).each(function() {
                promises.push(createEmptyFile(this, currentDir));
            });
            return Q.all(promises);
        }

        var passWhenDirNotFound = function(done) {
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
            fileSystem.setWorkingDir('user@gmail.com', 'source').then(function(sourceDirEntry) {
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