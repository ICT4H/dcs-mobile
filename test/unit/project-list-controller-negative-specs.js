describe('project list controller -ive', function() {
    var controller;
    var rootScope;
    var scope;
    var locals;
    var mocks;

    beforeEach(angular.mock.module('dcsApp'));
    beforeEach(angular.mock.inject(function($rootScope, $controller) {
    	rootScope = $rootScope.$new();
        scope = rootScope.$new();
        mocks = new DCSMocks();
        locals = {$scope: scope, $rootScope: rootScope, dcsService: mocks.dcsService, localStore: mocks.localStore, messageService: mocks.messageService};
        controller = $controller;
    }));

    it('should give error if local project store is not accessible', function() {
        mocks.localStore.getAllLocalProjects.andReturn({then: function(resolve,reject) {reject();}});

        controller('projectListController', locals);

        expect(mocks.messageService.hideLoadingWithErr).toHaveBeenCalledWith('Unable to show local projects');
    });
    
    it('should change status to server_deleted when project is deleted over server', function() {
        mocks.dcsService.getQuestionnaires.andReturn({then: function(resolve,reject) {
            resolve(
                [
                    {
                        "name": "project-2",
                        "project_uuid": "prj-uuid-2",
                        "version": "prj-1-ver-1"
                    }
                ]
            );
        }});
        controller('projectListController', locals);

        scope.$refreshContents();

        expect(scope.projects.length).toBe(2);
        expect(scope.projects[0].status).toBe('server-deleted');
    });

});
