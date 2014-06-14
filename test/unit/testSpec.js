var isEmulator = true;
describe('login controller', function(){

 	var scope;
 	var controller;
 	var rootScope;
 	var userServiceMock
    beforeEach(angular.mock.module('dcsApp'));
    
    beforeEach(angular.mock.inject(function($rootScope, $controller) {
        rootScope = $rootScope.$new();
        scope = rootScope.$new();
        controller = $controller;
        userServiceMock = jasmine.createSpyObj('userService', ['getUsers']);
    }));
      
    it('should show prefilled username and url', function() {
        userServiceMock.getUsers.andReturn( { then:function(deThen) { deThen([{user_name:'user_name', url:'url'}]); } } );

        controller('loginController', {$scope: scope, $rootScope: rootScope, userService: userServiceMock});

        expect(scope.user.name).toBe('user_name');
        expect(scope.user.serverUrl).toBe('url');
    });

    it('should display error when unable to connect to local db', function() {
        var messageService = jasmine.createSpyObj('messageService', ['showLoading', 'hideLoadingWithErr']);
        userServiceMock.getUsers.andReturn( { then:function(dummy, deThen) { deThen('error'); } } );

        controller('loginController', {$scope: scope, $rootScope: rootScope, userService: userServiceMock, messageService: messageService});

        expect(messageService.showLoading).toHaveBeenCalled();
        expect(messageService.hideLoadingWithErr).toHaveBeenCalled();
    });

});
