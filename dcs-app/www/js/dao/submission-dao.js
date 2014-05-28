 var submissionDao = function(dbService) {
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

	submissionDao.updateSurveyResponse = function(surveyResponse, updatedSurveyResponse, onSuccess){
		submissionDao.storeSubmission(copySubmissions(surveyResponse,updatedSurveyResponse), function(id){
			submissionDao.deleteSurveyResponse(surveyResponse.id, onSuccess);
		});
	};
	
	var copySubmissions = function(surveyResponse, updatedSurveyResponse){
		console.log('created '+ updatedSurveyResponse.created);
		updatedSurveyResponse.form_code = surveyResponse.form_code;
		updatedSurveyResponse.type = surveyResponse.type;
		updatedSurveyResponse.xml = surveyResponse.xml;
		return updatedSurveyResponse;
	};
	return submissionDao;
};

dcsApp.service('submissionDao', ['dbService', submissionDao]);
