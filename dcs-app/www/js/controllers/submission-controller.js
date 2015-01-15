dcsApp.controller('submissionController', ['$scope', '$routeParams', '$location', 'submissionDao', 'messageService', 'dcsService', 'app', 'paginationService', 'dialogService', function($scope, $routeParams, $location, localStore, msg, dcsService, app, paginationService, dialogService){
    
    $scope.pagination = paginationService.pagination;
    var submission_id = $routeParams.submission_id;
    var buttonLabel = submission_id == "null" ?'Save':'Update';

    var onEdit = function(submission) {
        submission.is_modified = true;
        submission.submission_id = $scope.submission_id;
        localStore.updateSubmission(submission)
        .then(function() {
            msg.displaySuccess('Updated');
            $location.path("/submission-list/" + $routeParams.project_uuid);
        }, function(error) {
            console.log(error);
        });
    };

    var onNew = function(submission, initializeForm) {
        submission.status = "modified";
        submission.project_uuid = $scope.project_uuid;
        localStore.createSubmission(submission).then(function() {
            msg.displaySuccess('Saved');  

            dialogService.confirmBox("Do you want to create another one?", initializeForm, function() {
                $location.path("/submission-list/" + $scope.project_uuid);
            });
        }, function(error) {
            console.log(error);
        });
    }; 

    var loadEnketoWith = function(project_uuid, submissionXml, buttonCallback, buttonLabel) {
        localStore.getProjectById(project_uuid).then(function(project) {
            var options = {
                'submissionXml': submissionXml,
                'buttonLabel': buttonLabel,
                'hideButton': buttonLabel? false:true,
                'onButtonClick': buttonCallback
            };
            loadEnketo(project.xform, options);
        });
    };  

    $scope.submissions = [];

    var getSubmissionXml = function(offset, limit) {
        msg.showLoadingWithInfo("Loading");
        if($scope.server)
            return dcsService.getSubmissions($scope.project_uuid, offset, limit);
        else
            return localStore.getSubmissionsByProjectId($scope.project_uuid, offset, limit);
    };

    var getPaginatedSubmission = function(currentIndex) {
        
        var actualIndex = currentIndex%$scope.limit;
        if($scope.offset == getOffset(currentIndex, $scope.limit))
            loadEnketoWith($scope.project_uuid, $scope.submissions[actualIndex].xml, onEdit, "Update");
        else {
            getSubmissionXml(getOffset(currentIndex, $scope.limit), $scope.limit).then(function(result) {
                msg.hideAll();
                $scope.submissions = result.data;
                $scope.offset = getOffset(currentIndex, $scope.limit);
                loadEnketoWith($scope.project_uuid, $scope.submissions[actualIndex].xml, onEdit, "Update");
            });
        }
    };

    var getOffset = function(index, limit) {
        return window.Math.floor(index/limit) * limit;
    };

    var onLoad = function() {
        $scope.project_uuid = $routeParams.project_uuid;

        if($routeParams.submission_id == "new")
            loadEnketoWith($scope.project_uuid, "", onNew, "Save");
        else {
            var index = parseInt($routeParams.currentIndex);
            $scope.submission_id = $routeParams.submission_id;
            $scope.isListing = $routeParams.isListing == "true"? true:false;
            $scope.server = $routeParams.server == "true"? true:false;
            $scope.limit = parseInt($routeParams.limit);
            $scope.totalElement = parseInt($routeParams.totalElement);
            $scope.offset = getOffset(index, $scope.limit);

            getSubmissionXml($scope.offset, $scope.limit).then(function(result) {
                msg.hideAll();
                $scope.submissions = result.data;
                $scope.pagination.init(1, $scope.totalElement, getPaginatedSubmission, index);
            });
        }        
    };

    onLoad();
}]);
