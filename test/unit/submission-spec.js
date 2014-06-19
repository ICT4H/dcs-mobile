describe('submission list controller', function() {
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

    it('should load local submissions', function() {
        controller('submissionListController', locals);

        expect(mocks.messageService.showLoadingWithInfo).toHaveBeenCalledWith('Loading submissions');
         expect(mocks.localStore.getAllProjectSubmissions).toHaveBeenCalled();
         expect(mocks.messageService.hideAll).toHaveBeenCalled();
        expect(scope.submissions.length).toBe(2);
    });

    it('should change status to server_deleted when submission is deleted over server', function() {
        controller('submissionListController', locals);
        
        scope.$refreshContents();
        console.log(scope.submissions.length);

        expect(scope.submissions[0].status).toBe(BOTH);
        expect(scope.submissions[1].status).toBe(SERVER_DELETED);
    });

    it('should change status to outdated when server has updated submission', function() {
        var changedSubmission = mocks.createSubmission(1,2);
        changedSubmission.version = 'v2';
        mocks.dcsService.getAllSubmissions.andReturn({then: function(resolve, reject) {
            resolve( [mocks.createSubmission(1,1), changedSubmission] );
        }});
        controller('submissionListController', locals);

        scope.$refreshContents();

        expect(scope.submissions[1].status).toBe(OUTDATED);
    });
});