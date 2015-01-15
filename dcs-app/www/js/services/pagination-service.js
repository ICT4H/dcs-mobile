var paginationService = function() {

    //Pagination
    this.pagination = {};
    this.pagination.pageSize = 0;
    this.pagination.totalElement = 0;
    this.pagination.pageNumber = 0;
    this.pagination.paginationCallBack;

    this.pagination.init = function(ElementsPerPage, totalElement, callBack, index) {
        this.pageSize = ElementsPerPage;
        this.totalElement = totalElement;
        this.pageNumber = index || 0;
        this.paginationCallBack = callBack;
        this.paginationCallBack(this.pageNumber);
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

    this.pagination.getFrom = function() {
        return (this.pageNumber * this.pageSize) + window.Math.max(0, window.Math.min(1, this.totalElement*this.pageSize));
    };

    this.pagination.getTo  = function() {
        return (this.pageNumber * this.pageSize) + window.Math.min((this.totalElement - (this.pageSize * this.pageNumber)), this.pageSize); 
    };

    this.pagination.getTotal = function() {
        return this.totalElement;
    };

};
dcsApp.service('paginationService', [paginationService]);