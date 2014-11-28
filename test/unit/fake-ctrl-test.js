describe('login controller', function(){
    var controller;
    beforeEach(angular.mock.module('dcsApp'));
        var rootScope;
        var scope;
        var mockedLocation;
        var locals;
        var mocks;
        var q;

    var resourceBundle;

    beforeEach(angular.mock.inject(function($httpBackend, $rootScope, $controller, $location, $q) {
        emptyRourceBundle = {};
        jasmine.getJSONFixtures().fixturesPath = "base/i18n";
        $httpBackend.when("GET", 'i18n/resourceBundle.json').respond(emptyRourceBundle);

        var data = loadJSONFixtures('resourceBundle.json');
        $rootScope.resourceBundle = data['resourceBundle.json'];
        
        rootScope = $rootScope.$new();
        scope = rootScope.$new();
        controller = $controller;        
        rootScope.$apply();

        var mockedService = jasmine.createSpyObj('dummyService', ['bar']);
        mockedService.bar.and.returnValue($q.when('bar'));
        controller('fake-ctrl', {$scope: scope, dummyService: mockedService});
    }));
      
    it('should show prefilled username and url on load', function() {
        scope.$apply();
        
        expect(scope.foo).toBe('bar');
    });

});

