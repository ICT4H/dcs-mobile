dcsApp.service('submissionDao',['store', function(store){

	this.createSubmission = function(submission) {
		var query ='INSERT INTO submissions (submission_uuid, version, status, is_modified, project_uuid, created, data, xml, new_files_added, un_changed_files)'+
		'VALUES (?,?,?,?,?,?,?,?,?,?)';
		submission.is_modified = false;
		return store.execute(query, getSubmissionAsValues(submission));
	};
	
	this.updateSubmission = function(submission) {
		var values = getSubmissionAsValues(submission);
		values.push(submission.submission_id);
		return store.execute('UPDATE submissions SET submission_uuid=?, version=?, status=?, is_modified=?, project_uuid=?, created=?, data=?, xml=?, new_files_added=?, un_changed_files=? where submission_id = ?', 
			values);
	};

	var getSubmissionAsValues = function(submission){
		var values = [submission.submission_uuid, submission.version, submission.status, submission.is_modified, submission.project_uuid,
			submission.created, submission.data, submission.xml, submission.new_files_added, submission.un_changed_files];
		return values;
	};

	this.deleteSubmissions = function(submissions_ids) {
		return store.execute('DELETE FROM submissions WHERE submission_id IN(' + getParamHolders(submissions_ids) + ')', submissions_ids);
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


	this.getSubmissionByuuid = function(submission_id) {
		return store.execute('SELECT * FROM submissions where submission_uuid = ?', [submission_id]);
	};

	this.getsubmissionUuidByUuid = function(submission_uuid) {
		return store.execute('SELECT submission_uuid FROM submissions where submission_uuid = ?', [submission_uuid]);
	};

	this.getSubmissionsByProjectId = function(project_uuid, offset, limit) {
		return store.execute('SELECT * FROM submissions WHERE project_uuid = ? order by created desc limit ? offset ? ', [project_uuid, limit, offset]);
	};

	var getParamHolders = function(paramArray) {
		return paramArray.map(function() { return '?';}).join(',');
	};

	this.getSubmissionVersions = function(project_uuid) {
		return store.execute('SELECT submission_uuid, version from submissions WHERE project_uuid = ? and submission_uuid!= ? ', [project_uuid, undefined]);
	};

	this.updateSubmissionStatus = function(submission_uuid, status) {
		return store.execute('UPDATE submissions SET status=? where submission_uuid = ?', [status, submission_uuid]);
	};
	
	this.updatelastFetch  = function(project_uuid, last_fetch) {
		return store.execute('UPDATE projects SET last_fetch=? where project_uuid = ?', [last_fetch, project_uuid]);
	};

	this.updateVersion = function(submission_uuid, version) {
		return store.execute('UPDATE submissions SET version=? where submission_uuid = ?', [version, submission_uuid]);
	};

	this.getLastFetch = function(project_uuid) {
		return store.execute('select last_fetch from projects where project_uuid = ?', [project_uuid], true);
	};

	this.getSubmissionsByStatus = function(project_uuid, status) {
		return store.execute('select * from submissions where project_uuid = ? and status = ?' , [project_uuid, status]);
	};

	this.getSubmissionsByStatus = function(project_uuid, status) {
		return store.execute('select * from submissions where project_uuid = ? and status = ?' , [project_uuid, status]);
	};

	this.getSubmissionsByStatusPagination = function(project_uuid, status, offset, limit) {
		return store.execute('select * from submissions where project_uuid = ? and status = ? limit ? offset ?', [project_uuid, status, limit, offset]);
	};
	
}]);	