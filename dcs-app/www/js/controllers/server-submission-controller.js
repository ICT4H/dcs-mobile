var serverSubmissionController = function($q, $rootScope, app, $scope, $routeParams, $location, dcsService, localStore, msg, paginationService){

    $scope.pagination = paginationService.pagination;
    $scope.actions = {};

    msg.showLoadingWithInfo('Loading submissions');
    $scope.project_uuid = $routeParams.project_uuid;
    var selectedSubmission = [];

    var assignSubmissions = function(submissions){
        msg.hideAll();
        $scope.pagination.totalElement = submissions.total;
        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No server submissions !');
        $scope.submissions = submissions.data;
    };

    var ErrorLoadingSubmissions = function(data, error) {
        msg.hideLoadingWithErr('Failed to load Submissions');
    };

    var loadSubmissions = function() {
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        dcsService.getSubmissions($scope.project_uuid, $scope.pagination.pageNumber * $scope.pagination.pageSize, $scope.pagination.pageSize)
            .then(assignSubmissions, ErrorLoadingSubmissions);
    };

    $scope.isSubmissionDisplayable = function(submissionData) {
        return app.isSubmissionDisplayable(submissionData, $scope.searchStr, $scope.selectedField);
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
    };

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
    };

    var downloadSubmission = function(submission) {
        submission.status = BOTH;
        return dcsService.getSubmission(submission)
            .then(dcsService.getSubmissionMedia)
            .then(localStore.createSubmission);      
    };

    var onDownload = function() {
        msg.showLoading();
        var localSubmissionPromises = [];

        selectedSubmission.forEach(function(submission_uuid) {
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

    var initActions =  function() {
        $scope.actions['download'] = {'onClick': onDownload, 'label': 'Download'};
    };

    var onLoad = function() {
        $scope.pagination.init($rootScope.pageSize.value, 0, loadSubmissions);
        var project = $rootScope.currentProject;
        $scope.project_name = project.name;
        $scope.project_uuid = project.project_uuid;
        $scope.headers = JSON.parse(project.headers);
        $scope.orderHeaders = app.extractHeaders($scope.headers);
        initActions();
        loadSubmissions();
    };

    onLoad();
    
    $scope.onSubmissionSelect = function(submissionRow, submission) {
        submissionRow.selected = !submissionRow.selected;
        app.flipArrayElement(selectedSubmission, submission.submission_id);
    };
};

dcsApp.controller('serverSubmissionController', ['$q', '$rootScope', 'app', '$scope', '$routeParams', '$location', 'dcsService', 'submissionDao', 'messageService', 'paginationService', serverSubmissionController]);

