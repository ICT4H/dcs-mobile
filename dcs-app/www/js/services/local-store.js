var localStore = function() {

	var store = {};
	var dbName = 'DCS-STORE'; // TODO appropriate name?
	var version = '1.0';
	var db;

	// drop TABLE projects ; DROP TABLE submissions ;
	if (window.sqlitePlugin)

		db = window.sqlitePlugin.openDatabase({name: dbName, bgType: 1})
	else
		db = window.openDatabase(dbName, version, dbName, -1);

	//tx.executeSql('DROP TABLE IF EXISTS projects');

	db.transaction (function(tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS projects (project_id integer primary key, project_uuid text, version text, name text, xform text)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS submissions (submission_id integer primary key, submission_uuid text, version text, project_id text, created text, html text, xml text)');

	});
	

	store.createProject = function(project) {
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql(
					'INSERT INTO projects (project_uuid, version, name, xform) VALUES (?,?,?,?)', [project.project_uuid, project.version, project.name, project.xform],
					function(tx, resp){
						resolve(resp.insertId);
					}, reject
				);
			});
		});
	}

	store.getProjectById = function(project_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM projects where project_id = ?', [project_id], function(tx, resp) {
					resolve(transformRows(resp.rows)[0]);
				},reject);
			});
		});
	}

	store.getAllLocalProjects = function() {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM projects', [], function(tx, resp) {
					resolve(transformRows(resp.rows));
				},reject);
			});
		});
	};

	store.deleteProject = function(project_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('DELETE FROM projects WHERE project_id = ? ', [project_id], function(tx, resp) {
						resolve()
					}, reject
				);
			});
		});
	};

	store.getAllProjectSubmissions = function(project_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM submissions WHERE project_id = ?', [project_id], function(tx, resp) {
					resolve(transformRows(resp.rows));
				}, reject);
			});
		});
	}

	// used by download & enketo
	store.createSubmission = function(submission) {
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql(
					'INSERT INTO submissions (submission_uuid, version, project_id, created, html, xml) VALUES (?,?,?,?,?,?)', 
						[submission.submission_uuid, submission.version, submission.project_id, submission.created, submission.html, submission.xml],
					function(tx, resp){
						submission.submission_id = resp.insertId;
						resolve(submission);
					}, reject
				);
			});
		});
	}

	// used by enketo update
	store.updateSubmissionData = function(submission_id, submission) {
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql('UPDATE submissions SET html=?, xml=?, created=? where submission_id = ?', 
						[submission.html, submission.xml, submission.created, submission_id], function(tx, resp) {
							resolve();
						}, reject);
			})
		});
	}

	// used by post submission
	store.updateSubmissionMeta = function(submission_id, submission) {
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql('UPDATE submissions SET submission_uuid=?, version=?, created=? where submission_id = ?', 
						[submission.submission_uuid, submission.version, submission.created, submission_id], function(tx, resp) {
							resolve();
						}, reject);
			})
		});
	}

	store.getSubmissionById = function(submission_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM submissions where submission_id = ?', [submission_id], function(tx, resp) {
					resolve(transformRows(resp.rows)[0]);
				},reject);
			});
		});
	}

	store.deleteSubmission = function(submission_id) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('DELETE FROM submissions WHERE submission_id = ? ', [submission_id], function(tx, resp) {resolve()}, reject);
			});
		});
	}

	var transformRows = function(resultSet) {
		var rows = [];
		for (var i=0; i < resultSet.length; i++) {
			 rows.push(resultSet.item(i));
		}
		return rows;
	};

	return store;
}
