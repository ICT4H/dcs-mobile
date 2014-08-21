dcsApp.service('userDao', ['store', function(store){

	this.createUser = function(user) {
		return store.executeUserQueries('INSERT INTO users (user_name, url) VALUES (?,?)', [user.name, user.serverUrl]);
    };

	this.updateUrl = function(user) {
		return store.executeUserQueries('UPDATE users set url=? where user_name = ?', [user.serverUrl, user.name]);
	};

	this.getUsers = function() {
		return store.executeUserQueries('SELECT * FROM users', []);
    };
    
	this.getUserByName = function(userName) {
		return store.executeUserQueries('SELECT * FROM users WHERE user_name = ?', [userName]);
    }; 

}]);	