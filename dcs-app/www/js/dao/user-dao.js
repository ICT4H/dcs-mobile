dcsApp.service('userDao', ['store', function(store){
    var that = this;
	this.addUser = function(response, user) {
		return store.executeUserQueries('INSERT INTO users (name, url) VALUES (?,?)', [user.name, user.url])
        .then(store.createUserMetaSpace)
        .then(function() {
            return store.executeMetaQueries('CREATE TABLE IF NOT EXISTS meta (name text, password text NOT NULL)', [], false);
        })
        .then(function() { 
            return store.executeMetaQueries('INSERT INTO meta(name, password) VALUES (?,?)', [user.name, atob(response.hash)]);
        })
        .then(function() {
            return that.openUserStore(user);
        });
    };

    this.createRegister = function() {
    	return store.createUserRegister();
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

    this.openUserStore = function(user) {
    	return store.createUserMetaSpace(user)
        .then(function() {
            return store.executeMetaQueries('SELECT password FROM meta where name = ?', [user.name], true)
                .then(function(result) {
                    return store.createUserSpace(result.password);
                });
        });
    };

    this.updateNewPassword = function(user, response) {
    	return store.changeDBKey(user)
        .then(function() {
            return store.executeMetaQueries('CREATE TABLE IF NOT EXISTS meta (name text, password text NOT NULL)', [], false)
            .then(function() {
                return store.executeMetaQueries('INSERT INTO meta(name, password) VALUES (?,?)', [user.name, atob(response.hash)]);
            });
        });
    };

    var convertToSlug = function(text) {
        return text
            .toLowerCase()
            .replace(/[^\w-]+/g,'');
    };
}]);	