dcsApp.service('globalService', ['$q', 'settings', '$http', function($q, settings, $http){
	this.httpRequest = function(uri){
		var deferred = $q.defer();
        user = settings.user;
        console.log('calls user name: ' + user.name + '; url: ' + user.serverUrl + uri);
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);
        $http.get(user.serverUrl + uri).success(deferred.resolve).error(function(data, status, headers, config) {
            deferred.reject(status);
        });
        return deferred.promise;
	};

    this.httpPostRequest = function(uri, data) {
        var deferred = $q.defer();
        user = settings.user;
        console.log('calls user name: ' + user.name + '; url: ' + user.serverUrl + uri);
        $http.defaults.headers.post["Content-Type"] = "text/plain";
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);
        
        $http.post(user.serverUrl + uri, data).success(deferred.resolve).error(function(data, status, headers, config) {
            deferred.reject(status);
        });
        return deferred.promise;
    };

    this.convertToSlug = function(text) {
    	return text
    	    .toLowerCase()
        	.replace(/[^\w-]+/g,'');
	};

}]);

dcsApp.value('settings', {
    user : {'name':'', 'password': '', 'serverUrl':''},
    isAuthenticated : false,
    userStore: undefined
});

