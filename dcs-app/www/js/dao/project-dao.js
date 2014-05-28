var projectDao = function(dbService) {
	var projectDao = {};
	
	projectDao.createProject = function(project, onSuccess){
		dbService.put(project).then(onSuccess);
	};

	projectDao.getAllProject = function(onSuccess, onError){
		dbService.getByDoucmentType('survey').then(onSuccess, onError);
	};

	projectDao.getById = function(id, onSuccess){
		dbService.get(id).then(onSuccess);
	};

	projectDao.deleteProject = function(surveyId, onSuccess){
		dbService.remove(surveyId).then(onSuccess);
	};

	projectDao.deleteRelatedSubmission = function(surveyId, onSuccess){
		dbService.getBySurveyId(surveyId).then(function(surveyResponses){
			surveyResponses.forEach(function(surveyResponse){
				dbService.remove(surveyResponse.id).then(function(deletedId){console.log('deleted :'+ deletedId)})
			});
		});
	}
	return projectDao;
};

dcsApp.service('projectDao', ['dbService', projectDao]);
