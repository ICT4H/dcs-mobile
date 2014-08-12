dcsApp.controller('submissionConflictController', ['$rootScope', '$scope', '$q', '$routeParams', '$location', 'dcsService', 'localStore', 'messageService',
    function($rootScope, $scope, $q, $routeParams, $location, dcsService, localStore, msg){

    msg.showLoadingWithInfo('Loading submissions');

    $scope.selectLocal = false;

    $scope.takeLocal = function(row) {
        console.log('take local value');
        $scope.selectLocal = true;
    }

    $scope.takeServer = function(row) {
        console.log('take server value');
        $scope.selectLocal = false;
    }

    $scope.isArray = function(value) {
        return (value instanceof Array);
    }

    $scope.save = function() {
        if ($scope.selectLocal) {
            localStore.updateSubmissionVersionAndStatus($scope.localSubmission.submission_id, $scope.serverSubmission.version, BOTH);
            localStore.updateSubmissionCreatedDate($scope.localSubmission.submission_id, $scope.serverSubmission.created);
            msg.displaySuccess('Local changes taken');
        } else {
            localStore.updateSubmission($scope.localSubmission.submission_id, $scope.serverSubmission);

            msg.displaySuccess('Server changes taken');
        }
    }

    localStore.getProjectById($routeParams.project_uuid)
        .then(function(project) {
            $scope.project_name = project.name;
            $scope.headers = JSON.parse(project.headers);
            delete $scope.headers.ds_name;
            delete $scope.headers.date;

          localStore.getSubmissionById($routeParams.submission_id)
             .then(function(localSubmission) {

                $scope.localSubmission = localSubmission;
                delete $scope.localSubmission.data["meta"];
                dcsService.getSubmissionById(project.project_uuid, localSubmission.submission_uuid)
                   .then(function(serverSubmission) {
                        $scope.serverSubmission   = serverSubmission;
                        $scope.serverSubmissionData = JSON.parse(serverSubmission.data);
                        delete $scope.serverSubmissionData["meta"];

                        fillPaddingData($scope.localSubmission.data, $scope.serverSubmissionData);
                        msg.hideAll();
                   });
             });
    });

    var fillRepeat = function(repeatObjects, n) {
        var keys = Object.keys(repeatObjects[0]);
        for (var i=0; i<n; i++) {
            var d = {};
            for (var j=0; j<keys.length; j++) {
                d[keys[j]] = '-';
            }
            repeatObjects.push(d);
        }
    }

    var fillPaddingData = function(local, server) {

        for (key in server) {
            //TODO check this is available in mobile
            if (server[key] instanceof Array) {
                var serverRepeatCount = server[key].length;
                var localRepeatCount = local[key].length;
                if (serverRepeatCount == undefined || localRepeatCount == undefined)
                    continue;

                if (serverRepeatCount > localRepeatCount) {
                    fillRepeat(local[key], serverRepeatCount-localRepeatCount);
                } else {
                    fillRepeat(server[key], localRepeatCount-serverRepeatCount);
                }
            }
            //TODO skip inside repeats also needs to be handled for null. Try to fix this at server
            if (local[key] === null) {
                local[key] = '-';
            }
            if (server[key] === null) {
                server[key] = '-';
            }
        }

    }

}]);