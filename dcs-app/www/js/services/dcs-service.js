dcsApp.service('dcsService', ['$q', '$rootScope', function($q, $rootScope) {

    this.getQuestionnaires = function() {
        var deferred = $q.defer();
            $rootScope.httpRequest("/client/project/")
            .then(function(projects) {
                console.log('all projects: ' + JSON.stringify(projects));
                deferred.resolve(projects);
                },deferred.reject);
        return deferred.promise;
    };

    this.getQuestion = function(project_uuid) {
        var deferred = $q.defer();
            $rootScope.httpRequest("/client/project/" + project_uuid).then(function(project) {
                console.log('project: ' + JSON.stringify(project));
                deferred.resolve(project);
              },deferred.reject);
        return deferred.promise;
    };

    this.getAllSubmissions = function(project_uuid) {
        var deferred = $q.defer();
            $rootScope.httpRequest("/client/project/" + project_uuid + "/submission/").then(function(serverProjects) {
                console.log('all submissions: ' + JSON.stringify(serverProjects));
                deferred.resolve(serverProjects);
            },deferred.reject);
        return deferred.promise;
    };

    this.getSubmission = function(submission) {
        var deferred = $q.defer();
            $rootScope.httpRequest("/client/project/" + submission.project_uuid + "/submission/" + submission.submission_uuid).then(function(serverSubmission) {
                serverSubmission.project_id = submission.project_id;
                serverSubmission.status = submission.status;
                deferred.resolve(serverSubmission);

            },deferred.reject);
        return deferred.promise;
    };

    this.getSubmissionById = function(project_uuid, submission_uuid) {
        var deferred = $q.defer();
            $rootScope.httpRequest("/client/project/" + project_uuid + "/submission/" + submission_uuid).then(function(serverSubmission) {
                deferred.resolve(serverSubmission);
            },deferred.reject);
        return deferred.promise;
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

        $rootScope.httpPostRequest(createOrUpdateUrl, 'form_data=' + submission.xml)
            .then(function(updatedSubmission) {
                submission.status = BOTH;
                submission.submission_uuid = updatedSubmission.submission_uuid;
                submission.version = updatedSubmission.version;

                deferred.resolve(submission);

            },deferred.reject);

        return deferred.promise;
    };

    this.checkSubmissionVersions = function(id_versions) {
        console.log('status_dict: '+ JSON.stringify(id_versions));

        var deferred = $q.defer();
        $rootScope.httpPostRequest('/client/project/dummy/submission/check-status', 'id_version_dict=' + JSON.stringify(id_versions))
        .then(function(id_status_dict) {
            console.log('status_dict: '+ JSON.stringify(id_status_dict));
            deferred.resolve(id_status_dict);
        },deferred.reject);

        return deferred.promise;
    };

}]);
