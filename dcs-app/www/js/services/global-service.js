dcsApp.service('app', ['$q', '$http', function($q, $http){
    this.user = {'name':'', 'password': '', 'serverUrl':''};
    this.isAuthenticated = false;

	this.httpRequest = function(uri){
		var deferred = $q.defer();
        user = this.user;
        console.log('calls user name: ' + user.name + '; url: ' + user.url + uri + "password: " +user.password);
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);
                
        $http.get(user.url + uri).success(function(response) {
            console.log("Success: " + uri);
            deferred.resolve(response);
        }).error(function(data, status, headers, config) {
            console.log("failed: " + uri);
            deferred.reject(status);
        });
        return deferred.promise;
	};

    this.httpPostRequest = function(uri, data) {
        var deferred = $q.defer();
        user = this.user;
        console.log('calls user name: ' + user.name + '; url: ' + user.url + uri);
        $http.defaults.headers.post["Content-Type"] = "text/plain";
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);
        
        $http.post(user.url + uri, data).success(deferred.resolve).error(function(data, status, headers, config) {
            deferred.reject(status);
        });
        return deferred.promise;
    };
    
 //    this.convertToSlug = function(text) {
 //    	return text
 //    	    .toLowerCase()
 //        	.replace(/[^\w-]+/g,'');
	// };

}]);
