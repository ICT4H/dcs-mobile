dcsApp.service('userService', ['$q', function($q) {
	var store = {};
	var dbName = 'USER-STORE'; // TODO appropriate name?
	var version = '1.0';
	var db;

	if (isEmulator)
		db = window.openDatabase(dbName, version, dbName, -1);
	else
		db = window.sqlitePlugin.openDatabase({name: dbName, bgType: 1, key: 'secret1'});

	db.transaction (function(tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS users (user_id integer primary key, user_name text, url text)');
	});
	
	this.createUser = function(user) {
    	var deferred = $q.defer();
			db.transaction (function(tx) {
				tx.executeSql(
					'INSERT INTO users (user_name, url) VALUES (?,?)', [user.name, user.serverUrl],
					function(tx, resp){
						deferred.resolve(user);
					}, deferred.reject
				);
			});
		return deferred.promise;
    };

	this.updateUserName = function(old_user_name, new_user_name) {
		db.transaction (function(tx) {
			tx.executeSql('UPDATE users set (user_name) VALUES (?) where user_name = ?', 
					[new_user_name, old_user_name]);
		});
	};

	this.updateUrl = function(user_name, new_url) {
		db.transaction (function(tx) {
			tx.executeSql('UPDATE users set (url) VALUES (?) where user_name = ?', 
					[new_url, user_name]);
		});
	};

	this.getUsers = function() {
    	var deferred = $q.defer();
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM users', [], function(tx, resp) {
					deferred.resolve(transformRows(resp.rows));
				},deferred.reject);
			});
		return deferred.promise;
    };
	this.getUserByName = function(userName) {
    	var deferred = $q.defer();
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM users WHERE user_name = ?', [userName], function(tx, resp) {
					if(resp.rows.length >= 1)
						deferred.resolve(resp.rows.item(0));
					else
						deferred.reject(true); // user not found
				}, function(e) {
					deferred.reject(false);
				});
			});
		return deferred.promise;
    };

	var transformRows = function(resultSet) {
		var rows = [];
		for (var i=0; i < resultSet.length; i++) {
			 rows.push(resultSet.item(i));
		}
		return rows;
	};
}]);
