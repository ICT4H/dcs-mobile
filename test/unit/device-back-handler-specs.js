describe("BackHandler", function() {

    it("should exit on back of projects", function() {
        var next = '/local-project-list';
        var navigatorWrapper = {
            confirmToExitApp: function() {}
        };
        spyOn(navigatorWrapper, 'confirmToExitApp');
        var handler = new BackHandler(navigatorWrapper);
        
        handler.onRouteChange(next);
        
        handler.onBack();
        expect(navigatorWrapper.confirmToExitApp).toHaveBeenCalled(); 
    });

    it("should create projects url", function() {
        var handler = new BackHandler();

        handler.setToProjects();
        
        var res = handler.onBack();
        expect(res).toBe('/local-project-list'); 
    });

    it("should create submissions url when server submissions displayed", function() {
        var handler = new BackHandler();
        var submissions_url = '/submission-list/7ef7201476ee11e4bf40005056822526';
        handler.onRouteChange(submissions_url);

        handler.setToSubmissions();

        var res = handler.onBack();
        expect(res).toBe('/submission-list/7ef7201476ee11e4bf40005056822526');
    });

    it("should create the projects url when route changes to submissions", function() {
        var submissions_url = '/submission-list/7ef7201476ee11e4bf40005056822526';
        var handler = new BackHandler();
        handler.onRouteChange(submissions_url);

        var res = handler.onBack();
        
        expect(res).toBe('/local-project-list'); 
    });

    it("should create submissions url when route changes to submission create", function() {
        var new_submission_url = '/project/7ef7201476ee11e4bf40005056822526/submission/null';
        var handler = new BackHandler();
        handler.onRouteChange(new_submission_url);

        var res = handler.onBack();
        
        expect(res).toBe('/submission-list/7ef7201476ee11e4bf40005056822526');      
    });

    ///submission-list/7ef7201476ee11e4bf40005056822526

    it("should return nothing for unhandled", function() {
        var next = 'not-handled-url';
        var handler = new BackHandler();
        handler.onRouteChange(next);

        expect(handler.onBack()).toBeFalsy();
    });

});







