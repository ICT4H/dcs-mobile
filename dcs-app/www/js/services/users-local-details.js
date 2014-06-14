dcsApp.service('auth', ['userService', 'localStore', function(userService, localStore) {
    return function(options) {

	    var validLocalUserDetails = function(options) {
			return localStore.openDB(options.userName, options.password);
	    };

	    var authAndCreateLocalUser = function(options) {
			//TODO chk valid server user also initially
			return userService.createUser(options)
				.then(localStore.init);
	    };

        return new Promise(function(resolve, reject) {
			validLocalUserDetails(options)
				.then(resolve,
				function(userNotFound) {
					authAndCreateLocalUser(options).then(resolve,
					function(serverAuthFailed) {
						rejct('Not valid local or server user');
					});
				}
			);
	    });
    };
}]);

dcsApp.service('userService', [function() {
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
	
	this.createUser = function(options) {
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql(
					'INSERT INTO users (user_name, url) VALUES (?,?)', [options.userName, options.url],
					function(tx, resp){
						resolve(options);
					}, reject
				);
			});
		});
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
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM users', [], function(tx, resp) {
					resolve(transformRows(resp.rows));
				},reject);
			});
		});
	};

	this.getUserByName = function(userName) {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM users WHERE user_name = ?', [userName], function(tx, resp) {
					if(resp.rows.length >= 1)
						resolve(resp.rows.item(0));
					else
						reject(true); // user not found
				}, function(e) {
					reject(false);
				});
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
}]);
