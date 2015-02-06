
dcsApp.service('dataProvider', ['$q', function($q) {

    this.init = function(projectUuid, localStore, serverService, isServer) {
        this.takeCachedProject = this.projectUuid && this.projectUuid == projectUuid
        this.projectUuid = projectUuid;
        this.localStore = localStore;
        this.serverService = serverService;
    };

    this.getSubmission = function(currentIndex, searchStr) {
        if (this.isServer) {

        } else {
            return this.localStore.getAllSubmissions(this.projectUuid, currentIndex, 1, searchStr || "").then(function(result) {
                return result.data[0];
            })
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
            return this.localStore.getProjectById(this.projectUuid).then(setProjectInCache);
        }
    }
}]);

var EnketoService = function() {
    this.loadEnketo = function(xform, submissionXml, submitCallback, submitLabel) {
        loadEnketo({
            'buttonLabel': submitLabel,
            'hideButton': submitLabel? false:true,
            'onButtonClick': submitCallback,
            'submissionXml': submissionXml,
            'xform': xform
        });
    };
};


dcsApp.service('enketoService', [EnketoService]);

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

        if (this.isChildProject())
            relationHandler = new SurveyRelation(this.project, JSON.parse(this.parentSubmission.data));
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
        if (this.isChildProject())
            return relationHandler.getUpdatedModelStr();
        return this.submission.xml;
    }

    this.getNewChildrenActionItems = function() {
        if (this.project.project_type == 'child')
            return {'bla': 'bla'};
        return;
    }
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
    var index = parseInt($routeParams.currentIndex) || 0;

    dataProvider.init($scope.project_uuid, localStore, null);

    dataProvider.getProject().then(function(project) {
        dataProvider.getSubmission(index, searchStr).then(function(submission) {
            submissionRelationService.setProjectAndSubmission(project, submission);
            $scope.submission = submission;
            initChildActions(project);
            enketoService.loadEnketo(
                submissionRelationService.getXform(),
                submissionRelationService.getModelStr(),
                onEdit,
                "Update");
        });
    });

    var initChildActions =  function(project) {
        if (project.project_type != 'parent')
            return;

        $scope.actions = {};
        //TODO remove harcoded action label; use value from child project
        //TODO loop and create as many add as many children by split by ',' on project.child_ids
        $scope.actions['new_child'] = {'onClick': function() {
            $location.url('/projects/'+project.child_ids+'/submissions/new_child?parent_id='+$routeParams.project_uuid+'&parent_submission_id='+$routeParams.submission_id);
        }, 'label': 'New Child' };
    };

    var onEdit = function(submission) {
        var oldSubmission = $scope.submission;
        submission.submission_id = oldSubmission.submission_id;
        submission.submission_uuid = oldSubmission.submission_uuid;
        submission.version = oldSubmission.version;
        submission.status = "modified";
        submission.project_uuid = oldSubmission.project_uuid;   
        console.log(': ' + JSON.stringify(submission));
        localStore.updateSubmission(submission).then(function() {
            msg.displaySuccess('Updated');
            $location.url('/submission-list/' + $scope.project_uuid + '?type=all');
        });
    };

 

    $scope.goBack = function() {
        locationService.goBack();
    };
}]);
