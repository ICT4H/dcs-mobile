xdescribe("Submission Provider", function() {

    var provider,
        spiedSubmissionDao,
        projectUuid = 'p_uuid_1';

    beforeEach(function() {
        spiedSubmissionDao = {
            locadLocalSubmission: function() {}
        };
        spyOn(spiedSubmissionDao, 'locadLocalSubmission').and.passthrought();
        provider = new SubmissionProvider(projectUuid,localStore, serverService);        
    });

    it("should get local submission of given current index", function() {
        var currentIndex = 3,
            isServer = false;
        var expectedStart = 3,
            expectedCount = 1;

        var result = provider.getSubmission(currentIndex, isServer);

        expect(spiedSubmissionDao).to.beCalledWith('expected_project_uuid' expectedStart, expectedCount)
    });
});

xdescribe("Paginator", function() {
    
    var totalRecords = 10;

    it("should detect first page", function() {
        var currentIndex = 0;
        var pager = new Page(currentIndex, totalRecords);

        expect(page.isFirstPage()).toBeTruthy();
    });

    it("should detect last page", function() {
        var currentIndex = 9;
        var pager = new Page(currentIndex, totalRecords);

        expect(page.isLastPage()).toBeTruthy();
    });

    it("should detect not in first or last page", function() {
        var currentIndex = 5;
        var pager = new Page(currentIndex, totalRecords);

        expect(page.isFirstPage()).toBeFalsy();
        expect(page.isLastPage()).toBeFalsy();
    });

    it("should create next url", function() {
        var currentIndex = 5;
        var pager = new Page(currentIndex, totalRecords);

        expect(page.next()).toBe('submission?currentIndex=6');
    });

    it("should create previous url", function() {
        var currentIndex = 5;
        var pager = new Page(currentIndex, totalRecords);

        expect(page.previous()).toBe('submission?currentIndex=4');
    });
});