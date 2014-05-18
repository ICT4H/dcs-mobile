define(['dcsApp', 'dbService'], function(dcsApp, dbService){
 	var dcsService = function($http, dbService){

    	var dcsService = {};

    	dcsService.getQuestionnaires = function(){
        var promise = new Promise(function(resolve, reject){
          dbService.get('credentials').then(function(credentials){ 
            console.log(credentials);
              $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
              $http.get(credentials.serverUrl +"/client/questionnaires/").success(function(serverProjects){
                resolve(serverProjects);
              }).error(function(error){
                console.log('error');
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

  		return dcsService;
 	};
  	dcsApp.service('dcsService', ['$http', 'dbService', dcsService]);

});