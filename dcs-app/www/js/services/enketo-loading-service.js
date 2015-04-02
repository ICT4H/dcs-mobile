dcsApp.service('enketoService', ['$location', '$route', 'app', 'contextService' ,'submissionDao', 'messageService', 'dialogService',
                        function($location, $route, app, contextService, submissionDao, msg, dialogService) {
/*
Provides submission create and update using enketo. Uses local store for persistence.
*/
    var dbSubmission, projectUuid, isNew;

    this.loadEnketo = function(project, submissionToEdit) {

        projectUuid = project.project_uuid;
        dbSubmission = submissionToEdit;
        isNew = submissionToEdit? false: true;

        var options = {
            'buttonLabel': isNew? 'Save': 'Update',
            'hideButton': contextService.selectParentFlow,
            'onButtonClick': submissionToEdit? onEdit: onNew,
            'submissionXml': contextService.getModelStr(),
            'xform': contextService.getXform()
        };
        if(isEmulator) {
            loadEnketo(options);
            return;
        } else if (isNew) {
            fileSystem.changeToTempAndClear(app.user.name).then(function() {
                loadEnketo(options);
            });
        } else {
            fileSystem.setWorkingDir(app.user.name, projectUuid + '/' + dbSubmission.submission_id).then(function() {
                loadEnketo(options);
            });
        }
    };

    var onError = function(){
        msg.hideLoadingWithErr(resourceBundle.failed_to_save);
    }

    var onEdit = function(submission) {
        submission.submission_id = dbSubmission.submission_id;
        submission.submission_uuid = dbSubmission.submission_uuid;
        submission.version = dbSubmission.version;
        submission.status = "modified";
        submission.project_uuid = dbSubmission.project_uuid;   
        msg.displaySuccess('Updating submission');
        submissionDao.updateSubmission(submission).then(function() {
            $location.url('/submission-list/' + dbSubmission.project_uuid + '?type=all');
        }, onError);
    };

    var onNew = function(submission) {
        submission.status = "modified";
        submission.project_uuid = projectUuid;
        submissionDao.createSubmission(submission).then(function() {
            _moveRecentTempFiles();
            msg.displaySuccess('Saved');
            var goToLocalProjects = function() {
                $location.url('/local-project-list');
            }
            var reload = function() {
                $route.reload();
            }
            dialogService.confirmBox("Do you want to create another one?", reload, goToLocalProjects);
        }, onError);
    };

    var _moveRecentTempFiles = function() {
        return submissionDao.getRecentlyCreateSubmissionId().then(function(result) {
            var recentlyCreatedSubmissionId = result[0].rowid;
            return _moveMediaFiles(recentlyCreatedSubmissionId)
        })
    }

    var _moveMediaFiles = function(submissionId) {
        console.log('in _moveMediaFiles');
        var partialPath = projectUuid + '/' + submissionId;
        fileSystem.moveTempFilesToFolder(app.user.name, partialPath);
    }


}]);
