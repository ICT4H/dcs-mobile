var contextService = function() {

    this.initSubmissionListForServer = function(submissions, index, pageSize, totalElement, startPage, type) {
    	this.submissionIndex = index;
    	this.length = pageSize;
    	this.total = totalElement;
    	this.start = startPage -1;
    	this.isListing = true;
    	this.submissions = submissions;
    	this.type = type;
    	this.isServer = true;
    };

    this.initSubmissionListForLocal = function(projectId, submissions, index, pageSize, totalElement, startPage, type) {
        this.submissionIndex = index;
    	this.length = pageSize;
    	this.total = totalElement;
    	this.start = startPage -1;
    	this.isListing = true;
    	this.submissions = submissions;
    	this.type = type;
    	this.isServer = false;
    };

    this.resetSubmissionListForPaging = function(submissions, start, index) {
    	this.submissions = submissions;
    	this.submissionIndex = index;
    	this.start = start;
    };

};	

dcsApp.service('contextService', [contextService]);
