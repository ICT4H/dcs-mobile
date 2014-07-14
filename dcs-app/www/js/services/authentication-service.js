dcsApp.service('auth', ['$rootScope', '$q', 'userService', 'localStore', function($rootScope, $q, userService, localStore) {

    var currentUser = {};


    this.validateLocalUser = function(user) {
        currentUser = user;
        return checkDBFileExists(user)
            .then(userService.updateUrl)
            .then(localStore.init)
            .then(localStore.createStore);
    }

    this.createValidLocalStore = function(user) {
        currentUser = user;
        return serverAuth(user)
            .then(userService.createUser)
            .then(userService.updateUrl)
            .then(localStore.init)
            .then(localStore.createStore);
    }

    this.changePassword = function() {
        // get user key from server
        // fail if user credentails not matched
        // delete user_detail_db and create new db with new user password as key

    }
    this.logout = function() {
        delete currentUser;
    };

    this.isLoggedIn = function() {
        return angular.isDefined(currentUser);
    };
    this.getCurrentUser = function() {
        return currentUser;
    }

    var checkDBFileExists = function(user) {

        var deferred = $q.defer();

        if (isEmulator) {
            deferred.resolve(user);
            return deferred.promise;
        }

        window.resolveLocalFileSystemURL(cordova.file.applicationStorageDirectory + 
            '/databases/'+convertToSlug(user.name)+'.db', gotFileEntry, fail);

        function gotFileEntry(fileEntry) {
            console.log('dbfile found' + cordova.file.applicationStorageDirectory);
            deferred.resolve(user);
        }


        function fail(evt) {
            deferred.reject();
            console.log('local db not exisits' + cordova.file.applicationStorageDirectory);
        }

        return deferred.promise;
    };

    var serverAuth = function(user) {
        var deferred = $q.defer();

        console.log('trying to auth from server')
        $rootScope.httpRequest('/client/auth/')
            .then(function() {
                console.log('server auth pass');
                deferred.resolve(user);
            }, deferred.reject);

        return deferred.promise;
    }

}]);
