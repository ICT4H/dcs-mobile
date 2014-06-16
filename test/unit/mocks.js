var mocks = {
	messageService: jasmine.createSpyObj('messageService', ['showLoading', 'hideLoadingWithErr']),

	userService: jasmine.createSpyObj('userService', ['getUsers']),

	authService: jasmine.createSpyObj('auth',['validateUser'])
};
mocks.messageService.hideAll = function() {};


mocks.userService.getUsers.andReturn( { then:function(deThen) { deThen([{user_name:'user_name', url:'url'}]); } } );


mocks.authService.validateUser.andReturn({then: function(resolve,reject) {resolve();}});
