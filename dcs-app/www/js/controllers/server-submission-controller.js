dcsApp.controller('serverSubmissionController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService',
    function($rootScope, $scope, $routeParams, $location, dcsService, localStore, msg){

    $scope.pageTitle = "Server";
    msg.showLoadingWithInfo('Loading submissions');

    $scope.pageSizes = [5, 10, 15, 20];
    $scope.project_uuid = $routeParams.project_uuid;

    var assignSubmissions = function(submissions){
        msg.hideAll();
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No server submissions !');
        // submissions.data.forEach(function(submission){
        //     submission = JSON.parse(submission);
        // });
        $scope.submissions = submissions.data;
    };

    $scope.isSubmissionDisplayable = function(submission) {
        if(!$scope.searchStr || !$scope.selectedField)
            return true;
        
        if(submission.data[$scope.selectedField].indexOf($scope.searchStr) >= 0)
            return true;
        return false;
    };

    var ErrorLoadingSubmissions = function(data,error) {
        msg.hideLoadingWithErr(error+' Failed to load Submissions');
    };
    var loadSubmissions = function(pageNumber) {
        $scope.pageNumber = pageNumber;
        localStore.getCountOfSubmissions($scope.project_uuid).then(function(result){
            $scope.total = result.total;
        });
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        dcsService.getSubmissions($scope.project_uuid, pageNumber * $scope.pageSize.value, $scope.pageSize.value)
        .then(assignSubmissions, ErrorLoadingSubmissions);
    };

    $scope.onLoad = function() {
        $scope.pageSize = {'value':$scope.pageSizes[0]};
        localStore.getProjectById($scope.project_uuid)
            .then(function(project) {
                $scope.project_name = project.name;
                $scope.project_uuid = project.project_uuid;
                $scope.headers = JSON.parse(project.headers);
                loadSubmissions(0);
        });
    };
    $scope.onLoad();

    $scope.onNext = function(pageNumber) {
        if(pageNumber * $scope.pageSize.value < $scope.total)
            loadSubmissions(pageNumber);
    };

   $scope.onPrevious = function(pageNumber) {
        if (pageNumber >= 0) 
            loadSubmissions(pageNumber);
    };

    $scope.onPageSizeChange = function() {
        loadSubmissions(0);
    };

    $scope.formatSubmission = function(value) {
        if (typeof value == "object" && value != null) {
            var ret = '<table class="bg-transparent show-first-col no-margin-bottom table table-condensed">';
            ret += '<thead><tr>';
            
            for(k in value[0] || value) {
                ret += '<th>'+k+'</th>';
            }
            ret += '</tr></thead>';

            // multiple repeat data
            if (value instanceof Array) {
                for(var i in value) {
                    ret += '<tr>';
                    for (key in value[i]) {
                        ret += '<td>' + value[i][key] + '</td>';
                    }
                    ret += '</tr>';
                }
            // single repeat data
            } else {
                ret += '<tr>';
                for(var i in value) {
                    ret += '<td>' + value[i] + '</td>';
                }
                ret += '</tr>';
            }
            return ret += '</table>';
        }

        return value;
    }

    $scope.download = function() {
        console.log('download clicked');
        var selected_rows = document.getElementById('server-submissions').getElementsByClassName('success');
        var uuid;
        for (var i=0; i<selected_rows.length; i++) {
            uuid = selected_rows[i].cells[0].innerText;
            localStore.submissionNotExists(uuid)
                .then(function(result) {
                    if(result) {
                        downloadSubmission({submission_uuid: uuid,
                                            project_uuid:$scope.project_uuid});
                    }
                    // TODO what to be done for existing submissions.
                });
        }
    }

    var downloadSubmission = function(submission) {
        msg.showLoading();
        submission.status = BOTH;
        dcsService.getSubmission(submission)
            .then(localStore.createSubmission)
            .then(function(resp) {
                msg.hideLoadingWithInfo("Submission downloaded.");
            }, function(error) {
                msg.hideLoadingWithErr('Unable to download submission.');
            });
    }
}]);
