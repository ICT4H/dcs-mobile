var contextService = function() {
    this.isListing = true;
    this.submissionIndex = 0;
    this.submissions;
};

dcsApp.service('contextService', [contextService]);
