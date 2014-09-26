dcsApp.service('store',['$q', function($q){
	var usersStore;
	var userStore;
	var isSingleRecord = false;
	
	this.createUserRegister =  function(){
		return openUsersStore()
		.then(runOn(usersStore, 'CREATE TABLE IF NOT EXISTS users (user_id integer primary key, name text NOT NULL UNIQUE, url text)',
			 		[], false));
	};

	this.createUserSpace = function(user){
		return openUserStore(user) 
		.then(runOn(userStore, 'CREATE TABLE IF NOT EXISTS projects (project_uuid text primary key,'+
						'version text, status text, name text, xform text, headers text, local_headers text)', [], false))
		.then(runOn(userStore, 'CREATE TABLE IF NOT EXISTS submissions (submission_id integer primary key, submission_uuid text,'+
						 'version text, status text, is_modified integer, project_uuid integer, created text, data text, xml text,'+
						 'new_files_added text, un_changed_files text)', [], false))
		.then(runOn(userStore, 'CREATE INDEX IF NOT EXISTS project_uuid_index ON submissions (project_uuid)', [], false));
	};

	this.execute = function(query, values, isSingleRecord) {
		return runOn(userStore, query, values, isSingleRecord);
	};

	this.init =  function(user) {
		var dbName = convertToSlug(user.name);
		var deferred = $q.defer();

		if (isEmulator) {
			db = window.openDatabase(dbName, version, dbName, 1);
			deferred.resolve(user);
			return deferred.promise;
		}

		db = window.sqlitePlugin.openDatabase({name: dbName, bgType: 1, key: user.password}, function() {
			console.log('_getDB success');
			deferred.resolve(user);
		},deferred.reject);

		return deferred.promise;
	};

	this.executeUserQueries = function(query, values, isSingleRecord) {
		return runOn(usersStore, query, values, isSingleRecord);
	};

	var openUsersStore = function(){
		var deferred = $q.defer();
		var userDB = {name: "USER-STORE", pass: "secret1"};
		if (isEmulator) {
			usersStore = window.openDatabase(userDB.name, '1.0', userDB.name , -1);
			deferred.resolve(userDB);
		}
		else {
			usersStore = window.sqlitePlugin.openDatabase({name: userDB.name, bgType: 1, key: userDB.pass}, function() {
				deferred.resolve(userDB);
			}, deferred.reject);
		}	
		return deferred.promise;
	};

	var openUserStore = function(userDB){
		var deferred = $q.defer();
		if (isEmulator) {
			userStore = window.openDatabase(convertToSlug(userDB.name), '1.0', convertToSlug(userDB.name), -1);
			deferred.resolve(userDB);			
		}
		else
		{
			console.log(userDB);
			userStore = window.sqlitePlugin.openDatabase({name: convertToSlug(userDB.name), bgType: 1, key: userDB.password}, function() {
				console.log("created: " + userDB.name);
				deferred.resolve(userDB);
			},function(error) {
				console.log("Error" + error);
			});
		}
		return deferred.promise;
	};

	var convertToSlug = function(text) {
    	return text
    	    .toLowerCase()
        	.replace(/[^\w-]+/g,'');
	};

	var transformRows = function(resultSet, isSingleRecord) {
		var rows = [];
		console.log('in transformRows');
		if(isSingleRecord && resultSet.length > 0) {
			console.log('resultString: ' + JSON.stringify(resultSet.item(0)) );
			return angular.copy(resultSet.item(0));
		}
		
		for (var i=0; i < resultSet.length; i++) {
			console.log('resultString: ' + JSON.stringify(resultSet.item(i)) );
			 rows.push(resultSet.item(i));
		}
		return angular.copy(rows);
	};

	var runOn = function(db, query, values, isSingleRecord){
		var deferred = $q.defer();
		db.transaction(function(tx) {
			tx.executeSql(query, values, function(tx, resp){
				console.log("success: " + query);
				deferred.resolve(transformRows(resp.rows, isSingleRecord));
			},function(tx, error){
				console.log("fail: ");
				console.log(error);
				deferred.reject(error);
			});
		});
		return deferred.promise;
	};

}]);
