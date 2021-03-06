dcsApp.service('store',['$q', 'app', function($q, app){
	var stores = {'userMetaStore': undefined, 'usersStore': undefined, 'userStore': undefined};
	var isSingleRecord = false;
	var user;

	this.createUserRegister =  function(){
		return createOrOpen('usersStore', "USER-STORE", "secret1")
		.then(this.executeUserQueries('CREATE TABLE IF NOT EXISTS users (user_id integer primary key, name text NOT NULL UNIQUE, url text)', [], false));
	};
		
	this.createUserMetaSpace = function() {
		user = app.user;
		return createOrOpen('userMetaStore', convertToSlug(user.name)+"Meta", user.password);
	};

	this.createUserSpace = function(response){
		return createOrOpen('userStore', convertToSlug(user.name), response)
		.then(this.execute('CREATE TABLE IF NOT EXISTS projects (project_uuid text primary key,version text,'+
						'created text, status text, name text, xform text, headers text, local_headers text, last_fetch integer,'+
						'project_type text, parent_uuid text, action_label text, parent_fields_code_label_str text, child_ids text,'+
						'has_media_field text, last_updated text, is_assigned text, displayable_mobile_fields)', [], false))
		.then(this.execute('CREATE INDEX IF NOT EXISTS is_assigned_index ON projects (is_assigned)', [], false))
		.then(this.execute('CREATE INDEX IF NOT EXISTS child_ids_index ON projects (child_ids)', [], false))

		.then(this.execute('CREATE TABLE IF NOT EXISTS submissions (submission_id integer primary key, submission_uuid text,'+
						 'version text, status text, project_uuid text, created text, data text, xml text,'+
						 'new_files_added text, un_changed_files text)', [], false))
		.then(this.execute('CREATE INDEX IF NOT EXISTS project_uuid_index ON submissions (project_uuid)', [], false))
		.then(this.execute('CREATE INDEX IF NOT EXISTS data_status_index ON submissions (status)', [], false));
	};

	this.executeUserQueries = function(query, values, isSingleRecord) {	
		return runOn('usersStore', query, values, isSingleRecord);
	};

	this.execute = function(query, values, isSingleRecord) {
		return runOn('userStore', query, values, isSingleRecord);
	};

	this.executeMetaQueries = function(query, values, isSingleRecord) {
		return runOn('userMetaStore', query, values, isSingleRecord);
	};

	this.executeMultipleQueries = function(queries) {
		var deferred = $q.defer();
		var queryPromises = [];
		var response = {};

		queries.map(function(query) {
			queryPromises.push(runOn('userStore', query.statement, query.values || [], query.isSingleRecord));
		});

		$q.all(queryPromises).then(function(results){
			results.map(function(result, index) {
				if(result instanceof Array) {
					var key = queries[index].holder || "item" + index;
					response[key] = result;
				} else
					angular.extend(response, result);
			});
			deferred.resolve(response);
		}, deferred.reject);
		return deferred.promise;
	};

	this.changeDBKey = function(user) {
		var dbName = convertToSlug(user.name) + "Meta";
		var deferred = $q.defer();

		if(isEmulator) {
			stores['userMetaStore'] = window.openDatabase(dbName, '1.0', name, -1);
			deferred.resolve(user);
			return deferred.promise;
		}

		window.sqlitePlugin.deleteDatabase(dbName, function() {
			createOrOpen("userMetaStore",  convertToSlug(user.name)+"Meta", user.password).then(function() {
				deferred.resolve(user);
			}, deferred.reject);
		}, deferred.reject);

		return deferred.promise;
	};

	var createOrOpen = function(store, name, dbKey) {
		var deferred = $q.defer();
		if (isEmulator) {
			stores[store] = window.openDatabase(name, '1.0', name, -1);
			deferred.resolve(user);			
		}
		else {
			stores[store] = window.sqlitePlugin.openDatabase({name: name, bgType: 1, key: dbKey}, function() {
				deferred.resolve(user);
			}, deferred.reject);
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
		if(isSingleRecord && resultSet.length > 0) 
			return angular.copy(resultSet.item(0));
	
		for (var i=0; i < resultSet.length; i++) 
			 rows.push(resultSet.item(i));
		return angular.copy(rows);
	};

	var runOn = function(store, query, values, isSingleRecord){
		var deferred = $q.defer();
		stores[store].transaction(function(tx) {
			tx.executeSql(query, values, function(tx, resp){
				console.log("success: " + query);
				deferred.resolve(transformRows(resp.rows, isSingleRecord));
			},function(tx, error){
				console.log("fail: " + query);
				console.log(error);
				deferred.reject(error);
			});
		});
		return deferred.promise;
	};

}]);
