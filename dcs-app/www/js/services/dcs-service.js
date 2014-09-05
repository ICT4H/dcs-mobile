dcsApp.service('dcsService', ['$q', '$rootScope','app', function($q, $rootScope, app) {

    this.getProjects = function(start,length) {
        return app.httpRequest("/client/project/?start="+start+"&length="+length);
    };

    this.verifyUser = function() {
        return app.httpRequest("/client/auth/");
    };

    this.getQuestion = function(project_uuid) {
        return app.httpRequest("/client/project/" + project_uuid);
    };

    this.getAllSubmissions = function(project_uuid) {
        return app.httpRequest("/client/project/" + project_uuid + "/submission/");
    };
    
    this.getSubmissions = function(project_uuid,start,length){
        return app.httpRequest('/client/submissions/?uuid='+project_uuid+'&start='+start+'&length='+length);
    };

    this.getSubmission = function(submission) {
        var deferred = $q.defer();
            app.httpRequest("/client/project/" + submission.project_uuid + "/submission/" + submission.submission_uuid).then(function(serverSubmission) {
                serverSubmission.project_uuid = submission.project_uuid;
                serverSubmission.status = submission.status;
                deferred.resolve(serverSubmission);

            },deferred.reject);
        return deferred.promise;
    };

    this.getSubmissionHeaders = function(project_uuid) {
        var deferred = $q.defer();
        app.httpRequest('/client/submission-headers/?uuid='+project_uuid).then(function(response) {
        deferred.resolve(response.data);
        },deferred.reject);

        return deferred.promise;
    };

    this.getSubmissionById = function(project_uuid, submission_uuid) {
        return app.httpRequest("/client/project/" + project_uuid + "/submission/" + submission_uuid);
    };

    this.postSubmission = function(submission) {
        console.log('submit submission: ' + JSON.stringify(submission));
        var deferred = $q.defer();
        var createOrUpdateUrl;
        var isUpdate = angular.isUndefined(submission.submission_uuid) || submission.submission_uuid == "undefined";

        if (isUpdate) {
            createOrUpdateUrl = "/client/project/dummy/submission/";
        } else {
            createOrUpdateUrl = "/client/project/dummy/submission/" + submission.submission_uuid;
        }

        app.httpPostRequest(createOrUpdateUrl, 'form_data=' + submission.xml)
            .then(function(updatedSubmission) {
                submission.status = BOTH;
                submission.submission_uuid = updatedSubmission.submission_uuid;
                submission.version = updatedSubmission.version;

                deferred.resolve(submission);

            },deferred.reject);

        return deferred.promise;
    };

    this.checkSubmissionVersions = function(id_versions) {
        return app.httpPostRequest('/client/project/dummy/submission/check-status', 'id_version_dict=' + JSON.stringify(id_versions));
    };

}]);
