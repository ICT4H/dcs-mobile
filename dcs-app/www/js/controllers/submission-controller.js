
dcsApp.service('dataProvider', ['$q', function($q) {

    this.init = function(projectUuid, submissionDao, serverService, isServer) {
        this.takeCachedProject = this.projectUuid && this.projectUuid == projectUuid
        this.projectUuid = projectUuid;
        this.submissionDao = submissionDao;
        this.serverService = serverService;
    };

    this.getSubmission = function(currentIndex, searchStr) {
        if (isNaN(currentIndex)) return $.when();

        if (this.isServer) {

        } else {
            return this.submissionDao.getAllSubmissions(this.projectUuid, currentIndex, 1, searchStr || "").then(function(result) {
                return result.data[0];
            });
        }
    }

    var cachedProject;
    var setProjectInCache = function(project) {
        cachedProject = project;
        return $.when(project);
    }

    this.getProject = function() {
        if (this.takeCachedProject) {
            return $q.when(cachedProject);
        } else {
            return this.submissionDao.getProjectById(this.projectUuid).then(setProjectInCache);
        }
    }
}]);

dcsApp.service('enketoService', ['$location', '$route', 'submissionDao', 'messageService', 'dialogService',
                        function($location, $route, submissionDao, msg, dialogService) {
    var dbSubmission;
    var onEdit = function(submission) {
        submission.submission_id = dbSubmission.submission_id;
        submission.submission_uuid = dbSubmission.submission_uuid;
        submission.version = dbSubmission.version;
        submission.status = "modified";
        submission.project_uuid = dbSubmission.project_uuid;   
        msg.displaySuccess('Updating submission');
        submissionDao.updateSubmission(submission).then(function() {
            $location.url('/submission-list/' + dbSubmission.project_uuid + '?type=all');
        });
    };

    var onNew = function(submission) {
        submission.status = "modified";
        submission.project_uuid = projectUuid;
        submissionDao.createSubmission(submission).then(function() {
            msg.displaySuccess('Saved');
            var goToSubmissionList = function() {
                $location.url('/submission-list/' + projectUuid + '?type=all');
            }
            var reload = function() {
                $route.reload();
            }
            dialogService.confirmBox("Do you want to create another one?", reload, goToSubmissionList);
        }, function(error) {
            console.log(error);
        });
    };

    this.loadEnketo = function(xform, submissionXml, loadedSubmission, currentProjectUuid) {
        var submitCallback = loadedSubmission? onEdit: onNew,
            submitLabel = loadedSubmission? 'Update': 'Save';

        dbSubmission = loadedSubmission;
        projectUuid = currentProjectUuid;

        loadEnketo({
            'buttonLabel': submitLabel,
            'hideButton': submitLabel? false:true,
            'onButtonClick': submitCallback,
            'submissionXml': submissionXml,
            'xform': xform
        });
    };
}]);

dcsApp.service('submissionRelationService', [function() {
    var relationHandler;
    var that = this;

    this.setProjectAndSubmission = function(project, submission) {

        this.project = project;// this should be set first
        this._setSubmission(submission);
        if (this.isParentProject())
            this.parentProject = project;
        delete this.parentProject;
    }

    this._setSubmission = function(submission) {
        this.submission = submission;
        if (this.isParentProject())
            this.parentSubmission = submission;

        if (this.isChildProject()) {
            //TODO fixme when editing child submission, parentSubmission wont hv been loaded.
            relationHandler = new SurveyRelation(this.project, this.parentSubmission? JSON.parse(this.parentSubmission.data): JSON.parse(this.submission.data));
        }
        //TODO commenting as this wont allow to navigate across child submissions
        //delete this.parentSubmission;
    }

    this.isChildProject = function() {
        return this.project.project_type == 'child';
    }

    this.isParentProject = function() {
        return this.project.project_type == 'parent';
    }

    this.getXform = function() {
        if (this.isChildProject())
            return relationHandler.add_note_fields_for_parent_values();
        return this.project.xform;
    }

    this.getModelStr = function() {
        var is_child_and_is_not_edit_of_child = this.isChildProject() && !this.submission;
        if (is_child_and_is_not_edit_of_child)
            return relationHandler.getUpdatedModelStr();
        return this.submission? this.submission.xml : '';
    }

    this.getAddChildrenNavigateUrls =  function(onClick) {
        var is_new_parent_or_is_not_parent = !this.submission || !this.isParentProject()
        if (is_new_parent_or_is_not_parent) return;

        var navigateToUrl = '#/projects/'+this.project.child_ids+
                    '/submissions/new_child?parent_id='+this.project.project_uuid+
                    '&parent_submission_id='+this.parentSubmission.submission_id;
        var navigateUrls = {};
        //TODO remove harcoded action label; use value from child project.
        //TODO loop and create as many add as many children by split by ',' on project.child_ids
        navigateUrls['new_child'] = {
            'label': 'New Child',
            'url': navigateToUrl
        };
        return navigateUrls;
    };
}]);


dcsApp.controller('submissionController',
    ['$scope', '$routeParams', '$location', 'submissionDao','messageService', 'dcsService', 'paginationService',
    'dialogService', 'locationService', 'submissionRelationService', 'enketoService', 'dataProvider',
    function($scope, $routeParams, $location, localStore, msg, dcsService, paginationService,
        dialogService, locationService, submissionRelationService, enketoService, dataProvider){
    
    $scope.showSearchicon = false;
    $scope.project_uuid = $routeParams.project_uuid;
    $scope.server = $routeParams.server == "true"? true:false;

    var searchStr = $scope.searchStr || "";
    var submission_id = $routeParams.submission_id;
    var buttonLabel = submission_id == "null" ?'Save':'Update';
    var index = parseInt($routeParams.currentIndex);

    dataProvider.init($scope.project_uuid, localStore, null);

    dataProvider.getProject().then(function(project) {
        dataProvider.getSubmission(index, searchStr).then(function(submission) {
            submissionRelationService.setProjectAndSubmission(project, submission);
            // TODO Add action to delete the displayed submission
            $scope.navigateUrls = submissionRelationService.getAddChildrenNavigateUrls($location.url);
            enketoService.loadEnketo(
                submissionRelationService.getXform(),
                submissionRelationService.getModelStr(),
                submission,
                $scope.project_uuid);
        });
    });

    $scope.goBack = function() {
        locationService.goBack();
    };
}]);
