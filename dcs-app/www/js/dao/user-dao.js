dcsApp.service('userDao', ['store', function(store){

	this.addUser = function(user) {
		return store.executeUserQueries('INSERT INTO users (name, url) VALUES (?,?)', [user.name, user.url])
		.then(store.createUserSpace(user));
    };

    this.createRegister = function() {
    	return store.createUserRegister();
    };

	this.updateUrl = function(user) {
		return store.executeUserQueries('UPDATE users set url=? where name = ?', [user.url, user.name])
		.then(store.createUserSpace(user));
	};

	this.getUsers = function() {
		return store.executeUserQueries('SELECT * FROM users', []);
    };
    
	this.getUserByName = function(userName) {
		return store.executeUserQueries('SELECT * FROM users WHERE name = ?', [userName]);
    }; 

}]);	