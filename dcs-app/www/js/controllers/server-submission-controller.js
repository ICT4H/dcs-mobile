dcsApp.controller('serverSubmissionController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService', 'localStore', 'messageService',
    function($rootScope, $scope, $routeParams, $location, dcsService, localStore, msg){

    $scope.pageTitle = "Server";
    msg.showLoadingWithInfo('Loading submissions');

    $scope.pageSize = 5;

    $scope.project_id = $routeParams.project_id;

    localStore.getProjectById($scope.project_id)
        .then(function(project) {
            $scope.project_name = project.name;
            $scope.project_uuid = project.project_uuid
            $scope.getSubmissions(0,$scope.pageSize);
        });

    $scope.getSubmissions = function(start, pageSize) {
        $scope.from = start + 1;

        dcsService.getSubmissions($scope.project_uuid,start,pageSize)
            .then(function(responce) {
                $scope.cols = responce.headers;

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
        if (value instanceof Array) {
            var ret = '<table class="show-first-col no-margin-bottom table table-condensed">';
            ret += '<thead><tr>';
            for(k in value[0]) {
                ret += '<th>'+k+'</th>';
            }
            ret += '</tr></thead>';

            for(var i=0; i<value.length; i++) {
                ret += '<tr>';
                for (key in value[i]) {
                    ret += '<td>' + value[i][key] + '</td>';
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
            //TODO this value might need to be sanitised
            uuid = selected_rows[i].cells[0].innerText;

            localStore.getSubmissionMetaByUuid(uuid)
                .then(function(found) {
                    if(found != 1) {
                        downloadSubmission({submission_uuid: uuid,
                                            project_id:$scope.project_id,
                                            project_uuid:$scope.project_uuid});
                    }
                });
        }
    }

    function downloadSubmission(submission) {
        msg.showLoading();
        submission.status = BOTH;

        dcsService.getSubmission(submission)
            .then(localStore.createSubmission)
            .then(function(resp) {
                submission.submission_id = resp.submission_id;
                submission.data = resp.data;
                submission.xml = resp.xml;
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
