dcsApp.service('userDao', ['store', function(store){

	this.createUser = function(user) {
		return store.executeUserQueries('INSERT INTO users (name, url) VALUES (?,?)', [user.name, user.url]);
    };

    this.createTable = function(){
    	return store.createUsersTable();
    };

	this.updateUrl = function(user) {
		return store.executeUserQueries('UPDATE users set url=? where name = ?', [user.url, user.name]);
	};

	this.getUsers = function() {
		return store.executeUserQueries('SELECT * FROM users', []);
    };
    
	this.getUserByName = function(userName) {
		return store.executeUserQueries('SELECT * FROM users WHERE name = ?', [userName]);
    }; 

}]);	