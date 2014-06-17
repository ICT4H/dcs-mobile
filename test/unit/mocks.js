var mocks = {
	messageService: jasmine.createSpyObj('messageService', ['showLoading', 'hideLoadingWithErr', 'hideAll', 'showLoadingWithInfo']),

	userService: jasmine.createSpyObj('userService', ['getUsers']),

	authService: jasmine.createSpyObj('auth',['validateUser']),

	dcsService: jasmine.createSpyObj('dcsService', ['getQuestionnaires']),

	localStore: jasmine.createSpyObj('localStore',['getAllLocalProjects'])
};

mocks.userService.getUsers.andReturn( { then:function(deThen) { deThen([{user_name:'user_name', url:'url'}]); } } );


mocks.authService.validateUser.andReturn({then: function(resolve,reject) {resolve();}});


mocks.localStore.getAllLocalProjects.andReturn({then: function(resolve,reject) {resolve(['localProject1','localProject2']);}});


mocks.dcsService.getQuestionnaires.andReturn({then: function(resolve,reject) {resolve(['ServerProject1']);}});