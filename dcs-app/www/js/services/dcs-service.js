dcsApp.service('dcsService', ['$rootScope', 'dbService', function($rootScope, dbService) {

    this.getQuestionnaires = function() {
        return new Promise(function(resolve, reject) {
            $rootScope.httpRequest("/client/questionnaires/").success(function(serverProjects){
                resolve(serverProjects);
              }).error(function(error){
                  resolve([]);
              });  
        });
    };

    this.getSubmissions = function(surveyId){
        return new Promise(function(resolve, reject){
            $rootScope.httpRequest("/client/submissions/"+ surveyId +"/").success(function(serverProjects){
                resolve(serverProjects);
            }).error(function(error){
                resolve([]);
            });
        });
    };

    this.postSubmission = function(submission){
        return new Promise(function(resolve, reject){
            $rootScope.httpPostRequest("/client/submissions/upload/", 'form_data=' + submission.xml).success(function(updatedSubmission){
                resolve(updatedSubmission);
            }).error(reject);
        });
    };

}]);
