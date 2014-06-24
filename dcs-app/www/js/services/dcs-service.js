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
                console.log('all submissions: ' + JSON.stringify(serverSubmission));
                deferred.resolve(serverSubmission);
            }).error(deferred.reject);
        return deferred.promise;
    };

    this.postSubmission = function(submission) {
        console.log('submit submission: ' + JSON.stringify(submission));
        var deferred = $q.defer();

            if (submission.submission_uuid == 'undefined') {
                $rootScope.httpPostRequest("/client/project/dummy/submission/", 'form_data=' + submission.xml)
                    .success(function(updatedSubmission) {
                        deferred.resolve(updatedSubmission);
                    }).error(deferred.reject);
            } else {
                $rootScope.httpPostRequest("/client/project/dummy/submission/" + submission.submission_uuid, 'form_data=' + submission.xml)
                    .success(function(updatedSubmission) {
                        deferred.resolve(updatedSubmission);
                    }).error(function(data, status, headers, config) {
                        deferred.reject({"status":status});
                    });
            }
        return deferred.promise;
    };

}]);
