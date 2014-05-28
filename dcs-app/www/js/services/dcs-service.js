var dcsService = function($location, $http, dbService) {

  var dcsService = {};

  dcsService.getQuestionnaires = function() {
      var promise = new Promise(function(resolve, reject) {
          dbService.get('credentials').then(function(credentials) { 
              if (typeof(credentials) == 'undefined') {
                 resolve([]); //TODO redirect to setting
              }
              $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
              $http.get(credentials.serverUrl +"/client/questionnaires/").success(function(serverProjects){
                  resolve(serverProjects);
              }).error(function(error){
                  resolve([]);
              });
          });
      });
      return promise;
  };

  dcsService.getSubmissions = function(surveyId){
    var promise = new Promise(function(resolve, reject){
      dbService.get('credentials').then(function(credentials){ 
          $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
          $http.get(credentials.serverUrl +"/client/submissions/"+ surveyId +"/").success(function(serverProjects){
            resolve(serverProjects);
          }).error(function(error){
            resolve([]);
          });
      });
    });
    return promise;
  };

  dcsService.postSubmission = function(surveyResponse){
    var promise = new Promise(function(resolve, reject){
      dbService.get('credentials').then(function(credentials){
          $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
          $http.post(credentials.serverUrl +"/client/submissions/upload/", 'form_data=' + surveyResponse.xml).success(function(updatedSurveyResponse){
            resolve(updatedSurveyResponse);
          }).error(function(error){
            reject(error);
          });
      });
    });
    return promise;
  };

  return dcsService; 
};

dcsApp.service('dcsService', ['$location', '$http', 'dbService', dcsService]);
