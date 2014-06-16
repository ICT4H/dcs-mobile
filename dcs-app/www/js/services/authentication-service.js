dcsApp.service('auth', ['userService', 'localStore', function(userService, localStore) {
    var validLocalUserDetails = function(options) {
		return localStore.openDB(options.userName, options.password);
    };

    var authAndCreateLocalUser = function(options) {
		//TODO chk valid server user also initially
		return userService.createUser(options)
			.then(localStore.init);
    };
    this.validateUser = function(options) {
        return new Promise(function(resolve, reject) {
			validLocalUserDetails(options)
				.then(resolve,
				function(userNotFound) {
					authAndCreateLocalUser(options)
					.then(resolve,
					function(serverAuthFailed) {
						rejct('Not valid local or server user');
					});
				}
			);
	    });
    };
}]);
