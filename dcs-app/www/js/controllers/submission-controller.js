
dcsApp.service('dataProvider', ['$q', function($q) {
/*
Provides abstraction over local store and server service.
*/
    this.init = function(projectUuid, submissionDao, serverService, isServer) {
        this.takeCachedProject = this.projectUuid && this.projectUuid == projectUuid
        this.projectUuid = projectUuid;
        this.submissionDao = submissionDao;
        this.serverService = serverService;
    };

    this.getSubmission = function(currentIndex, searchStr, type) {
        if (isNaN(currentIndex)) return $.when();

        if (this.isServer) {

        } else {
            return this.submissionDao.searchSubmissionsByType(this.projectUuid, type, searchStr, currentIndex, 1).then(function(result) {
                return result;
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
/*
Provides submission create and update using enketo. Uses local store for persistence.
*/
    var dbSubmission, projectUuid;

    this.loadEnketo = function(xform, submissionXml, submissionToEdit, currentProjectUuid) {
        var submitCallback = submissionToEdit? onEdit: onNew,
            submitLabel = submissionToEdit? 'Update': 'Save';

        dbSubmission = submissionToEdit;
        projectUuid = currentProjectUuid;

        loadEnketo({
            'buttonLabel': submitLabel,
            'hideButton': submitLabel? false:true,
            'onButtonClick': submitCallback,
            'submissionXml': submissionXml,
            'xform': xform
        });
    };

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
}]);

dcsApp.service('submissionXformService', [function() {
/*
This service provides the xform html and model string. For Correlated project,
it uses SurveyRelation to provide xform html and model string.
For parent edit/view, url links to create children are provided.

The assumption is for new child submission, parent submission will be accessed first.
This service holds the latest accessed parent data.
*/

    var relationHandler;

    this.setProjectAndSubmission = function(project, submission) {
        //TODO if (!this.project) throw Error
        this.project = project;// project should be set first
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
            // getUpdatedModelStr rename to getModelStrWithParentValues
            return relationHandler.getUpdatedModelStr();
        return this.submission? this.submission.xml : '';
    }

    this.getUrlsToAddChildren =  function(onClick) {
        var is_new_parent_or_is_not_parent = !this.submission || !this.isParentProject()
        if (is_new_parent_or_is_not_parent) return;

        var urlToAddChild = '#/projects/'+this.project.child_ids+
                    '/submissions/new_child?parent_id='+this.project.project_uuid+
                    '&parent_submission_id='+this.parentSubmission.submission_id;
        var urlsToAddChildren = {};
        //TODO remove harcoded action label; use value from child project.
        //TODO loop and create as many add as many children by split by ',' on project.child_ids
        urlsToAddChildren['new_child'] = {
            'label': 'New Child',
            'url': urlToAddChild
        };
        return urlsToAddChildren;
    };
}]);


var Page = function($location, baseUrl, type, currentIndex, totalRecords) {

    this.getTotal = function() {
        return totalRecords;
    }

    this.showPagination = function() {
        //dont show for create submission
        return !isNaN(currentIndex);
    }

    this.getTo = function() {
        return currentIndex + 1;
    }

    this.isFirstPage = function() {
        return currentIndex === 0;
    }

    this.isLastPage = function() {
        return currentIndex + 1 === totalRecords;
    }

    this.onNext = function() {
        $location.url(baseUrl + '?type='+type+'&currentIndex=' + (currentIndex+1));
    }

    this.onPrevious = function() {
        $location.url(baseUrl + '?type='+type+'&currentIndex=' + (currentIndex-1));
    }
}

dcsApp.controller('submissionController',
    ['$scope', '$routeParams', '$location', 'submissionDao','messageService', 'dcsService', 'paginationService',
    'dialogService', 'submissionXformService', 'enketoService', 'dataProvider',
    function($scope, $routeParams, $location, localStore, msg, dcsService, paginationService,
        dialogService, submissionXformService, enketoService, dataProvider){
    
    $scope.showSearchicon = false;
    $scope.project_uuid = $routeParams.project_uuid;
    $scope.server = $routeParams.server == "true"? true:false;

    var searchStr = $scope.searchStr || "";
    var submission_id = $routeParams.submission_id;
    var buttonLabel = submission_id == "null" ?'Save':'Update';
    var currentIndex = parseInt($routeParams.currentIndex);
    var type = $routeParams.type || 'all';
    backHandler.setToSubmissions();

    dataProvider.init($scope.project_uuid, localStore, null);

    dataProvider.getProject().then(function(project) {
        dataProvider.getSubmission(currentIndex, searchStr, type).then(function(result) {
            var submission = result && result.data[0];
            addPagination(type, currentIndex, result && result.total);
            submissionXformService.setProjectAndSubmission(project, submission);
            // TODO Add action to delete the displayed submission
            $scope.urlsToAddChildren = submissionXformService.getUrlsToAddChildren($location.url);
            enketoService.loadEnketo(
                submissionXformService.getXform(),
                submissionXformService.getModelStr(),
                submission,
                $scope.project_uuid);
        });
    });

    var addPagination = function(type, currentIndex, total) {
        var baseUrl = '/projects/'+$scope.project_uuid+'/submissions/'+currentIndex+'/';
        $scope.page = new Page($location, baseUrl, type, currentIndex, total);
    }
}]);
