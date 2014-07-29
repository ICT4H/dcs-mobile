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

	var sqlTransaction = function(query,values,onSuccess,onError) {
		db.transaction(function(tx) {
			tx.executeSql(query,values,onSuccess,onError);
		});
	};

	this.createStore = function() {
		var deferred = $q.defer();
		console.log('db inside initTable: ' + db);
		db.transaction (function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS projects (project_id integer primary key, project_uuid text,'+
							'version text, status text, name text, xform text, headers text)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS submissions (submission_id integer primary key, submission_uuid text,'+
							 'version text, status text, is_modified integer, project_id integer, created text, data text, xml text)');
			tx.executeSql('CREATE INDEX project_id_index ON submissions (project_id)');
			console.log('Project and submission tables created');
			deferred.resolve();
		});
		return deferred.promise;
	}

	this.createProject = function(project) {
		var deferred = $q.defer();
		sqlTransaction(
			'INSERT INTO projects (project_uuid, version, status, name, xform, headers) VALUES (?,?,?,?,?,?)',
			[project.project_uuid, project.version, 'both', project.name, project.xform, project.headers],
			function(tx, resp){
				deferred.resolve(resp.insertId);
			}, deferred.reject
		);
		return deferred.promise;
	};

	this.updateProjectStatus = function(project_id, newStatus) {
		sqlTransaction('UPDATE projects SET status=? where project_id=?', [newStatus, project_id],
			function(tx, resp){
				// TODO how success and failure will be tracked
				//doning nothing here
				console.log('Project ' + project_id + ' status changed to ' + newStatus);
			}, function(e) {
				console.log('Project ' + project_id + ' status NOT changed to ' + newStatus);
			}
		);
	}

	this.getProjectById = function(project_id) {
		var deferred = $q.defer();
		sqlTransaction('SELECT * FROM projects where project_id = ?', [project_id], function(tx, resp) {
				deferred.resolve(transformRows(resp.rows)[0]);
			},deferred.reject);
		return deferred.promise;
	};

	this.getAllLocalProjects = function() {
		var deferred = $q.defer();
		sqlTransaction('SELECT * FROM projects', [], function(tx, resp) {
				deferred.resolve(transformRows(resp.rows));
			},deferred.reject);
		return deferred.promise;
	};

	this.deleteProject = function(project_id) {
		var deferred = $q.defer();

		console.log('1 isEmulator: ' + isEmulator + ' deleting submission for project_id: ' + project_id);
		
		//TODO This needs to be improved.
		sqlTransaction('DELETE FROM submissions where project_id=?', [project_id], function(tx, resp) {
				console.log('Submissions of the project deleted: ' + project_id);
			}, deferred.reject);

		sqlTransaction('DELETE FROM projects WHERE project_id = ? ', [project_id], function(tx, resp) {
				console.log('Project deleted succssfully: ' + project_id);
				deferred.resolve();
			}, deferred.reject);
		return deferred.promise;
	};

	this.getCountOfSubmissions = function(project_id) {
		var deferred = $q.defer();
		sqlTransaction('select count(*) as total FROM submissions where project_id = ?',[project_id],function(tx, resp) {
				deferred.resolve(resp.rows.item(0).total);
			},deferred.reject);
		return deferred.promise;
	};

	this.getAllProjectSubmissions = function(project_id, offset, limit) {
		var deferred = $q.defer();
			sqlTransaction('SELECT * FROM submissions WHERE project_id = ? limit ? offset ?', [project_id,limit,offset],
				 function(tx, resp) {
					var s = transformRows(resp.rows);
					for (var i=0;i<s.length;i++) {
						s[i].data = JSON.parse(s[i].data);
					}
					deferred.resolve(s);
				},function(tx,error){
					console.log(error)
					 deferred.reject(error);
				});
		return deferred.promise;
	};

	// used by download & enketo
	this.createSubmission = function(submission) {
		var deferred = $q.defer();
		var query ='INSERT INTO submissions (submission_uuid, version, status, is_modified, project_id, created, data, xml)'+
		'VALUES (?,?,?,?,?,?,?,?)';
		var values =[submission.submission_uuid, submission.version, submission.status, 1, submission.project_id,
			submission.created, submission.data, submission.xml];
		var onSuccess= function(tx, resp){
			submission.submission_id = resp.insertId;
			deferred.resolve(submission);
		};
		sqlTransaction(query, values, onSuccess, deferred.reject);
		return deferred.promise;
	};

	this.updateSubmissionStatus = function(submission_id, new_status) {
		sqlTransaction('UPDATE submissions SET status=? where submission_id = ?',
			[new_status, submission_id], function(tx, resp) {
				console.log('submission '+ submission_id + ' status updated to ' + new_status);
			}, function(e) {
				console.log('Cannot update the status of submission ' + submission_id);
		});
	};

	// used by enketo update
	this.updateSubmissionData = function(submission_id, submission) {
		var deferred = $q.defer();
			sqlTransaction('UPDATE submissions SET data=?, xml=?, created=? where submission_id = ?',
						[submission.data, submission.xml, submission.created, submission_id], function(tx, resp) {
							deferred.resolve();
						}, deferred.reject);
		return deferred.promise;
	};

	// used by post submission
	this.updateSubmissionMeta = function(submission) {
		var deferred = $q.defer();
		sqlTransaction('UPDATE submissions SET submission_uuid=?, version=?, status=?, is_modified=?, created=?'+
			'where submission_id = ?',
			[submission.submission_uuid, submission.version, submission.status, 0, submission.created,
			submission.submission_id], function(tx, resp) {
					deferred.resolve();
				}, deferred.reject);
		return deferred.promise;
	};

	this.updateSubmissionVersionAndStatus = function(submission_id, version, status) {
		var deferred = $q.defer();
		sqlTransaction('UPDATE submissions SET version=?, status=?, is_modified=? where submission_id = ?',
			[version, status, 1, submission_id], function(tx, resp) {
				deferred.resolve();
				}, deferred.reject);
		return deferred.promise;
	};

	this.updateSubmissionModified = function(submission_id,status) {
		var deferred = $q.defer();
		sqlTransaction('UPDATE submissions SET is_modified=? where submission_id = ?',
				[status, submission_id], function(tx, resp) {
					deferred.resolve();
				}, deferred.reject);
		return deferred.promise;
	};

	this.updateSubmission = function(submission_id, submission) {
		var deferred = $q.defer();
		sqlTransaction('UPDATE submissions SET submission_uuid=?, version=?, status=?, is_modified=?, data=?, xml=?,'+
			'created=? where submission_id = ?',
			[submission.submission_uuid, submission.version, submission.status, 1, submission.data, submission.xml,
			submission.created, submission_id], function(tx, resp) {
					deferred.resolve();
				}, deferred.reject);
		return deferred.promise;
	};

	this.getSubmissionById = function(submission_id) {
		var deferred = $q.defer();
		sqlTransaction('SELECT * FROM submissions where submission_id = ?', [submission_id], function(tx, resp) {
					if (resp.rows.length == 0)
						deferred.resolve();
					else {
						var dbSubmission = transformRows(resp.rows)[0];
						dbSubmission.data = JSON.parse(dbSubmission.data);
						deferred.resolve(dbSubmission);
					}
				},deferred.reject);
		return deferred.promise;
	};

	this.getSubmissionMetaByUuid = function(submission_uuid) {
		var deferred = $q.defer();
		sqlTransaction('SELECT submission_uuid FROM submissions where submission_uuid = ?', [submission_uuid], function(tx, resp) {
					deferred.resolve(resp.rows.length);
				},deferred.reject);
		return deferred.promise;
	};

	this.deleteSubmissions = function(submissions_ids) {
		var deferred = $q.defer();
		sqlTransaction('DELETE FROM submissions WHERE submission_id IN(' +
					submissions_ids.map(function() { return '?';}).join(',') + ')', submissions_ids, function(tx, resp) {
					deferred.resolve()
				}, function(tx ,error) {
					deferred.reject(error);
				});
		return deferred.promise;
	};

	this.deleteSubmission = function(submission_id) {
		var deferred = $q.defer();
		sqlTransaction('DELETE FROM submissions WHERE submission_id = ? ', [submission_id],
				function(tx, resp) {deferred.resolve()}, deferred.reject);
		return deferred.promise;
	};

	this.getSubmissionVersions = function(project_id) {
		var deferred = $q.defer();
		sqlTransaction('SELECT submission_uuid, version from submissions WHERE project_id = ? ', [project_id],
			function(tx, resp) {
				var s = transformRows(resp.rows);
				var ret = {};
				for (var i=0;i<s.length;i++) {
					ret[s[i].submission_uuid] = s[i].version;
				}
				deferred.resolve(ret);
			}, deferred.reject);
		return deferred.promise;
	};

	this.updateSubmissionsStatus = function(submission_uuids, status) {

		var deferred = $q.defer();
		sqlTransaction('UPDATE submissions SET status=? where ' +
				'submission_uuid IN(' + getParamHolders(submission_uuids) + ')',
				[status].concat(submission_uuids),
				deferred.resolve, deferred.reject);
		return deferred.promise;
	}

	this.updateSubmissionCreatedDate = function(submission_id, newDate) {
		var deferred = $q.defer();
		sqlTransaction('UPDATE submissions SET created=? where submission_id = ?)',
				[newDate,submission_id],
				deferred.resolve, deferred.reject);
		return deferred.promise;
	};

	var getParamHolders = function(paramArray) {
		return paramArray.map(function() { return '?';}).join(',');
	}

	var transformRows = function(resultSet) {
		var rows = [];
		for (var i=0; i < resultSet.length; i++) {
			 rows.push(resultSet.item(i));
		}

		return angular.copy(rows);
	};
}]);
