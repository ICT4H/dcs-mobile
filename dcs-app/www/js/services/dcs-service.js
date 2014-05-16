define(['dcsApp', 'dbService'], function(dcsApp, dbService){
 	var dcsService = function($http, dbService){
      
      dbService.getCredentails().then(function(credentails){
        $http.defaults.headers.common.Authorization = credentails;  
      });
    	var dcsService = {};

    	dcsService.getQuestionnaires = function(){
    		return $http.get("http://10.4.4.37:8000/client/questionnaires/");	
  		};

  		dcsService.getSubmissions = function(surveyId){
  			return $http.get("http://10.4.4.37:8000/client/submissions/"+ surveyId +"/");	
  		};
  		return dcsService;
 	};
  	dcsApp.service('dcsService', ['$http', 'dbService', dcsService]);

});