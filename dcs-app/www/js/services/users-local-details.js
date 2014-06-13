dcsApp.service('auth', ['userService', 'localStore', function(userService, localStore) {
    return function(userName, password, server) { 
        return new Promise(function(resolve, reject) {
				userService.getUserByName(userName).then(function() {

					localStore.openDB(userName, password).then(function() {
						console.log('You are authenticated to use local data store');
						resolve(true);
					}, function(e) {
						console.log('Failed to use local data store');
						reject();
					});
						
					// reject is not
				}, function(userNotFound) {
					console.log('Either userName not found or local user store is not accessible (userNotFount): ');
					if (userNotFound) {
				        userService.createUser(userName, server).then(function() {
							localStore.init(userName, password).then(function() {
								console.log('You are authenticated to use local data store for first time');
								resolve(true);
							}, function(e){
								console.log('Failed to create local data store');
								reject();
							});
			        	
			        	},function(e) {
			        		console.log('Failed to create user details');
			        	});
					}
				});
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
	
	this.createUser = function(name, url) {
		return new Promise(function(resolve, reject) {
			db.transaction (function(tx) {
				tx.executeSql(
					'INSERT INTO users (user_name, url) VALUES (?,?)', [name, url],
					function(tx, resp){
						resolve(resp.insertId);
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
