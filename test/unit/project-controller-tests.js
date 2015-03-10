describe('local project list controller', function() {
    var controller;
    var rootScope;
    var scope;
    var locals;
    var mocks;
    //TODO remove hardcoding of dcs-app
    jasmine.getJSONFixtures().fixturesPath = "base/dcs-app/www/i18n/";
    var data = loadJSONFixtures('resourceBundle.json');

    angular.module('configModule', []);
    //TODO can this be also a mocked module
    // beforeEach(angular.mock.module('configModule'));

    beforeEach(angular.mock.module('dcsApp'));

    beforeEach(angular.mock.inject(function($q, $httpBackend, $rootScope, $controller) {
        this.$q = $q;
        initScope($rootScope);
        controller = $controller;
        mocks = new DCSMocks($q);
    }));

    function initScope($rootScope) {
        rootScope = $rootScope.$new();
        scope = rootScope.$new();
        rootScope.pageSizes = [];
        rootScope.pageSize = {value: 10};
        rootScope.resourceBundle = data['resourceBundle.json'];
    }

    it("should behave...", function() {
        expect(1).toBe(1);
    });


    xit('should list all local projects', function() {
        mocks.add_project_dao_spy_1_local_project();
        mocks.add_message_service_spy();
        locals = {
            $scope: scope,
            $rootScope: rootScope,
            projectDao: mocks.project_dao_with_1_local_project
        };
        controller('localProjectListController', locals);
        scope.$apply();

        expect(scope.projects.length).toEqual(1);
    });

    xit('should update local outdated project status and load local project', function() {
        mocks.add_project_dao_spy_1_local_project();
        mocks.add_message_service_spy();
        mocks.add_dcsService_spy_1_updated_server_project();
        locals = {
            $scope: scope,
            $rootScope: rootScope,
            projectDao: mocks.project_dao_with_1_local_project,
            dcsService: mocks.dcsService_with_1_updated_server_project,
            messageService: mocks.messageService
        };
        controller('localProjectListController', locals);
        
        scope.$sync();

        scope.$apply();        
        expect(mocks.project_dao_with_1_local_project.setprojectStatus).toHaveBeenCalledWith('1', 'OUTDATED');
        expect(mocks.project_dao_with_1_local_project.getProjects).toHaveBeenCalled();
    });
});
