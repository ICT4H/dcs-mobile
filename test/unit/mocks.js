
function DCSMocks() {
    
    var promise = {then: function(resolve,reject) {resolve();}};
	
	var mocks = {
	    messageService: jasmine.createSpyObj('messageService', ['showLoading', 'hideLoadingWithErr', 'hideAll', 'showLoadingWithInfo', 'hideLoadingWithInfo']),
	    userService: jasmine.createSpyObj('userService', ['getUsers']),
	    authService: jasmine.createSpyObj('auth',['validateLocalUser']),
	    dcsService: jasmine.createSpyObj('dcsService', ['getQuestionnaires', 'getQuestion', 'getAllSubmissions']),
	    localStore: jasmine.createSpyObj('localStore',['getAllLocalProjects', 'createProject', 'getProjectById', 'updateProjectStatus', 'deleteProject', 'updateSubmissionStatus', 'getAllProjectSubmissions'])
	};

    mocks.userService.getUsers.andReturn( { then:function(deThen) { deThen([{user_name:'user_name', url:'url'}]); } } );

    mocks.authService.validateLocalUser.andReturn(promise);

    mocks.localStore.deleteProject.andReturn(promise);


    mocks.createProject = function(i) {
        return {
            "name": "project-" + i,
            "project_uuid": "prj-uuid-" + i,
            "version": "prj-" + i + "-ver-1"
        };
    }

    mocks.createLocalProject = function(i, status) {
        var project = mocks.createProject(i);
        project.id = i;
        project.status = status;

        return project;
    }
    
    mocks.createSubmission = function(pi, i) {
        return {
            "created": "2014-06-07T06:48:10.295258+00:00", 
            "project_uuid": "prj-uuid-" + pi, 
            "submission_uuid": "prj-uuid-" + pi + "-sub-uuid-" + i,
            "version": "prj-uuid-" + pi + "-sub-uuid-"+i+"-ver-1"
        };
    }

    mocks.createLocalSubmission = function(pi, i, status) {
        var submission = mocks.createSubmission(pi, i);
        submission.id = i;
        submission.status = status;
        return submission;
    }

    mocks.dcsService.getQuestionnaires.andReturn({then: function(resolve,reject) {
        resolve( [mocks.createProject(1),
            mocks.createProject(2),
            mocks.createProject(3)] );
    }});

    mocks.dcsService.getQuestion.andReturn({then: function(resolve,reject) {
        return mocks.localStore.createProject();
    }});

    mocks.localStore.getProjectById.andReturn({then: function(resolve,reject) {
        resolve( [mocks.createLocalProject(1, "both")] );
    }});

    mocks.localStore.getProjectById.andReturn({then: function(resolve,reject) {
        resolve( [mocks.createLocalProject(1, "both")] );
    }});

    mocks.localStore.createProject.andReturn({then: function(resolve,reject) {
    	var ANY_NUM = 1;
        resolve(ANY_NUM);
    }});

    mocks.localStore.getAllLocalProjects.andReturn({then: function(resolve,reject) {
        resolve( [mocks.createLocalProject(1, "both"),
            mocks.createLocalProject(2, "both")] );
    }});

    mocks.localStore.getAllProjectSubmissions.andReturn({then: function(resolve, reject) {
        resolve( [mocks.createLocalSubmission(1,1,'both'),
            mocks.createLocalSubmission(1,2,'both')] );
    }});

    mocks.dcsService.getAllSubmissions.andReturn({then: function(resolve, reject) {
        resolve( [mocks.createSubmission(1,1),
            mocks.createSubmission(1,2),
            mocks.createSubmission(1,3)] );
    }});

    return mocks;
}