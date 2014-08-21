dcsApp.controller('manageColumnsController', ['$rootScope', '$scope', '$routeParams', '$location', 'store', 'messageService',
    function($rootScope, $scope, $routeParams, $location, localStore, msg){

    $scope.pageTitle = $rootScope.resourceBundle.manage_columns_page_title;
    $scope.project_uuid = $routeParams.project_uuid;
    var selected_columns_map = {};

    msg.showLoadingWithInfo('Loading columns');

    localStore.getProjectById($scope.project_uuid)
        .then(function(project) {
            $scope.project_name = project.name;
            $scope.project_uuid = project.project_uuid
            showSubmissionHeaders();
        });
    var showSubmissionHeaders = function() {
        localStore.getLocalSubmissionHeaders($scope.project_uuid)
        .then(function(result) {
            $scope.headers = result.headers;
            msg.hideAll();
        },function() {
            localStore.getSubmissionHeaders($scope.project_uuid)
            .then(function(headers) {
                console.log(headers);
            $scope.headers = headers;
            msg.hideAll();
            },function() {
            msg.hideLoadingWithErr('Failed to load columns');
            console.log('errored');
            });
        });
    };

    $scope.updateSelectedList = function(submissionRow) {
        submissionRow.selected = !submissionRow.selected;
        console.log(submissionRow);
        var selected = selected_columns_map;
        submission_column = submissionRow.val;
        if (selected[submissionRow.key]) {
            delete selected[submissionRow.key];
        }
        else {
            selected[submissionRow.key] = submission_column;
        }
    };


    $scope.updateSubmissionViewColumns = function() {
        localStore.setSubmissionHeaders($scope.project_uuid,selected_columns_map)
        .then(function() {
            console.log('set submission header');
            $location.path('/server-submissions/'+ $scope.project_id);
        },function() {
            console.log('unable to update submission header');
        });
    };
}]);
    