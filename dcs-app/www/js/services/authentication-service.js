dcsApp.service('auth', ['$q', 'userService', 'localStore', function($q, userService, localStore) {

    var currentUser = {};


    this.validateLocalUser = function(user) {
        currentUser = user;
        return checkDBFileExists(user).then(localStore.init);
    }

    this.createValidLocalStore = function(user) {
        currentUser = user;
        return serverAuth(user)
            .then(userService.createUser)
            .then(localStore.init);
    }

    this.changePassword = function() {
        // get user key from server
        // fail if user credentails not matched
        // delete user_detail_db and create new db with new user password as key

    }

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

        if (user.name == 'tester150411@gmail.com') {
            console.log('server auth pass');
            deferred.resolve(user);
        } else {
            console.log('server auth failed');
            deferred.reject();
        }

        return deferred.promise;
    }

}]);
