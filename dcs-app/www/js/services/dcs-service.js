dcsApp.service('dcsService', ['$q', '$rootScope', function($q, $rootScope) {

    this.getQuestionnaires = function() {
        var deferred = $q.defer();
            $rootScope.httpRequest("/client/project/").success(function(projects) {
                console.log('all projects: ' + JSON.stringify(projects));
                deferred.resolve(projects);
              }).error(function(error){
                  deferred.resolve([]);
              });  
        return deferred.promise;
    };

    this.getQuestion = function(project_uuid) {
        var deferred = $q.defer();
            $rootScope.httpRequest("/client/project/" + project_uuid).success(function(project) {
                console.log('project: ' + JSON.stringify(project));
                deferred.resolve(project);
              }).error(deferred.reject);
        return deferred.promise;
    };

    this.getAllSubmissions = function(project_uuid) {
        var deferred = $q.defer();
            $rootScope.httpRequest("/client/project/" + project_uuid + "/submission/").success(function(serverProjects) {
                console.log('all submissions: ' + JSON.stringify(serverProjects));
                deferred.resolve(serverProjects);
            }).error(function(error){
                  deferred.resolve([]);
            });
        return deferred.promise;
    };

    this.getSubmission = function(submission) {
        var deferred = $q.defer();
            $rootScope.httpRequest("/client/project/" + submission.project_uuid + "/submission/" + submission.submission_uuid).success(function(serverSubmission) {
                serverSubmission.project_id = submission.project_id;
                serverSubmission.status = submission.status;
                serverSubmission.created = submission.created;

                deferred.resolve(serverSubmission);

            }).error(deferred.reject);
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
            .success(function(updatedSubmission) {
                submission.status = BOTH;
                submission.submission_uuid = updatedSubmission.submission_uuid;
                submission.version = updatedSubmission.version;

                deferred.resolve(submission);

            }).error(deferred.reject);

        return deferred.promise;
    };

}]);
