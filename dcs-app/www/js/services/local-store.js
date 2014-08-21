dcsApp.provider('store', function(){
	var usersStore;
	var userStore;
	var isSingleRecord = false;
	
	var openUsersStore = function(){
		var userDB = {name: "USER-STORE", pass: "secret1"};
		console.log("opening USER-STORE" );
		if (isEmulator)
			usersStore = window.openDatabase(userDB.name, '1.0', userDB.name , -1);
		else
			usersStore = window.sqlitePlugin.openDatabase({name: userDB.name, bgType: 1, key: userDB.pass});
		createUsersTable(usersStore);
	};

	var createUserTable = function(db){
		runOn(db, 'CREATE TABLE IF NOT EXISTS projects (project_uuid text primary key,'+
						'version text, status text, name text, xform text, headers text, local_headers text)', [], false, printResponse, printResponse);
		runOn(db, 'CREATE TABLE IF NOT EXISTS submissions (submission_id integer primary key, submission_uuid text,'+
						 'version text, status text, is_modified integer, project_uuid integer, created text, data text, xml text)', [], false, printResponse, printResponse);
		runOn(db, 'CREATE INDEX IF NOT EXISTS project_uuid_index ON submissions (project_uuid)', [], false, printResponse, printResponse);
	};

	var createUsersTable =  function(db){
		runOn(db, 'CREATE TABLE IF NOT EXISTS users (user_id integer primary key, user_name text NOT NULL UNIQUE, url text)', [], printResponse, printResponse);
	};

	var printResponse = function(response){
		console.log("Response: " + response);
	};

	var convertToSlug = function(text) {
    	return text
    	    .toLowerCase()
        	.replace(/[^\w-]+/g,'');
	};

	var transformRows = function(resultSet, isSingleRecord) {
		var rows = [];
		if(isSingleRecord && resultSet.length > 0)
			return angular.copy(resultSet.item(0));

		for (var i=0; i < resultSet.length; i++) 
			 rows.push(resultSet.item(i));
		
		return angular.copy(rows);
	};

	var runOn = function(db, query, values, isSingleRecord, resolve, reject){
		db.transaction(function(tx) {
			tx.executeSql(query, values, function(tx, resp){
				resolve(transformRows(resp.rows, isSingleRecord));
			},function(tx, error){
				reject(error);
			});
		});
	};

	return {
    	openUsersStore : openUsersStore,
		$get: function($q) {
					function openUserStore(userDB){
						var deferred = $q.defer();
						console.log("opening user:" + userDB.name + "db");
						if (isEmulator)
							userStore = window.openDatabase(convertToSlug(userDB.name), '1.0', convertToSlug(userDB.name), -1);
						else
							userStore = window.sqlitePlugin.openDatabase({name: convertToSlug(userDB.name), bgType: 1, key: userDB.pass});
						createUserTable(userStore);
						deferred.resolve(userDB);
						return deferred.promise;
					};

					function execute(query, values, isSingleRecord) {
						var deferred = $q.defer();
						runOn(userStore, query, values, isSingleRecord, deferred.resolve, deferred.reject);
						return deferred.promise;
					};

					function executeUserQueries(query, values, isSingleRecord) {
						var deferred = $q.defer();
						runOn(usersStore, query, values, isSingleRecord, deferred.resolve, deferred.reject);
						return deferred.promise;
					};
			      return {
			      	openUserStore: openUserStore,
			        execute: execute,
			        executeUserQueries: executeUserQueries
			      };
    		}     
  };
});
