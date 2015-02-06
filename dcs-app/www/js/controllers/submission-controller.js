var SubmissionDataProvider = function(projectUuid, localStore, serverService) {

    this.getSubmission = function(currentIndex, isServer, searchStr) {
        if (isServer) {

        } else {
            return localStore.getAllSubmissions(projectUuid, currentIndex, 1, searchStr || "").then(function(result) {
                return result.data[0];
            })
        }
    }

    this.getProject = function(projectUuid, isServer) {
        if (isServer) {

        } else {
            return localStore.getProjectById(projectUuid);
        }
    }
}
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

dcsApp.controller('submissionController',
    ['$scope', '$routeParams', '$location', 'submissionDao','messageService', 'dcsService', 'paginationService',
    'dialogService', 'locationService', 'enketoService',
    function($scope, $routeParams, $location, localStore, msg, dcsService, paginationService,
        dialogService, locationService, enketoService){
    
    $scope.showSearchicon = false;
    $scope.project_uuid = $routeParams.project_uuid;
    $scope.server = $routeParams.server == "true"? true:false;

    var submission_id = $routeParams.submission_id;
    var buttonLabel = submission_id == "null" ?'Save':'Update';
    var index = parseInt($routeParams.currentIndex);
    var dataProvider = new SubmissionDataProvider($scope.project_uuid, localStore, null);        

/* 



[edit_child, edit, new_child, new].each as handler
if handler.isApplicable()
 handler.loadView()

base.init_handlers(rootParams) {
    this.submissionId = rootParams.submission_id
    this.project = rootParams.project;
}

edit_child.isApplicable() {
    return this.project.is_child_project and this.submissionId;
}
edit_child.initViewOptions() {
    this.options = {'buttonLabel': buttonLabel,...
     'onButtonClick' = Base.onUpdate
    }
}
base.loadView() {
    this.initViewOptions();
    dataProvider.getSubmission().then(function(submission) {
        enketoService.loadEnketo(options);
    })
}

Base.onUpdate() {
    localStore.updateSubmission
}
Base.onSave() {
    localStore.createSubmission
}
*/

    dataProvider.getSubmission(index, $scope.server).then(function(submission) {
        msg.hideAll();
        $scope.submission = submission;
        dataProvider.getProject($scope.project_uuid, false).then(function(project) {
            enketoService.loadEnketo(project.xform, submission.xml, onEdit, "Update");
        })
    });

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
