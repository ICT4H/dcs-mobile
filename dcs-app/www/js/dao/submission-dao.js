dcsApp.service('submissionDao',['$q', 'store', function($q, store){

	this.createSubmission = function(submission) {
		var query ='INSERT INTO submissions (submission_uuid, version, status, is_modified, project_uuid, created, data, xml, new_files_added, un_changed_files)'+
		'VALUES (?,?,?,?,?,?,?,?,?,?)';
		submission.is_modified = false;
		return store.execute(query, getSubmissionAsValues(submission));
	};
	
	this.updateSubmission = function(submission) {
		var values = getSubmissionAsValuesForEdit(submission);
		values.push(submission.submission_id);
		return store.execute('UPDATE submissions SET status=?, is_modified=?, created=?, data=?, xml=?, new_files_added=?, un_changed_files=? where submission_id = ?', 
			values);
	};

	var getSubmissionAsValues = function(submission){
		var values = [submission.submission_uuid, submission.version, submission.status, submission.is_modified, submission.project_uuid,
			submission.created, submission.data, submission.xml, submission.new_files_added, submission.un_changed_files];
		return values;
	};

	var getSubmissionAsValuesForEdit = function(submission){
		var values = [submission.status, submission.is_modified, submission.created, submission.data, submission.xml, 
			submission.new_files_added, submission.un_changed_files];
		return values;
	};
	
	this.getAllSubmissions = function(project_uuid, offset, limit, searchStr) {
		var deferred = $q.defer();
		store.execute('SELECT count(*) as total FROM submissions WHERE project_uuid = ? and data like "%' + searchStr + '%"', [project_uuid], true).then(function(countResultset) {
			store.execute('SELECT * FROM submissions WHERE project_uuid = ? and data like "%'+ searchStr +'%" order by created desc limit ? offset ? ', [project_uuid, limit, offset]).then(function(submissions) {
				var result = {};
				result.total = countResultset.total;
				result.data = submissions;
				deferred.resolve(result);
			}, deferred.reject);
		}, deferred.reject);
		return deferred.promise;
	};

	this.getUnsubmittedSubmissions = function(project_uuid, offset, limit, searchStr) {
		var deferred = $q.defer();
		store.execute('SELECT count(*) as total FROM submissions WHERE project_uuid = ? and status = "modified" and data like "%' + searchStr + '%"', [project_uuid], true).then(function(countResultset) {
			store.execute('SELECT * FROM submissions WHERE project_uuid = ? and status = "modified" and data like "%' + searchStr + '%" order by created desc limit ? offset ? ', [project_uuid, limit, offset]).then(function(submissions) {
				var result = {};
				result.total = countResultset.total;
				result.data = submissions;
				deferred.resolve(result);
			}, deferred.reject);
		}, deferred.reject);
		return deferred.promise;
	};

	this.getSubmissionForUpdate = function(submissions_ids) {
		return store.execute('select submission_uuid as id, version as rev from submissions where submission_uuid!="undefined" and submission_id IN(' + getParamHolders(submissions_ids) + ')', submissions_ids);
	};

	this.getAllSSubmissionForUpdate = function(project_uuid) {
		return store.execute('select submission_uuid as id, version as rev from submissions where submission_uuid!="undefined" and project_uuid =?', [project_uuid]);
	};

	this.deleteSubmissions = function(submissions_ids) {
		return store.execute('DELETE FROM submissions WHERE submission_id IN(' + getParamHolders(submissions_ids) + ')', submissions_ids);
	};

	this.getProjectById = function(project_uuid) {
		return store.execute('SELECT * FROM projects where project_uuid = ? ', [project_uuid], true);
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
		var deferred = $q.defer();
		store.execute('SELECT count(*) as total FROM submissions WHERE project_uuid = ?', [project_uuid], true).then(function(countResultset) {
			store.execute('SELECT * FROM submissions WHERE project_uuid = ? order by created desc limit ? offset ? ', [project_uuid, limit, offset]).then(function(submissions) {
				var result = {};
				result.total = countResultset.total;
				result.data = submissions;
				deferred.resolve(result);
			}, deferred.reject);
		}, deferred.reject);
		return deferred.promise;
	};

	var getParamHolders = function(paramArray) {
		return paramArray.map(function() { return '?';}).join(',');
	};

	this.getSubmissionVersions = function(project_uuid) {
		return store.execute('SELECT submission_uuid, version from submissions WHERE project_uuid = ? and submission_uuid!= ? ', [project_uuid, undefined]);
	};

	this.updateSubmissionStatus = function(submission_uuid, status) {
		return store.execute('UPDATE submissions SET status="' + status + '" where submission_uuid IN(' + getParamHolders(submission_uuid) + ')', submission_uuid);
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