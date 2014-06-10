dcsApp.service('dcsService', ['$rootScope', function($rootScope) {

    this.getQuestionnaires = function() {
        return new Promise(function(resolve, reject) {
            $rootScope.httpRequest("/client/project/").success(function(projects) {
                console.log('all projects: ' + JSON.stringify(projects));
                resolve(projects);
              }).error(function(error){
                  resolve([]);
              });  
        });
    };

    this.getQuestion = function(project_uuid) {
        return new Promise(function(resolve, reject) {
            $rootScope.httpRequest("/client/project/" + project_uuid).success(function(project) {
                console.log('project: ' + JSON.stringify(project));
                resolve(project);
              }).error(reject);  
        });
    };

    this.getAllSubmissions = function(project_uuid) {
        return new Promise(function(resolve, reject) {
            $rootScope.httpRequest("/client/project/" + project_uuid + "/submission/").success(function(serverProjects) {
                console.log('all submissions: ' + JSON.stringify(serverProjects));
                resolve(serverProjects);
            }).error(function(error){
                  resolve([]);
            });
        });
    };

    this.getSubmission = function(submission) {
        return new Promise(function(resolve, reject) {
            $rootScope.httpRequest("/client/project/" + submission.project_uuid + "/submission/" + submission.submission_uuid).success(function(serverSubmission) {
                serverSubmission.project_id = submission.project_id;
                console.log('all submissions: ' + JSON.stringify(serverSubmission));
                resolve(serverSubmission);
            }).error(reject);
        });
    };

    this.postSubmission = function(submission) {
        console.log('submit submission: ' + JSON.stringify(submission));
        return new Promise(function(resolve, reject) {

            if (submission.submission_uuid == undefined) {
                $rootScope.httpPostRequest("/client/project/dummy/submission/", 'form_data=' + submission.xml)
                    .success(function(updatedSubmission) {
                        resolve(updatedSubmission);
                    }).error(reject);
            } else {
                $rootScope.httpPostRequest("/client/project/dummy/submission/" + submission.submission_uuid, 'form_data=' + submission.xml)
                    .success(function(updatedSubmission) {
                        resolve(updatedSubmission);
                    }).error(function(data, status, headers, config) {
                        reject({"status":status});
                    });
            }


            
        });
    };

}]);
