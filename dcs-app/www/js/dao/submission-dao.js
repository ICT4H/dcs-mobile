dcsApp.service('submissionDao',['store', function(store){

	this.createSubmission = function(submission) {
		var query ='INSERT INTO submissions (submission_uuid, version, status, is_modified, project_uuid, created, data, xml)'+
		'VALUES (?,?,?,?,?,?,?,?)';
		return store.execute(query, getSubmissionAsValues(submission));
	};
	
	this.updateSubmission = function(submission_id, submission) {
		var values = getSubmissionAsValues(submission);
		values.push(submission_id);
		return store.execute('UPDATE submissions SET submission_uuid=?, version=?, status=?, is_modified=?, project_uuid=?, created=?, data=?, xml=? where submission_id = ?', 
			values);
	};

	var getSubmissionAsValues = function(submission){
		var values = [submission.submission_uuid, submission.version, "changed", 1, submission.project_uuid,
			submission.created, submission.data, submission.xml];
		return values;
	};

	this.deleteSubmissions = function(submissions_ids) {
		return store.execute('DELETE FROM submissions WHERE submission_id IN(' +
					getParamHolders(submissions_ids) + ')', submissions_ids);
	};

	this.getProjectById = function(project_uuid) {
		return store.execute('SELECT * FROM projects where project_uuid = ? ', [project_uuid], true);
	};

	this.getSubmissionHeaders = function(project_uuid) {
        return store.execute('SELECT local_headers as headers from projects WHERE project_uuid = ?',[project_uuid], true);
    };

	this.getCountOfSubmissions = function(project_uuid) {
		return store.execute('select count(*) as total FROM submissions where project_uuid = ?',[project_uuid], true);
	};

	this.getSubmissionById = function(submission_id) {
		return store.execute('SELECT * FROM submissions where submission_id = ?', [submission_id], true);
	};

	this.submissionNotExists = function(submission_uuid) {
		return store.execute('SELECT submission_uuid FROM submissions where submission_uuid = ?', [submission_uuid]);
	};

	this.getSubmissionsByProjectId = function(project_uuid, offset, limit) {
		return store.execute('SELECT * FROM submissions WHERE project_uuid = ? limit ? offset ?', [project_uuid, limit, offset]);
	};

	var getParamHolders = function(paramArray) {
		return paramArray.map(function() { return '?';}).join(',');
	};

	this.getSubmissionVersions = function(project_uuid) {
		return store.execute('SELECT submission_uuid, version from submissions WHERE project_uuid = ? and submission_uuid!= ? ', [project_uuid, undefined]);
	};
	

}]);	