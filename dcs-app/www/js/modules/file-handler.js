var FileSystemInterface = {
    init: function() {},
    setWorkingDir: function(userEmail, project_uuid) {},
    moveFile: function(url, callbacks) {},
    copyFile: function(imageUrl, callbacks) {},
    deleteFiles: function(fileNames) {},
    deleteUserFolders: function(userEmail, folders) {},
    deleteAllFoldersOfUser: function(userEmail) {},
    fileNameToURL: function(fileName, onSuccess, onError) {},
    fileNameToFile: function(fileName, onSuccess, onError) {},
    fileNameToFileInfo: function(fileName, onSuccess, onError) {}
};
