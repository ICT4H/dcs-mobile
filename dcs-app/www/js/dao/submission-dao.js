dcsApp.service('submissionDao',['store', function(store){

	this.createSubmission = function(submission) {
		var query ='INSERT INTO submissions (submission_uuid, version, status, project_uuid, created, data, xml, new_files_added, un_changed_files)'+
		'VALUES (?,?,?,?,?,?,?,?,?)';
		return store.execute(query, getSubmissionAsValues(submission));
	};

	this.createSearchTable = function(submissionIds) {

		var queries = [];
		queries.push({'statement': 'DROP TABLE IF EXISTS  searchTable'});
		queries.push({'statement': 'create temp table searchTable as select * from submissions where submission_id IN(' + getParamHolders(submissionIds) + ')', 'values': submissionIds});

		return store.executeMultipleQueries(queries);
	};
	
	this.updateSubmission = function(submission) {
		var values = getSubmissionAsValues(submission);
		values.push(submission.submission_id);
		return store.execute('UPDATE submissions SET ' + 
			'submission_uuid=?, version=?, status=?, project_uuid=?, created=?, data=?, xml=?, new_files_added=?, un_changed_files=? where submission_id = ?', 
			values);
	};

	this.updateSubmissionUsingUuid = function(submission) {
		var values = getSubmissionAsValues(submission);
		values.push(submission.submission_uuid);
		return store.execute('UPDATE submissions SET ' + 
			'submission_uuid=?, version=?, status=?, project_uuid=?, created=?, data=?, xml=?, new_files_added=?, un_changed_files=? where submission_uuid = ?', 
			values);
	};

	var getSubmissionAsValues = function(submission){
		var values = [submission.submission_uuid, submission.version, submission.status, submission.project_uuid,
			submission.created, submission.data, submission.xml, submission.new_files_added, submission.un_changed_files];
		return values;
	};

	var getQueriesFor = function(project_uuid, type, searchStr, offset, limit){
		var queries = {
		'all': [
			{'statement': 'SELECT count(*) as total FROM submissions WHERE project_uuid = ? and data like "%' + searchStr + '%"', 'values': [project_uuid], 'isSingleRecord':true},
			{'statement': 'SELECT * FROM submissions WHERE project_uuid = ? and data like "%'+ searchStr +'%" order by created desc limit ? offset ?', 'values': [project_uuid, limit, offset], 'holder': 'data'},
			{'statement': 'SELECT displayable_mobile_fields FROM projects WHERE project_uuid = ?', 'values': [project_uuid], 'holder': 'displayable_mobile_fields', 'isSingleRecord':true}],
		'unsubmitted': [
			{'statement': 'SELECT count(*) as total FROM submissions WHERE project_uuid = ? and status = "modified" and data like "%' + searchStr + '%"', 'values': [project_uuid], 'isSingleRecord':true},
			{'statement': 'SELECT * FROM submissions WHERE project_uuid = ? and status = "modified" and data like "%' + searchStr + '%" order by created desc limit ? offset ? ', 'values': [project_uuid, limit, offset], 'holder': 'data'},
			{'statement': 'SELECT displayable_mobile_fields FROM projects WHERE project_uuid = ?', 'values': [project_uuid], 'holder': 'displayable_mobile_fields', 'isSingleRecord':true}],
		'conflicted': [
			{'statement': 'SELECT count(*) as total FROM submissions WHERE project_uuid = ? and status = "conflicted" and data like "%' + searchStr + '%"', 'values': [project_uuid], 'isSingleRecord':true},
			{'statement': 'SELECT * FROM submissions WHERE project_uuid = ? and status = "conflicted" and data like "%' + searchStr + '%" order by created desc limit ? offset ? ', 'values': [project_uuid, limit, offset], 'holder': 'data'},
			{'statement': 'SELECT displayable_mobile_fields FROM projects WHERE project_uuid = ?', 'values': [project_uuid], 'holder': 'displayable_mobile_fields', 'isSingleRecord':true}],
		'search': [
			{'statement': 'SELECT count(*) as total FROM searchTable', 'isSingleRecord':true},
			{'statement': 'SELECT * FROM searchTable order by created desc limit ? offset ? ', 'values': [limit, offset], 'holder': 'data'}]
		};

		return queries[type];
	}

	this.searchSubmissionsByType = function(project_uuid, type, searchStr, offset, limit) {
		var queries = getQueriesFor(project_uuid, type, searchStr || "", offset, limit);
		return store.executeMultipleQueries(queries);
	};

	this.getRecentlyCreateSubmissionId = function() {
		return store.execute('SELECT last_insert_rowid() AS rowid FROM submissions LIMIT 1');
	}

	this.getSubmissionForUpdate = function(submissions_ids) {
		return store.execute('select submission_uuid as id, version as rev from submissions where submission_uuid!="undefined" and submission_id IN(' + getParamHolders(submissions_ids) + ')', submissions_ids);
	};

	this.deleteSubmissions = function(submissions_ids) {
		return store.execute('DELETE FROM submissions WHERE submission_id IN(' + getParamHolders(submissions_ids) + ')', submissions_ids);
	};

	this.deleteAllSubmissionOfProject = function(project_uuid) {
		return store.execute('DELETE FROM submissions where project_uuid = ?', [project_uuid]);
	};

	this.getProjectById = function(project_uuid) {
		return store.execute('SELECT * FROM projects where project_uuid = ? ', [project_uuid], true);
	};

	//TODO: This is unused method
	this.getCountOfSubmissions = function(project_uuid) {
		return store.execute('select count(*) as total FROM submissions where project_uuid = ?',[project_uuid], true);
	};

	this.getSubmissionById = function(submission_id) {
		return store.execute('SELECT * FROM submissions where submission_id = ?', [submission_id], true);
	};

	this.getSubmissionByuuid = function(submission_id) {
		return store.execute('SELECT * FROM submissions where submission_uuid = ?', [submission_id], true);
	};

	this.getsubmissionUuidByUuid = function(submission_uuid) {
		return store.execute('SELECT submission_uuid FROM submissions where submission_uuid = ?', [submission_uuid]);
	};

	this.getsubmissionIdByUuid = function(submission_uuid) {
		return store.execute('SELECT submission_id FROM submissions where submission_uuid = ?', [submission_uuid]);
	};

	this.getAllSubmissionOf = function(project_uuid) {
		return store.execute('SELECT submission_id, data from submissions where project_uuid = ?', [project_uuid]);
	};

	//TODO: This is unused method
	this.getSubmissionsByProjectId = function(project_uuid, offset, limit) {

		var queries = [];
		queries.push({'statement': 'SELECT count(*) as total FROM submissions WHERE project_uuid = ?', 'values': [project_uuid], 'isSingleRecord':true});
		queries.push({'statement': 'SELECT * FROM submissions WHERE project_uuid = ? order by created desc limit ? offset ?', 'values': [project_uuid, limit, offset], 'holder': 'data'});

		return store.executeMultipleQueries(queries);
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

	this.getSubmissionsByStatusPagination = function(project_uuid, status, offset, limit) {
		return store.execute('select * from submissions where project_uuid = ? and status = ? limit ? offset ?', [project_uuid, status, limit, offset]);
	};

	this.getModifiedAndUnModifiedUuids = function(uuids) {
		var queries = [];
		queries.push({'statement': 'SELECT submission_uuid FROM submissions where submission_uuid IN (' + getParamHolders(uuids) + ') and status="modified"', 'values': uuids, 'holder': 'modifiedUuids'});
		queries.push({'statement': 'SELECT submission_uuid FROM submissions where submission_uuid IN (' + getParamHolders(uuids) + ') and status="both"', 'values': uuids, 'holder': 'unModifiedUuids'});
		queries.push({'statement': 'SELECT submission_uuid FROM submissions where submission_uuid IN (' + getParamHolders(uuids) + ') and status="conflicted"', 'values': uuids, 'holder': 'conflictedUuids'});

		return store.executeMultipleQueries(queries);
	}
	
}]);	