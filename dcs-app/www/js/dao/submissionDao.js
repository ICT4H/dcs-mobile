define(['dcsApp', 'dbService'], function(dcsApp, dbService){
	var submissionDao = function(dbService){
		var submissionDao = {};

		submissionDao.storeSubmission = function(project, onSuccess){
			dbService.put(project).then(onSuccess);
		};

		submissionDao.getAllSubmission = function(form_code, onSuccess, onError){
			dbService.getBySurveyId(form_code).then(onSuccess, onError);
		};

		submissionDao.getById = function(id, onSuccess){
			dbService.get(id).then(onSuccess)
		};

		submissionDao.deleteSurveyResponse = function(surveyResponseId, onSuccess){
			dbService.remove(surveyResponseId).then(onSuccess);
		};

		return submissionDao;
	};
	dcsApp.factory('submissionDao', ['dbService', submissionDao]);
});