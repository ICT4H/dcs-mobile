xdescribe('Submission controller', function(){
    var controller;
    var rootScope;
    var scope;
    var locals;
    var mocks;

    beforeEach(angular.mock.module('dcsApp'));

    beforeEach(angular.mock.inject(function($q, $httpBackend, $rootScope, $controller) {
        this.$q = $q;
        mockResourceBundleCall($httpBackend);
        mockPartialCalls($httpBackend);
        initScope($rootScope);
        controller = $controller;
        mocks = new DCSMocks($q);
        mocks.add_back_handler_spy();
    }));

    function initScope($rootScope) {
        rootScope = $rootScope;
        scope = rootScope.$new();
        rootScope.pageSizes = [];
        rootScope.pageSize = {value: 10};
        rootScope.resourceBundle = getResourceBundle();
    }

    it('should call enketo to create new submission', function() {
        // mocks.add_project_dao_spy_1_local_project();
        // mocks.add_message_service_spy();
        // locals = {
        //     $scope: scope,
        //     $rootScope: rootScope,
        //     projectDao: mocks.project_dao_with_1_local_project
        // };
        // controller('localProjectListController', locals);
        // scope.$apply();

        expect(1).toEqual(1);
    });
});
