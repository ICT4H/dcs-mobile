describe('backButtonService test', function(){
	
	var service;
	var location;
	var dService;

	beforeEach(module('dcsApp'));

	beforeEach(inject(function(backButtonService, $location, dialogService) {
		location = $location;
		service = backButtonService;
		dService = dialogService;
	}));

	it('service should ne initized', function() {
		
		service.init()
		
		expect(service.isSamePage).toEqual(false);
		expect(service.isBackClicked).toEqual(false);
		expect(service.urlMap).toEqual({});
	});

	it('should set isSamePage to false on different controller', function(){ 
		var next = {'controller'	:'projectListController'};
		var current = {'controller': 'submissionListController'};

		expect(service.isSamePage).toEqual(false);

		service.setController(current, next);
        
        expect(service.isSamePage).toEqual(false);
    });

	it('should set isSamePage to true on same controller', function(){ 
		var next = {'controller'	:'submissionListController'};
		var current = {'controller': 'submissionListController'};

		expect(service.isSamePage).toEqual(false);
		service.setController(current, next);
        
        expect(service.isSamePage).toEqual(true);
    });

	it('should set isSamePage to false on undefined next and previous', function(){ 
		expect(service.isSamePage).toEqual(false);
		service.setController(undefined, undefined);
        
        expect(service.isSamePage).toEqual(false);
    });

    it('should store url when different page is navigated', function() {
    	var current = {'controller'	:'projectListController'};
		var next = {'controller': 'submissionListController'};
		var expectedDict = {'/submission-list/1234567890':'/local-project-list'};
		
		expect(service.isSamePage).toEqual(false);
		
		service.setController(current, next);
    	service.setUrl('#/local-project-list', '#/submission-list/1234567890?isList=false');
    	
    	expect(service.isSamePage).toEqual(false);
    	expect(service.urlMap).toEqual(expectedDict);
    });

    it('should not store url when same page is navigated', function() {
    	var current = {'controller'	:'projectListController'};
		var next = {'controller': 'projectListController'};
		
		expect(service.isSamePage).toEqual(false);
		
		service.setController(current, next);
    	service.setUrl('#/local-project-list', '#/submission-list/1234567890?isList=false');
    	
    	expect(service.isSamePage).toEqual(false);
    	expect(service.urlMap).toEqual({});
    });

    it('should navigate to project list controller from submission list on back', function() {
    	var current = {'controller'	:'projectListController'};
		var next = {'controller': 'submissionListController'};
		
		spyOn(location, 'url');
		spyOn(location, 'path').and.returnValue('/submission-list/1234567890');
		
		expect(service.isSamePage).toEqual(false);
		expect(service.urlMap).toEqual({});
		service.setController(current, next);
		expect(service.isSamePage).toEqual(false);

		service.setUrl('#/local-project-list', '#/submission-list/1234567890?isList=false');
    	
    	expect(service.urlMap).toEqual({'/submission-list/1234567890':'/local-project-list'});
		expect(service.isBackClicked).toEqual(false);
		
		var backUrl = service.goBack();
		
		expect(service.isBackClicked).toEqual(true);
		expect(location.path).toHaveBeenCalled();
		expect(service.urlMap).toEqual({});
		expect(backUrl).toEqual('/local-project-list');
    });

   it('should not add url when back event is triggered on same page(server to local)', function() {
		service.isBackClicked = true;
		service.isSamePage = true;
		expect(service.urlMap).toEqual({});
		
		service.setUrl('#/submission-list/1234567890?isList=false', '#/local-project-list');
		
		expect(service.urlMap).toEqual({});
		expect(service.isBackClicked).toEqual(false);
		expect(service.isSamePage).toEqual(false);
    });

    it('should show exit alert when back event on project list page', function() {
    	expect(service.urlMap).toEqual({});
    	
    	spyOn(dService, 'confirmBox');
    	
    	service.goBack();
    	
    	expect(dService.confirmBox).toHaveBeenCalled();
    });

    it('should be able to navigate from server to local page.', function() {
    	var next = {'controller'	:'submissionListController'};
		var current = {'controller': 'submissionListController'};

		service.setController(current, next);

    	spyOn(location, 'url');
		spyOn(location, 'path').and.returnValue('/submission-list/1234567890');
		
		expect(service.urlMap).toEqual({});
    	
    	service.add('server', '/submission-list/1234567890?isList=false');
    	
    	expect(service.urlMap).toEqual({'server':'/submission-list/1234567890?isList=false'});
    	
    	var backUrl = service.goBack();
    	
    	expect(service.isBackClicked).toEqual(true);
		expect(service.urlMap).toEqual({});
		expect(backUrl).toEqual('/submission-list/1234567890?isList=false');
    });

    it('should exclude login controller tracing', function() {
    	var next = {'controller':'projectListController'};
		var current = {'controller': 'loginController'};

		spyOn(dService, 'confirmBox');
		expect(service.isSamePage).toEqual(false);
		expect(service.urlMap).toEqual({});
		service.setController(current, next);
		expect(service.isSamePage).toEqual(false);

		service.setUrl('#/', '#/local-project-list');
		
		expect(service.urlMap).toEqual({});

		service.goBack();

		expect(dService.confirmBox).toHaveBeenCalled();
    });

    it('should not set isSamePage to true when next and current does not have controller', function() {
    	var next = {'controller': undefined};
		var current = {'controller': 'loginController'};

    	expect(service.isSamePage).toEqual(false);
    	service.setController(current, next);
    	expect(service.isSamePage).toEqual(true);
    });

});
