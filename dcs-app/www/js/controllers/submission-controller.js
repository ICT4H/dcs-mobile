dcsApp.controller('submissionController', ['$scope', '$routeParams', '$location', 'submissionDao', 'messageService', 'dcsService', 'paginationService', 'dialogService', 'locationService', function($scope, $routeParams, $location, localStore, msg, dcsService, paginationService, dialogService, locationService){
    
    $scope.pagination = paginationService.pagination;
    $scope.showSearchicon = false;
    var submission_id = $routeParams.submission_id;
    var buttonLabel = submission_id == "null" ?'Save':'Update';
    var relationHandler;

    var onEdit = function(submission) {
        localStore.getSubmissionById($scope.submission_id).then(function(oldSubmission) {
            submission.submission_uuid = oldSubmission.submission_uuid;
            submission.version = oldSubmission.version;
            submission.submission_id = $scope.submission_id;
            submission.status = "modified";
            submission.project_uuid = oldSubmission.project_uuid;   

            localStore.updateSubmission(submission)
            .then(function() {
                msg.displaySuccess('Updated');
                $location.url('/submission-list/' + $scope.project_uuid + '?type=all');
                console.log(error);
            });        
        });
    };

    var onNew = function(submission, initializeForm) {
        submission.status = "modified";
        submission.project_uuid = $scope.project_uuid;
        localStore.createSubmission(submission).then(function() {
            msg.displaySuccess('Saved');  
            var goToSubmissionList = function() {
                $location.url('/submission-list/' + $scope.project_uuid + '?type=all');
            }
            var reload = function() {
                $route.reload();
            }
            dialogService.confirmBox("Do you want to create another one?", reload, goToSubmissionList);
        }, function(error) {
            console.log(error);
        });
    }; 

    var loadEnketoWith = function(project_uuid, submissionXml, buttonCallback, buttonLabel) {
        localStore.getProjectById(project_uuid).then(function(project) {
            var options = {
                'buttonLabel': buttonLabel,
                'hideButton': buttonLabel? false:true,
                'onButtonClick': buttonCallback,
                'submissionXml': submissionXml,
                'xform': project.xform
            };
            if (project.project_type == 'parent') {
                initChildActions(project);
            } else if (project.project_type == 'child' && relationHandler != undefined) {
                //TODO correct the condition and make the parent_fields readonly during edit
                options.xform = relationHandler.add_note_fields_for_parent_values();
            }
            loadEnketo(options);
        });
    };  

    var initChildActions =  function(project) {
        $scope.actions = {};
        //TODO remove harcoded action label; use value from child project
        //TODO loop and create as many add as many children by split by ',' on project.child_ids
        $scope.actions['new_child'] = {'onClick': function() {
            $location.url('/projects/'+project.child_ids+'/submissions/new_child?parent_id='+$routeParams.project_uuid+'&parent_submission_id='+$routeParams.submission_id);
        }, 'label': 'New Child' };
    };

    $scope.submissions = [];

    var getSubmissionXml = function(offset, limit) {
        msg.showLoadingWithInfo("Loading");
        if($scope.server)
            return dcsService.getSubmissions($scope.project_uuid, offset, limit);
        else
            if($scope.type == "all")
                return localStore.getAllSubmissions($scope.project_uuid, offset, limit, $scope.searchStr || "");
            if($scope.type == "conflicted")
                return localStore.getConflictSubmissions($scope.project_uuid, offset, limit, $scope.searchStr || "");
            return localStore.getUnsubmittedSubmissions($scope.project_uuid, offset, limit, $scope.searchStr || "");
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
        else if ($routeParams.submission_id == 'new_child') {
            initChildSubmission($routeParams);
        } else {
            var index = parseInt($routeParams.currentIndex);
            $scope.submission_id = $routeParams.submission_id;
            $scope.isListing = $routeParams.isListing == "true"? true:false;
            $scope.server = $routeParams.server == "true"? true:false;
            $scope.limit = parseInt($routeParams.limit);
            $scope.totalElement = parseInt($routeParams.totalElement);
            $scope.searchStr = $routeParams.searchStr;
            $scope.offset = getOffset(index, $scope.limit);
            $scope.type = $routeParams.type

            getSubmissionXml($scope.offset, $scope.limit).then(function(result) {
                msg.hideAll();
                $scope.submissions = result.data;
                $scope.pagination.init(1, $scope.totalElement, getPaginatedSubmission, index);
            });
        }        
    };

    var initChildSubmission = function($routeParams) {
        localStore.getProjectById($routeParams.project_uuid).then(function(project) {
            localStore.getSubmissionById($routeParams.parent_submission_id).then(function(result) {
                var parent_submission = JSON.parse(result.data);
                relationHandler = new SurveyRelation(project, parent_submission);
                var edit_model_str = relationHandler.getUpdatedModelStr();

                loadEnketoWith($routeParams.project_uuid, edit_model_str, onNew, "Save");
            });
        });
    }

    $scope.goBack = function() {
        locationService.goBack();
    };

    onLoad();
}]);
