dcsApp.service('userService', [function() {
	var store = {};
	var dbName = 'USER-STORE'; // TODO appropriate name?
	var version = '1.0';
	var db;

	// drop TABLE projects ; DROP TABLE submissions ;
	if (window.sqlitePlugin)

		db = window.sqlitePlugin.openDatabase({name: dbName, bgType: 1})
	else
		db = window.openDatabase(dbName, version, dbName, -1);

	//tx.executeSql('DROP TABLE IF EXISTS projects');

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
	this.getDetails = function() {
		return new Promise(function(resolve, reject) {
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM users', [], function(tx, resp) {
					resolve(transformRows(resp.rows));
				},reject);
			});
		});
	};
	var transformRows = function(resultSet) {
		var rows = [];
		for (var i=0; i < resultSet.length; i++) {
			 rows.push(resultSet.item(i));
		}
		return rows;
	};
}]);
