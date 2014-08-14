dcsApp.service('localStore', ['$q', function ($q) {
	var db;
	var version = '1.0';
	this.init =  function(user) {
		var dbName = convertToSlug(user.name);
		var deferred = $q.defer();

		if (isEmulator) {
			db = window.openDatabase(dbName, version, dbName, -1);
			deferred.resolve(user);
			return deferred.promise;
		}

		db = window.sqlitePlugin.openDatabase({name: dbName, bgType: 1, key: user.password}, function() {
			console.log('_getDB success');
			deferred.resolve(user);
		},deferred.reject);

		return deferred.promise;
	};

	this.createStore = function() {
		var deferred = $q.defer();
		console.log('db inside initTable: ' + db);
		db.transaction (function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS projects (project_uuid text primary key,'+
							'version text, status text, name text, xform text, headers text, local_headers text)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS submissions (submission_id integer primary key, submission_uuid text,'+
							 'version text, status text, is_modified integer, project_uuid integer, created text, data text, xml text)');
			tx.executeSql('CREATE INDEX project_uuid_index ON submissions (project_uuid)');
			console.log('Project and submission tables created');
			deferred.resolve();
		});
		return deferred.promise;
	};
	var isSingleRecord = false;
	var sqlTransaction = function(query,values, isSingleRecord) {
		var deferred = $q.defer();
		db.transaction(function(tx) {
			tx.executeSql(query,values, function(tx, resp){
				deferred.resolve(transformRows(resp.rows, isSingleRecord));
			},function(tx, error){
				deferred.reject(error);
			});
		});
		return deferred.promise;
	};
	
	// Projects table related queries

	this.createProject = function(project) {
		return sqlTransaction(
			'INSERT INTO projects (project_uuid, version, status, name, xform, headers) VALUES (?,?,?,?,?,?)',
			[project.project_uuid, project.version, 'updated', project.name, project.xform, project.headers]);
	};

	this.updateProject = function(project_uuid, project) {
		return sqlTransaction('UPDATE projects SET version=?, status=?, name=?, xform=?, headers=? where project_uuid=?', getProjectValues(project).push(project_uuid));
	};

	var getProjectValues = function(project){
		return [project.version, project.status, project.name, project.xform, project.headers];
	};

	this.deleteProject = function(project_uuid) {
		return sqlTransaction('DELETE FROM submissions where project_uuid=?', [project_uuid])
		.then(function(tx, resp){
			sqlTransaction('DELETE FROM projects WHERE project_uuid = ? ', [project_uuid]);
		});
	};

	this.getCountOfProjects = function() {
		return sqlTransaction('select count(*) as total FROM projects',[], true);
	};

	this.getProjects = function(offset,limit) {
		return sqlTransaction('SELECT * FROM projects limit ? offset ?', [limit,offset]);
	};

	this.getProjectById = function(project_uuid) {
		return sqlTransaction('SELECT * FROM projects where project_uuid = ? ', [project_uuid], true);
	};

	this.getSubmissionHeaders = function(project_uuid) {
        return sqlTransaction('SELECT local_headers as headers from projects WHERE project_uuid = ?',[project_uuid], true);
       };

       this.setSubmissionHeaders = function(project_uuid, headers) {
               var deferred = $q.defer();
               sqlTransaction('UPDATE projects SET local_headers = ? WHERE project_uuid = ?',[JSON.stringify(headers), project_uuid],
                               deferred.resolve, deferred.reject);
               return deferred.promise;
       };

	//---------------------------------------------------------------------------------------------------------------------------------
	// Submission table related queries

	this.createSubmission = function(submission) {
		var query ='INSERT INTO submissions (submission_uuid, version, status, is_modified, project_uuid, created, data, xml)'+
		'VALUES (?,?,?,?,?,?,?,?)';
		return sqlTransaction(query, getSubmissionAsValues(submission));
	};
	
	this.updateSubmission = function(submission_id, submission) {
		return sqlTransaction('UPDATE submissions SET submission_uuid=?, version=?, status=?, is_modified=?, project_uuid=?, created=?, data=?, xml=? where submission_id = ?', 
			getSubmissionAsValues(submission).push(submission_id));
	};

	var getSubmissionAsValues = function(submission){
		var values =[submission.submission_uuid, submission.version, "changed", 1, submission.project_uuid,
			submission.created, submission.data, submission.xml];
		return values;
	};

	this.deleteSubmissions = function(submissions_ids) {
		return sqlTransaction('DELETE FROM submissions WHERE submission_id IN(' +
					getParamHolders(submissions_ids) + ')', submissions_ids);
	};

	this.getCountOfSubmissions = function(project_uuid) {
		return sqlTransaction('select count(*) as total FROM submissions where project_uuid = ?',[project_uuid], true);
	};

	this.getSubmissionById = function(submission_id) {
		return sqlTransaction('SELECT * FROM submissions where submission_id = ?', [submission_id], true);
	};

	this.submissionNotExists = function(submission_uuid) {
		return sqlTransaction('SELECT submission_uuid FROM submissions where submission_uuid = ?', [submission_uuid]);
	};

	this.getSubmissionsByProjectId = function(project_uuid, offset, limit) {
		return sqlTransaction('SELECT * FROM submissions WHERE project_uuid = ? limit ? offset ?', [project_uuid, limit, offset]);
	};

	var getParamHolders = function(paramArray) {
		return paramArray.map(function() { return '?';}).join(',');
	};

	this.getSubmissionVersions = function(project_uuid) {
		return sqlTransaction('SELECT submission_uuid, version from submissions WHERE project_uuid = ? ', [project_uuid]);
	};

	//--------------------------------------------------------------------------
	var transformRows = function(resultSet, isSingleRecord) {
		var rows = [];
		if(isSingleRecord && resultSet.length > 0)
			return angular.copy(resultSet.item(0));

		for (var i=0; i < resultSet.length; i++) 
			 rows.push(resultSet.item(i));
		
		return angular.copy(rows);
	};
}]);
