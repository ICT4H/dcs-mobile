dcsApp.service('localStore', [function () {
	var db;
	var version = '1.0';

	this.init = function(options) {
		return new Promise(function(resolve, reject) {
			db = _getDB(options.userName, options.password);
			db.transaction (function(tx) {
				tx.executeSql('CREATE TABLE IF NOT EXISTS projects (project_id integer primary key, project_uuid text, version text, status text, name text, xform text)');
				tx.executeSql('CREATE TABLE IF NOT EXISTS submissions (submission_id integer primary key, submission_uuid text, version text, status text, project_id text, created text, html text, xml text)');
				resolve();
			});
		});
	};

	this.openDB = function(dbName, dbKey) {
		return new Promise(function(resolve, reject) {
			db = _getDB(dbName, dbKey, reject);
			db.transaction(function(tx) {
				// Is this required, as only valid key will unlock sqlite this
				//TODO change this to get user server password
				tx.executeSql('SELECT * FROM projects where project_id = ?',
					[1], resolve, reject);
			});	
		});
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
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql(
					'INSERT INTO projects (project_uuid, version, status, name, xform) VALUES (?,?,?,?,?)', [project.project_uuid, project.version, 'both', project.name, project.xform],
					function(tx, resp){
						resolve(resp.insertId);
					}, reject
				);
			});
		});
	};

	this.getProjectById = function(project_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM projects where project_id = ?', [project_id], function(tx, resp) {
					resolve(transformRows(resp.rows)[0]);
				},reject);
			});
		});
	};

	this.getAllLocalProjects = function() {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM projects', [], function(tx, resp) {
					resolve(transformRows(resp.rows));
				},reject);
			});
		});
	};

	this.deleteProject = function(project_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('DELETE FROM projects WHERE project_id = ? ', [project_id], function(tx, resp) {
						resolve()
					}, reject
				);
			});
		});
	};

	this.getAllProjectSubmissions = function(project_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM submissions WHERE project_id = ?', [project_id], function(tx, resp) {
					resolve(transformRows(resp.rows));
				}, reject);
			});
		});
	};

	// used by download & enketo
	this.createSubmission = function(submission) {
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql(
					'INSERT INTO submissions (submission_uuid, version, status, project_id, created, html, xml) VALUES (?,?,?,?,?,?,?)', 
						[submission.submission_uuid, submission.version, submission.status, submission.project_id, submission.created, submission.html, submission.xml],
					function(tx, resp){
						submission.submission_id = resp.insertId;
						resolve(submission);
					}, reject
				);
			});
		});
	};

	// used by enketo update
	this.updateSubmissionData = function(submission_id, submission) {
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql('UPDATE submissions SET html=?, xml=?, created=? where submission_id = ?', 
						[submission.html, submission.xml, submission.created, submission_id], function(tx, resp) {
							resolve();
						}, reject);
			})
		});
	};

	// used by post submission
	this.updateSubmissionMeta = function(submission_id, submission) {
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql('UPDATE submissions SET submission_uuid=?, version=?, status=?, created=? where submission_id = ?', 
						[submission.submission_uuid, submission.version, submission.status, submission.created, submission_id], function(tx, resp) {
							resolve();
						}, reject);
			})
		});
	};

	this.getSubmissionById = function(submission_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM submissions where submission_id = ?', [submission_id], function(tx, resp) {
					resolve(transformRows(resp.rows)[0]);
				},reject);
			});
		});
	};

	this.deleteSubmission = function(submission_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('DELETE FROM submissions WHERE submission_id = ? ', [submission_id], function(tx, resp) {resolve()}, reject);
			});
		});
	};

	var transformRows = function(resultSet) {
		var rows = [];
		for (var i=0; i < resultSet.length; i++) {
			 rows.push(resultSet.item(i));
		}

		return angular.copy(rows);
	};
}]);
