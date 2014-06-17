var isEmulator = true;
describe('project list controller', function(){
    var controller;
    var rootScope;
    var scope;
    beforeEach(angular.mock.module('dcsApp'));
    beforeEach(angular.mock.inject(function($rootScope, $controller) {
    	rootScope = $rootScope.$new();
        scope = rootScope.$new();
        locals = {$scope: scope, $rootScope: rootScope, dcsService: mocks.dcsService, localStore: mocks.localStore, messageService: mocks.messageService};
        controller = $controller;
        $controller('projectListController', locals);
    }));
    
    it('should list all local projects', function() {
    	expect(mocks.messageService.showLoading).toHaveBeenCalledWith('Loading projects');
    	expect(mocks.localStore.getAllLocalProjects).toHaveBeenCalled();
    	expect(mocks.messageService.hideAll).toHaveBeenCalled();
    });

    it('should give error if local project are not present', function() {
		mocks.localStore.getAllLocalProjects.andReturn({then: function(resolve,reject) {reject();}});
        controller('projectListController', locals);
    	
    	expect(mocks.messageService.hideLoadingWithErr).toHaveBeenCalledWith('Unable to show local projects');
    });

    // it('should fetch server projects and update project list', function() {
    //     controller('projectListController', locals);
    	
    // 	scope.$refreshContents();
    // 	expect(mocks.messageService.showLoadingWithInfo).toHaveBeenCalled();//With('Fetching server projects');
    // });
});