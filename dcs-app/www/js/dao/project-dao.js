dcsApp.service('projectDao', ['dbService', function(dbService) {

	this.createProject = function(project, onSuccess){
		dbService.put(project).then(onSuccess);
	};

	this.getAllProject = function(onSuccess, onError){
		dbService.getByDoucmentType('survey').then(onSuccess, onError);
	};

	this.getById = function(id, onSuccess){
		dbService.get(id).then(onSuccess);
	};

	this.deleteProject = function(surveyId, onSuccess){
		dbService.remove(surveyId).then(onSuccess);
	};

	this.deleteRelatedSubmission = function(surveyId, onSuccess){
		dbService.getBySurveyId(surveyId).then(function(surveyResponses){
			surveyResponses.forEach(function(surveyResponse){
				dbService.remove(surveyResponse.id).then(function(deletedId){console.log('deleted :'+ deletedId)})
			});
		});
	}

}]);
