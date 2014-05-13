define(['dcsApp'], function(dcsApp){
 	var dcsService = function($http){
    	var dcsService = {};

    	dcsService.getQuestionnaires = function(){
    		return $http({
                method: "JSONP",
                url: "http://localhost:8000/client/questionnaires/?callback=JSON_CALLBACK",
            });	
  		};

  		dcsService.getSubmissions = function(surveyId){
  			return $http({
                method: "JSONP",
                url: "http://localhost:8000/client/submissions/"+ surveyId +"/?callback=JSON_CALLBACK",
            });	
  		};
  		return dcsService;
 	};
  	dcsApp.service('dcsService', ['$http', dcsService]);
});