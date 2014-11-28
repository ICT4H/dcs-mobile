var contextService = function($location) {
    this.project = null;
    
    this.createSurveyResponse = function(project_uuid) {
        $location.path('/project/' + project_uuid + '/submission/' + null);
    };

    this.isProjectOutdated = function(project) {
        return project.status == "outdated";
    };

    this.isProjectDeleted = function(project) {
        return project.status = "";
    };

    //Pagination
    this.pagination = {};
    this.pagination.pageSize = 0;
    this.pagination.totalElement = 0;
    this.pagination.pageNumber = 0;
    this.pagination.paginationCallBack;

    this.pagination.init = function(ElementsPerPage, totalElement, callBack) {
        this.pageSize = ElementsPerPage;
        this.totalElement = totalElement;
        this.pageNumber = 0;
        this.paginationCallBack = callBack;
    };

    this.pagination.onNext = function() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationCallBack(this.pageNumber);
    };

    this.pagination.onPrevious = function() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationCallBack(this.pageNumber);
    };

    this.pagination.isLastPage = function() {
        return window.Math.ceil(this.totalElement/this.pageSize) == this.pageNumber + 1;
    };

    this.pagination.isFirstPage = function() {
        return this.pageNumber == 0;
    };

    this.pagination.isAtLast = function(listIndex) {
        if(this.isLastPage())
            return listIndex ==  this.totalElement % this.pageSize - 1 ;
        return listIndex == this.pageSize-1;
    };

};

dcsApp.service('contextService', ['$location', contextService]);
