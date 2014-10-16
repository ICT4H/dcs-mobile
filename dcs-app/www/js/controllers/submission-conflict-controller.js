var submissionConflictController = function($rootScope, $scope, $routeParams, $location, submissionDao, msg, app) {

    $scope.pageTitle = "Submissions";
    $scope.pageSizes = $rootScope.pageSizes;
    $scope.pageSize = $rootScope.pageSize.value;
    $scope.searchFields = {all: 'All'};  
    $scope.displayHeaders = {}; 
    $scope.orderHeaders = []; 
    $scope.showActions = false;
    $scope.Math = window.Math;
    $scope.total = 0;

    $scope.project_uuid = $routeParams.project_uuid;

    var assignSubmissions = function(submissions){
        $scope.total = submissions.length;

        if(submissions.length == 0)
            msg.hideLoadingWithInfo('No local submissions !');
        submissions.forEach(function(submission){
            submission.data = JSON.parse(submission.data);
        });
        $scope.submissions = submissions;
    };

    var ErrorLoadingSubmissions = function(data, error) {
        msg.hideLoadingWithErr('Failed to load Submissions');
    };

    $scope.onNext = function(pageNumber) {
        loadSubmissions(pageNumber);
    };

    $scope.onPrevious = function(pageNumber) {
        loadSubmissions(pageNumber);
    };

    $scope.isLastPage = function() {
        return Math.ceil($scope.total/$scope.pageSize) == $scope.pageNumber + 1;
    };

    $scope.isFirstPage = function() {
        return $scope.pageNumber == 0;
    };

    $scope.isAtLast = function(index) {
        if($scope.isLastPage())
            return index ==  $scope.total % $scope.pageSize - 1 ;
        return index == $scope.pageSize-1;
    }

    $scope.formatSubmission = function(index, submission) {
        var ret = '';
        $scope.listIndex = index;
        angular.forEach($scope.orderHeaders, function(header) {
              if(header == "more") 
                ret += "<td><a href='#conflict-resolver/" + submission.project_uuid + "/" + submission.submission_uuid + "'>Resolve</a></td>";
            else
                ret += "<td>" + submission.data[header] + "</td>";
        });
        return ret;
    };

    $scope.onLoad = function() {
        submissionDao.getProjectById($scope.project_uuid)
            .then(function(project) {
                $scope.project_name = project.name;
                $scope.project_uuid = project.project_uuid;
                $scope.headers = JSON.parse(project.headers);
                $scope.orderHeaders = app.extractHeaders($scope.headers);
                angular.extend($scope.searchFields, app.getSearchFields($scope.headers));
                loadSubmissions(0);
        });
    };
    $scope.onLoad();

    var loadSubmissions = function(pageNumber) {
        $scope.pageNumber = pageNumber;
        msg.showLoadingWithInfo(resourceBundle.loading_submissions);
        submissionDao.getSubmissionsByStatusPagination($scope.project_uuid, "conflict", pageNumber * $scope.pageSize, $scope.pageSize)
        .then(assignSubmissions, ErrorLoadingSubmissions);
        msg.hideAll();
    };

};
dcsApp.controller('submissionConflictController', ['$rootScope', '$scope', '$routeParams', '$location', 'submissionDao', 'messageService', 'app', submissionConflictController]);