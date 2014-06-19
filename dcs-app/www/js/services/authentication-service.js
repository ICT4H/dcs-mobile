dcsApp.service('auth', ['$q', 'userService', 'localStore', function($q, userService, localStore) {
    var validLocalUserDetails = function(options) {
		return localStore.openDB(options.userName, options.password);
    };

    var authAndCreateLocalUser = function(options) {
		//TODO chk valid server user also initially
		return userService.createUser(options)
			.then(localStore.init);
    };
    this.validateUser = function(options) {
    	var deferred = $q.defer();
			validLocalUserDetails(options)
				.then(deferred.resolve,
				function(userNotFound) {
					authAndCreateLocalUser(options)
					.then(deferred.resolve,
					function(serverAuthFailed) {
						deferred.reject('Not valid local or server user');
					});
				}
			);
	    return deferred.promise;
    };
}]);
