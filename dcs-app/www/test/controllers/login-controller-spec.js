describe('login controller', function() {
	var scope, q, ctrl;
	var	user = {name:'abc', url:'https://172.29.18.3', password: 'abc'};

    var getPromise = function(response) {
      response = response || '';
      var deferred = q.defer();
      deferred.resolve(response);
      return deferred.promise;
    };

   var getPromiseThatWillFail = function(failureReason) {
      failureReason = failureReason || '';
      var deferred = q.defer();
      deferred.reject(failureReason);
      return deferred.promise;
    };
    
    var location = {
      path: function() {}
    };

    var dcsService = {
      verfiyUser: function() {}
    };

    var userDao = {
      addUser: function() {},
      createRegister: function() {},
      getUsers: function() {}
    }; 

    var msg = {
      showLoading: function() {},
      hideAll: function() {},
      hideLoadingWithErr: function() {}
    }; 

    var app = {
    	user: undefined,
    	isAuthenticated: false
    };


    beforeEach(inject(function($q) {
      q = $q;
      spyOn(userDao, 'createRegister').andReturn(getPromise([]));
      spyOn(userDao, 'getUsers').andReturn(getPromise([]));
    }));

	beforeEach(inject(function($rootScope, $controller){
		scope = $rootScope.$new();
      	ctrl = $controller(loginController, {
        	$scope: scope,
        	$location: location,
    			userDao: userDao,
          dcsService: dcsService,
    			msg: msg,
    			app: app
      	});
	}));

	it('should', function(){
		expect(1).toBe(1);
	});
	
});