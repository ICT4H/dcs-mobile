dcsApp.controller('importController', ['$scope', 'messageService', function ($scope, msg) {
	$scope.pageTitle = "Import";
	$scope.msg = 'World';
    $scope.fileName = 'project-dcs.json';

    $scope.import = function() {
    	msg.showLoadingWithInfo('Importing project data');
    	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
    }

    function gotFS(fileSystem) {
        fileSystem.root.getFile($scope.fileName, null, gotFileEntry, fail);
    }

    function gotFileEntry(fileEntry) {
        fileEntry.file(gotFile, fail);
    }

    function gotFile(file){
        readAsText(file);
    }

    function readAsText(file) {
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            console.log("Read as text");
            var dataRead = evt.target.result;
            

            var projects = angular.fromJson(dataRead).projects;

            projects.forEach(function(p) {
            	console.log(p.project_uuid);
            });

            msg.hideLoadingWithInfo('Import completed');
        };
        reader.readAsText(file);

    }

    function fail(evt) {
    	msg.hideLoadingWithErr('Aborting import due to errors');
        console.log(evt.target.error.code);
    }

}]);