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

    var userDao = {
      getUsers: function() {},
      createTable: function() {}

    }; 

    var msg = {
      showLoading: function() {},
      hideAll: function() {},
      hideLoadingWithErr: function() {}
    }; 

    var settings = {
    	user: undefined,
    	isAuthenticated: false
    };

    var auth = {
    	validateUser: function() {},
    	createValidLocalStore: function(){}
    };

    beforeEach(inject(function($q) {
    	q = $q;
		spyOn(msg, 'showLoading');
		spyOn(msg, 'hideAll');
		spyOn(msg, 'hideLoadingWithErr');
		spyOn(userDao, 'getUsers').andReturn(getPromise([{name: 'abc', password:'', url: 'https://172.18.29.3'}]));
		spyOn(userDao, 'createTable').andReturn(getPromise());
		spyOn(location, 'path');
    }));

	beforeEach(inject(function($rootScope, $controller){
		scope = $rootScope.$new();
      	ctrl = $controller(loginController, {
        	$scope: scope,
        	$location: location,
			userDao: userDao,
			auth: auth,
			msg: msg,
			settings: settings
      	});
	}));

	describe('Login Controller Load', function(){
		it('should have new option in the user list', function(){
			expect(msg.showLoading).toHaveBeenCalled();
			expect(scope.users.length).toBe(1);
		});

		it('should be able to list users if registered', function(){
			expect(scope.users.length).toBe(1);
			expect(userDao.createTable).toHaveBeenCalled();
			scope.$apply();
			expect(userDao.getUsers).toHaveBeenCalled();
			scope.$apply();
			expect(scope.users.length).toBe(2);
		});

		it('should set current user as last login user', function(){
			scope.$apply();
			expect(scope.users.length).toBe(2);
			expect(scope.currentUser.name).toBe(scope.users[scope.users.length-1].name);
			expect(msg.hideAll).toHaveBeenCalled();
		});
	});

	describe('New user login',function(){
		beforeEach(function() {
			settings.isAuthenticated = false;
			settings.user = undefined;
		});

		it('should verify new login crendials', function() {
			expect(settings.user).toBe(undefined);
			expect(settings.isAuthenticated).toBe(false);
			spyOn(auth, 'createValidLocalStore').andReturn(getPromise([]));
			scope.newUser(user);
			expect(settings.user).toBe(user);
			expect(auth.createValidLocalStore).toHaveBeenCalledWith(user);
			scope.$apply();
			expect(settings.isAuthenticated).toBe(true);
			expect(location.path).toHaveBeenCalledWith('/local-project-list');
		});

		it('should show error on new user login', function() {
			expect(settings.user).toBe(undefined);
			expect(settings.isAuthenticated).toBe(false);
			spyOn(auth, 'createValidLocalStore').andReturn(getPromiseThatWillFail("Invalid User"));
			scope.newUser(user);
			expect(settings.user).toBe(user);
			expect(auth.createValidLocalStore).toHaveBeenCalledWith(user);
			scope.$apply();
			expect(msg.hideLoadingWithErr).toHaveBeenCalledWith('Server authentication failed Invalid User');
			expect(settings.isAuthenticated).toBe(false);
		});
	});

	describe('Existing user login', function(){

		beforeEach(function() {
			settings.isAuthenticated = false;
			settings.user = undefined;
		});
		
		it('should login for authorized user', function(){
			expect(settings.user).toBe(undefined);
			expect(settings.isAuthenticated).toBe(false);
			spyOn(auth, 'validateUser').andReturn(getPromise());
			scope.existingUser(user);
			expect(auth.validateUser).toHaveBeenCalledWith(user);
			scope.$apply();
			expect(settings.user).toBe(user);
			expect(settings.isAuthenticated).toBe(true);
			expect(location.path).toHaveBeenCalledWith('/local-project-list');
		});

		it('should show error on unauthorized user', function() {
			expect(settings.user).toBe(undefined);
			expect(settings.isAuthenticated).toBe(false);
			spyOn(auth, 'validateUser').andReturn(getPromiseThatWillFail());
			scope.existingUser(user);
			expect(auth.validateUser).toHaveBeenCalledWith(user);
			expect(settings.user).toBe(user);
			scope.$apply();
			expect(msg.hideLoadingWithErr).toHaveBeenCalledWith('Invalid login details');
			expect(settings.isAuthenticated).toBe(false);
			expect(location.path).toHaveBeenCalledWith('/');
		});
	});
	
});