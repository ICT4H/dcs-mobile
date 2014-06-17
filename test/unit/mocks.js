
function DCSMocks() {
    
    var promise = {then: function(resolve,reject) {resolve();}};
	
	var mocks = {
	    messageService: jasmine.createSpyObj('messageService', ['showLoading', 'hideLoadingWithErr', 'hideAll', 'showLoadingWithInfo', 'hideLoadingWithInfo']),
	    userService: jasmine.createSpyObj('userService', ['getUsers']),
	    authService: jasmine.createSpyObj('auth',['validateUser']),
	    dcsService: jasmine.createSpyObj('dcsService', ['getQuestionnaires', 'getQuestion']),
	    localStore: jasmine.createSpyObj('localStore',['getAllLocalProjects', 'createProject', 'deleteProject'])
	};

    mocks.userService.getUsers.andReturn( { then:function(deThen) { deThen([{user_name:'user_name', url:'url'}]); } } );

    mocks.authService.validateUser.andReturn(promise);

    mocks.localStore.deleteProject.andReturn(promise);

    mocks.dcsService.getQuestionnaires.andReturn({then: function(resolve,reject) {
        resolve(
            [
                {
                    "name": "project-1", 
                    "project_uuid": "prj-uuid-1", 
                    "version": "prj-1-ver-1"
                }, 
                {
                    "name": "project-2", 
                    "project_uuid": "prj-uuid-2", 
                    "version": "prj-1-ver-1"
                }
            ]
        );
    }});

    mocks.dcsService.getQuestion.andReturn({then: function(resolve,reject) {
        return mocks.localStore.createProject();
    }});

    mocks.localStore.getAllLocalProjects.andReturn({then: function(resolve,reject) {
        resolve(
            [
                {
                    "id": 1,
                    "name": "project-1", 
                    "project_uuid": "prj-uuid-1", 
                    "version": "prj-1-ver-1",
                    "status": "both"
                }
            ]
        );
    }});

    mocks.localStore.createProject.andReturn({then: function(resolve,reject) {
        resolve(2);
    }});

    return mocks;
}