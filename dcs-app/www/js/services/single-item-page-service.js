dcsApp.service('singleItemPage', ['$location', function($location) {


    this.init = function(projectUuid, type, searchStr, currentIndex, totalRecords) {
        this.baseUrl = '/projects/' + projectUuid + '/submissions/' + currentIndex + '/';
        this.projectUuid = projectUuid;
        this.type = type;
        this.searchStr = searchStr;
        this.currentIndex = currentIndex;
        this.totalRecords = totalRecords;
    }

    this.getTotal = function() {
        return this.totalRecords;
    }

    this.showPagination = function() {
        //dont show for create submission
        return !isNaN(this.currentIndex);
    }

    this.getTo = function() {
        return this.currentIndex + 1;
    }

    this.isFirstPage = function() {
        return this.currentIndex === 0;
    }

    this.isLastPage = function() {
        return this.currentIndex + 1 === this.totalRecords;
    }

    this.onNext = function() {
        $location.url(this.baseUrl + '?type='+this.type+'&searchStr='+this.searchStr+'&currentIndex=' + (this.currentIndex+1));
    }

    this.onPrevious = function() {
        $location.url(this.baseUrl + '?type='+this.type+'&searchStr='+this.searchStr+'&currentIndex=' + (this.currentIndex-1));
    }

}])
