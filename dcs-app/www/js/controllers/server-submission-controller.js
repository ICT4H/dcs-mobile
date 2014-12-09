var serverSubmissionController = function($q, $rootScope, app, $scope, $routeParams, $location, dcsService, localStore, msg, contextService){

    $scope.pagination = contextService.pagination;
    msg.showLoadingWithInfo('Loading submissions');
    $scope.displayHeaders = {}; 
    $scope.orderHeaders = []; 
    $scope.searchFields = {all: 'All'}; 
    $scope.showActions = false;
    $scope.project_uuid = $routeParams.project_uuid;
    var selected = [];

    var assignSubmissions = function(submissions){
        msg.hideAll();
        $scope.pagination.totalElement = submissions.total;
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No server submissions !');
        $scope.submissions = submissions.data;
    };

    $scope.isSubmissionDisplayable = function(submission) {
        if(!$scope.searchStr || !$scope.selectedField)
            return true;
        
        if(submission.data[$scope.selectedField].indexOf($scope.searchStr) >= 0)
            return true;
        return false;
    };

    var ErrorLoadingSubmissions = function(data, error) {
        msg.hideLoadingWithErr('Failed to load Submissions');
    };

    var loadSubmissions = function() {
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        dcsService.getSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
            .then(assignSubmissions, ErrorLoadingSubmissions);
    };

    $scope.onLoad = function() {
        $scope.pagination.init($rootScope.pageSize.value, 0, loadSubmissions);
        var project = $rootScope.currentProject;
        $scope.project_name = project.name;
        $scope.project_uuid = project.project_uuid;
        $scope.headers = JSON.parse(project.headers);
        $scope.orderHeaders = app.extractHeaders($scope.headers);
        angular.extend($scope.searchFields, app.getSearchFields($scope.headers));
        loadSubmissions();
    };
    $scope.onLoad();

    $scope.isSubmissionDisplayable = function(submissionData) {
        return app.isSubmissionDisplayable(submissionData, $scope.searchStr, $scope.selectedField);
    }

    $scope.formatSubmission = function(submission) {
        var ret = '';
        angular.forEach($scope.orderHeaders, function(header) {
              if(header == "more") 
                ret += "<td><a class='fa fa-lg fa-external-link' href='#project/" + $scope.project_uuid + "/submission/" + submission.id[0] + "?server=true' style='font-weight: bolder;'></a></td>";
            else
                ret += "<td>" + submission[header] + "</td>";
        });
        return ret;
    };

    $scope.download = function() {
        msg.showLoading();
        var localSubmissionPromises = [];

        selected.forEach(function(submission_uuid) {
            // adding to array needs to be sync.
            localSubmissionPromises.push(loadLocalSubmissionUuid(submission_uuid));
        });

        console.log('localSubmissionPromises.length: ' + localSubmissionPromises.length);

        downloadNonLocalSubmissions(localSubmissionPromises)
            .then(function(submissionDownloaders) {

                $q.all(submissionDownloaders)
                    .then(function(results) {
                        msg.hideLoadingWithInfo("Submission downloaded.");
                    }, function(e) {
                        msg.hideLoadingWithErr('Unable to download submission.');
                    });
            });
    };

    function loadLocalSubmissionUuid(submission_uuid) {
        var deferred = $q.defer();

        localStore.getsubmissionUuidByUuid(submission_uuid)
            .then(function(result) {
                console.log('getsubmissionUuidByUuid uuid: ' + submission_uuid + '; submission found: ' + result.length);
                if (result.length == 0)
                    deferred.resolve(submission_uuid);
                else
                    deferred.resolve();
            }, deferred.reject);

        return deferred.promise;
    }

    function downloadNonLocalSubmissions(localSubmissionPromises) {
        var deferred = $q.defer();
        var submissionDownloaders = [];

        $q.all(localSubmissionPromises)
            .then(function(results) {
                results.forEach(function(nonLocalSubmissionUuid) {
                    console.log('nonLocalSubmissionUuid: ' + nonLocalSubmissionUuid);
                    if (nonLocalSubmissionUuid) {
                        submissionDownloaders.push(
                            downloadSubmission({submission_uuid: nonLocalSubmissionUuid,
                                                project_uuid:$scope.project_uuid}));
                    }
                });
                deferred.resolve(submissionDownloaders);

            }, function(e) {
                console.log('Error during submission download: ' + e);
            });
        return deferred.promise;
    }

    $scope.update_selected_submissions = function(submissionRow, submission) {
        submissionRow.selected = !submissionRow.selected;
        app.flipArrayElement(selected, submission.id[0]);
        $scope.showActions = (selected.length >= 1);
    };

    var downloadSubmission = function(submission) {
        submission.status = BOTH;
        return dcsService.getSubmission(submission)
            .then(dcsService.getSubmissionMedia)
            .then(localStore.createSubmission);
            
    }
};

dcsApp.controller('serverSubmissionController', ['$q', '$rootScope', 'app', '$scope', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'contextService', serverSubmissionController]);

