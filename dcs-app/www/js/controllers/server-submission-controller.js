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
        // 25 to 30 of 50
        $scope.from = start + 1;

        $rootScope.httpRequest('/client/submissions/?uuid='+$scope.project_uuid+'&start='+start+'&length='+pageSize)
            .then(function(responce) {
                //var responce = resp;
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

    $scope.download = function() {
        console.log('download clicked');
        var selected_rows = document.getElementById('server-submissions').getElementsByClassName('success');

        for (var i=0; i<selected_rows.length; i++) {

            downloadSubmission({submission_uuid: selected_rows[i].cells[0].innerText,
                                project_id:$scope.project_id,
                                project_uuid:$scope.project_uuid
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

    function isBigEnough(element) {
      return element >= 10;
    }

    var filtered = [12, 5, 8, 130, 44].filter(isBigEnough);


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

var resp = {"search_count": 51, "length": 5, "total": 51, "data": [["49d65204080a11e493f1001c42af7554", "Tester Pune", "Jul. 10, 2014, 08:15 AM", "10"], ["49f47da6080a11e493f1001c42af7554", "Tester Pune", "Jul. 10, 2014, 08:15 AM", "11"], ["4a03c75c080a11e493f1001c42af7554", "Tester Pune", "Jul. 10, 2014, 08:15 AM", "12"], ["4a133246080a11e493f1001c42af7554", "Tester Pune", "Jul. 10, 2014, 08:15 AM", "13"], ["4a2248c6080a11e493f1001c42af7554", "Tester Pune", "Jul. 10, 2014, 08:15 AM", "14"]], "start": 0}
