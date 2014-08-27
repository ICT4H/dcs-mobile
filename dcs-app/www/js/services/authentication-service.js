dcsApp.service('auth', ['globalService', '$q', 'userDao', 'store', function(app, $q, userDao, localStore) {

    this.currentUser = {};
    this.validateUser = function(user) {
        this.currentUser = user;
        return checkDBFileExists(user)
            .then(userDao.updateUrl)
            .then(function(response){
                return localStore.createUserTable(user);  
            });
    }

    this.createValidLocalStore = function(user) {
        this.currentUser = user;
        return serverAuth(user)
            .then(userDao.createUser)
            .then(function(response){
                return localStore.createUserTable(user);  
            });
    };

    this.logout = function() {
        delete this.currentUser;
    };

    this.isLoggedIn = function() {
        return angular.isDefined(this.currentUser);
    };

    var checkDBFileExists = function(user) {

        var deferred = $q.defer();

        if (isEmulator) {
            deferred.resolve(user);
            return deferred.promise;
        }

        window.resolveLocalFileSystemURL(cordova.file.applicationStorageDirectory + 
            '/databases/'+ app.convertToSlug(user.name)+'.db', gotFileEntry, fail);

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
        app.httpRequest('/client/auth/')
            .then(function() {
                console.log('server auth pass');
                deferred.resolve(user);
            }, deferred.reject);

        return deferred.promise;
    }

}]);
