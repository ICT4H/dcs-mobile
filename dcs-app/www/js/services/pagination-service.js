dcsApp.service('paginationService', [function() {

    this.pagination = {};
    this.pagination.pageSize = 0;
    this.pagination.totalElement = 0;
    this.pagination.pageNumber = 0;
    this.pagination.paginationCallBack;

    this.pagination.start = function(pageSize, callBack) {
        this.pageSize = pageSize;
        //this.totalElement needs to be set inside callBack
        var startIndex = 0;
        this.pageNumber = startIndex;
        this.paginationCallBack = callBack;
        this.paginationCallBack(this.pageNumber, this.pageSize);
    };

    this.pagination.onNext = function() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationCallBack(this.pageNumber, this.pageSize);
    };

    this.pagination.onPrevious = function() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationCallBack(this.pageNumber, this.pageSize);
    };

    this.pagination.isLastPage = function() {
        if(this.totalElement == 0)
            return true;
        return window.Math.ceil(this.totalElement/this.pageSize) == this.pageNumber + 1;
    };

    this.pagination.isFirstPage = function() {
        return this.pageNumber == 0;
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

    this.pagination.getPageStartCount = function() {
        return this.pageSize * this.pageNumber;
    }
}]);