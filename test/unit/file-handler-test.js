describe('File system handler', function(){

    beforeEach(function() {
        LocalFileSystem = {
            PERSISTENT: window.TEMPORARY
        }

        fileSystem.init();
    });

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