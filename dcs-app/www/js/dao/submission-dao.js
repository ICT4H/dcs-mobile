dcsApp.service('submissionDao',['store', function(store){

	this.createSubmission = function(submission) {
		var query ='INSERT INTO submissions (submission_uuid, version, status, is_modified, project_uuid, created, data, xml, new_files_added, un_changed_files)'+
		'VALUES (?,?,?,?,?,?,?,?,?,?)';
		submission.is_modified = false;
		return store.execute(query, getSubmissionAsValues(submission));
	};
	
	this.updateSubmission = function(submission) {
		submission.is_modified = true;
		var values = getSubmissionAsValues(submission);
		values.push(submission.submission_id);
		return store.execute('UPDATE submissions SET submission_uuid=?, version=?, status=?, is_modified=?, project_uuid=?, created=?, data=?, xml=?, new_files_added=?, un_changed_files=? where submission_id = ?', 
			values);
	};

	var getSubmissionAsValues = function(submission){
		var values = [submission.submission_uuid, submission.version, "changed", submission.is_modified, submission.project_uuid,
			submission.created, submission.data, submission.xml, submission.new_files_added, submission.un_changed_files];
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

	this.getSubmissionByuuid = function(submission_id) {
		return store.execute('SELECT * FROM submissions where submission_uuid = ?', [submission_id]);
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

	this.updateSubmissionsStatus = function(submission_uuids, status) {
		return store.execute('UPDATE submissions SET status=? where ' +
				'submission_uuid IN(' + getParamHolders(submission_uuids) + ')',[status].concat(submission_uuids));
	};
	
	this.updatelastFetch  = function(project_uuid, last_fetch) {
		return store.execute('UPDATE projects SET last_fetch=? where project_uuid = ?', [last_fetch, project_uuid]);
	};

	this.getLastFetch = function(project_uuid) {
		return store.execute('select last_fetch from projects where project_uuid = ?', [project_uuid], true);
	};

	// this.updateDBWithNewSubmission = function(submissions) {
	// 	var insertQuery ='INSERT INTO submissions (submission_uuid, version, status, is_modified, project_uuid, created, data, xml, new_files_added, un_changed_files)'+
	// 	'VALUES (?,?,?,?,?,?,?,?,?,?)';
	// 	var updateQuery = 'UPDATE submissions SET submission_uuid=?, version=?, status=?, is_modified=?, project_uuid=?, created=?, data=?, xml=?, new_files_added=?, un_changed_files=? where submission_id = ?'
	// 	var promises = [];
	// 	submissions.forEach(function(submission) {
	// 		store.execute('select submission_uuid from submissions where submission_uuid = ?', [submission.submission_uuid], true).then(function(result){
	// 			values = getSubmissionAsValues(submission);
	// 			if(result.length == 0)
	// 				query = insertQuery;
	// 			else {
	// 				query = updateQuery;
	// 				values.push(submission.submission_uuid);
	// 			}
	// 			promises.push(store.execute(query, values));
	// 		});			
	// 	});
	// 	return promises;
	// };

}]);	