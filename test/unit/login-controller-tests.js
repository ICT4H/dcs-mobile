describe('login controller', function(){
    var controller;
    beforeEach(angular.mock.module('dcsApp'));
        var rootScope;
        var scope;
        var mockedLocation;
        var locals;
        var mocks;

    beforeEach(angular.mock.inject(function($rootScope, $controller, $location) {
        rootScope = $rootScope.$new();
        scope = rootScope.$new();
        mockedLocation = jasmine.createSpyObj('$location',['path']);
        mocks = new DCSMocks();
        locals = {$scope: scope, $rootScope: rootScope, $location: mockedLocation, userService: mocks.userService, messageService: mocks.messageService, auth: mocks.authService};
        controller = $controller;
        $controller('loginController', locals);
    }));
      
    it('should show prefilled username and url on load', function() {

        expect(scope.user.name).toBe('user_name');
        expect(scope.user.serverUrl).toBe('url');
    });

    it('should display error when unable to connect to local db', function() {
        mocks.userService.getUsers.andReturn( { then:function(dummy, deThen) { deThen('error'); } } );
        controller('loginController',locals);
        expect(mocks.messageService.showLoading).toHaveBeenCalled();
        expect(mocks.messageService.hideLoadingWithErr).toHaveBeenCalled();
    });

    it('should open project list for valid user.', function() {
        var user = {name:'tester150411@gmail.com', password:'password', serverUrl:'localhost:8080'};
        scope.saveDetails(user);

        expect(mocks.messageService.showLoading).toHaveBeenCalled();
        expect(mocks.authService.validateUser).toHaveBeenCalledWith({userName: user.name, password: user.password, url: user.serverUrl});
        expect(rootScope.isAuthenticated).toBe(true);
        expect(mockedLocation.path).toHaveBeenCalledWith('/project-list');
    });

    it('should give error for invalid user.', function() {
        mocks.authService.validateUser.andReturn({then: function(resolve,reject) {reject();}});
        controller('loginController',locals);
        var user = {name:'tester150411@gmail.com', password:'password', serverUrl:'localhost:8080'};
        scope.saveDetails(user);

        expect(mocks.messageService.hideLoadingWithErr).toHaveBeenCalledWith('Invalid login details.');
    });

});
