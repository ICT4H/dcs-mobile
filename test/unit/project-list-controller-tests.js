describe('project list controller', function() {
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
        controller('projectListController', locals);
    }));
    
    it('should list all local projects', function() {
     expect(mocks.messageService.showLoadingWithInfo).toHaveBeenCalledWith('Loading projects');
     expect(mocks.localStore.getAllLocalProjects).toHaveBeenCalled();
     expect(mocks.messageService.hideAll).toHaveBeenCalled();
    });

    it('should add \'both\' status on project download', function() {
        var project2 = mocks.createProject(2);
        
        scope.downloadProject(project2);

        expect(project2.status).toBe('both');
        expect(mocks.localStore.createProject).toHaveBeenCalled();

    });

    it('should add server status for projects that are not stored locally', function() {
        expect(scope.projects.length).toBe(1);

        scope.$refreshContents();

        expect(scope.projects.length).toBe(2);
        expect(scope.projects[1].status).toBe('server');
    });

    it('should change project status to SERVER on project delete ', function() {

        navigator.notification = {confirm : function(dummy, onConfirm) {
            var BUTTON_YES = 2;
            onConfirm(BUTTON_YES);
        }};

        
        scope.deleteProject(scope.projects[0]);

        expect(scope.projects[0].status).toBe('server');
    });
});
