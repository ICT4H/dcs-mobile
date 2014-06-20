dcsApp.service('localStore', ['$q', function ($q) {
	var db;
	var version = '1.0';

	this.init = function(options) {
    	var deferred = $q.defer();
			db = _getDB(options.userName, options.password);
			db.transaction (function(tx) {
				tx.executeSql('CREATE TABLE IF NOT EXISTS projects (project_id integer primary key, project_uuid text, version text, status text, name text, xform text)');
				tx.executeSql('CREATE TABLE IF NOT EXISTS submissions (submission_id integer primary key, submission_uuid text, version text, status text, project_id text, created text, html text, xml text)');
				deferred.resolve();
			});
		return deferred.promise;
    };

	this.openDB = function(dbName, dbKey) {
    	var deferred = $q.defer();
			db = _getDB(dbName, dbKey, deferred.reject);
			db.transaction(function(tx) {
				// Is this required, as only valid key will unlock sqlite this
				//TODO change this to get user server password
				tx.executeSql('SELECT * FROM projects where project_id = ?',
					[1], deferred.resolve, deferred.reject);
			});	
		return deferred.promise;
    };

	function _getDB(dbName, dbKey, reject) {
		//TODO make this method to always return promise
		dbName = convertToSlug(dbName);
		var db;
		if (isEmulator) {
			db = window.openDatabase(dbName, version, dbName, -1);
		} else {
			if (reject) {
				db = window.sqlitePlugin.openDatabase({name: dbName, bgType: 1, key: dbKey}, function() {
					console.log('_getDB success');
				}, function(e) {
					console.log('_getDB failed');
					reject();
				});

			} else {
				db = window.sqlitePlugin.openDatabase({name: dbName, bgType: 1, key: dbKey});
			}
		}
		return db;
	};

	this.createProject = function(project) {
    	var deferred = $q.defer();
			db.transaction (function(tx) {
				tx.executeSql(
					'INSERT INTO projects (project_uuid, version, status, name, xform) VALUES (?,?,?,?,?)', [project.project_uuid, project.version, 'both', project.name, project.xform],
					function(tx, resp){
						deferred.resolve(resp.insertId);
					}, deferred.reject
				);
			});
		return deferred.promise;
    };

	this.getProjectById = function(project_id) {
    	var deferred = $q.defer();
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM projects where project_id = ?', [project_id], function(tx, resp) {
					deferred.resolve(transformRows(resp.rows)[0]);
				},deferred.reject);
			});
		return deferred.promise;
    };

	this.getAllLocalProjects = function() {
    	var deferred = $q.defer();
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM projects', [], function(tx, resp) {
					deferred.resolve(transformRows(resp.rows));
				},deferred.reject);
			});
		return deferred.promise;
    };

	this.deleteProject = function(project_id) {
    	var deferred = $q.defer();
			db.transaction(function(tx) {
				tx.executeSql('DELETE FROM projects WHERE project_id = ? ', [project_id], function(tx, resp) {
						deferred.resolve()
					}, deferred.reject
				);
			});
		return deferred.promise;
    };

	this.getAllProjectSubmissions = function(project_id) {
    	var deferred = $q.defer();
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM submissions WHERE project_id = ?', [project_id], function(tx, resp) {
					deferred.resolve(transformRows(resp.rows));
				}, deferred.reject);
			});
		return deferred.promise;
    };

	// used by download & enketo
	this.createSubmission = function(submission) {
    	var deferred = $q.defer();
			db.transaction (function(tx) {
				tx.executeSql(
					'INSERT INTO submissions (submission_uuid, version, status, project_id, created, html, xml) VALUES (?,?,?,?,?,?,?)', 
						[submission.submission_uuid, submission.version, submission.status, submission.project_id, submission.created, submission.html, submission.xml],
					function(tx, resp){
						submission.submission_id = resp.insertId;
						deferred.resolve(submission);
					}, deferred.reject
				);
			});
		return deferred.promise;
    };

	// used by enketo update
	this.updateSubmissionData = function(submission_id, submission) {
    	var deferred = $q.defer();
			db.transaction (function(tx) {
				tx.executeSql('UPDATE submissions SET html=?, xml=?, created=? where submission_id = ?', 
						[submission.html, submission.xml, submission.created, submission_id], function(tx, resp) {
							deferred.resolve();
						}, deferred.reject);
			})
		return deferred.promise;
    };

	// used by post submission
	this.updateSubmissionMeta = function(submission_id, submission) {
    	var deferred = $q.defer();
			db.transaction (function(tx) {
				tx.executeSql('UPDATE submissions SET submission_uuid=?, version=?, status=?, created=? where submission_id = ?', 
						[submission.submission_uuid, submission.version, submission.status, submission.created, submission_id], function(tx, resp) {
							deferred.resolve();
						}, deferred.reject);
			})
		return deferred.promise;
    };

	this.getSubmissionById = function(submission_id) {
    	var deferred = $q.defer();
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM submissions where submission_id = ?', [submission_id], function(tx, resp) {
					deferred.resolve(transformRows(resp.rows)[0]);
				},deferred.reject);
			});
		return deferred.promise;
    };

	this.deleteSubmission = function(submission_id) {
    	var deferred = $q.defer();
			db.transaction(function(tx) {
				tx.executeSql('DELETE FROM submissions WHERE submission_id = ? ', [submission_id], function(tx, resp) {deferred.resolve()}, deferred.reject);
			});
		return deferred.promise;
    };

	var transformRows = function(resultSet) {
		var rows = [];
		for (var i=0; i < resultSet.length; i++) {
			 rows.push(resultSet.item(i));
		}

		return angular.copy(rows);
	};
}]);
