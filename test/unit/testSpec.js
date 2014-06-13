var isEmulator = true;
describe('controllers', function(){

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
      
  	it('should show login', function() {
        userServiceMock.getUsers.andReturn( { then:function(deThen) { deThen([{user_name:'user_name', url:'url'}]); } } );
        controller('loginController', {$scope: scope, $rootScope: rootScope, userService: userServiceMock});
        expect(rootScope.loading).toBe(false);
    });

});
