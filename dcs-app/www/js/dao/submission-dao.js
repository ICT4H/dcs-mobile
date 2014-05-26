dcsApp.service('submissionDao', ['dbService', function(dbService) {

	this.storeSubmission = function(project, onSuccess){
		dbService.put(project).then(onSuccess);
	};

	this.getAllSubmission = function(form_code, onSuccess, onError){
		dbService.getBySurveyId(form_code).then(onSuccess, onError);
	};

	this.getById = function(id, onSuccess){
		dbService.get(id).then(onSuccess)
	};

	this.deleteSurveyResponse = function(surveyResponseId, onSuccess){
		dbService.remove(surveyResponseId).then(onSuccess);
	};

	this.updateSurveyResponse = function(surveyResponse, updatedSurveyResponse, onSuccess){
		this.storeSubmission(copySubmissions(surveyResponse,updatedSurveyResponse), function(id){
			this.deleteSurveyResponse(surveyResponse.id, onSuccess);
		});
	};

	var copySubmissions = function(surveyResponse, updatedSurveyResponse){
		console.log('created '+ updatedSurveyResponse.created);
		updatedSurveyResponse.form_code = surveyResponse.form_code;
		updatedSurveyResponse.type = surveyResponse.type;
		updatedSurveyResponse.xml = surveyResponse.xml;
		return updatedSurveyResponse;
	};
	
}]);
