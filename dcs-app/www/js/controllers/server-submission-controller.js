dcsApp.controller('serverSubmissionController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService',
    function($rootScope, $scope, $routeParams, $location, dcsService, localStore, msg){

    $scope.pageTitle = "Server";
    msg.showLoadingWithInfo('Loading submissions');

    $scope.pageSize = 5;

    $scope.project_uuid = $routeParams.project_uuid;

    localStore.getProjectById($scope.project_uuid)
        .then(function(project) {
            $scope.project_name = project.name;
            $scope.project_uuid = project.project_uuid
            $scope.getSubmissions(0,$scope.pageSize);
        });

    localStore.getSubmissionHeaders($scope.project_uuid)  //changed in localstore fix it
        .then(function(headers) {
            $scope.headers = headers;
            msg.hideAll();
        },function() {
            dcsService.getSubmissionHeaders($scope.project_uuid)
            .then(function(headers) {
            $scope.headers = headers;
            msg.hideAll();
            },function() {
            msg.hideLoadingWithErr('Failed to load columns');
            console.log('errored');
            });
        });
    $scope.getSubmissions = function(start, pageSize) {
        $scope.from = start + 1;

        dcsService.getSubmissions($scope.project_uuid,start,pageSize)
            .then(function(responce) {
                $scope.to = start + responce.data.length;
                $scope.total = responce.total;

                $scope.submissions = responce.data;

                $scope.next = start + pageSize;
                $scope.prev = start - pageSize;

                console.log('responce: ');
                console.log(responce);

                // pages 

                msg.hideAll();
            },function() {
                msg.hideLoadingWithErr('Failed to load submissions');
                console.log('errored');
            });
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

    $scope.do_next = function() {
        console.log('next clicked');
        var allow = $scope.total > $scope.next;
        if (allow)
            $scope.getSubmissions($scope.next, $scope.pageSize);
    }

    $scope.do_prev = function() {
        console.log('prev clicked');
        var allow = $scope.prev >= 0;
        if (allow)
            $scope.getSubmissions($scope.prev, $scope.pageSize);
    }

    $scope.onPageSizeChange = function() {
        msg.showLoadingWithInfo('Loading submissions');
        $scope.pageSize = parseInt($scope.pageSize);
        $scope.getSubmissions(0,$scope.pageSize);
    }
}]);
