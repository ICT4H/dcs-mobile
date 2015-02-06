var locationService = function($location, dialogService) {

    var isSamePage = false;
    var backMap = {};
    var isBackClicked = false;
    
    this.goBack = function() {
        isBackClicked = true;
        if($location.path() == '/local-project-list')
            dialogService.confirmBox('Do you want to exit?', function() {
                navigator.app.exitApp();
            }) ;
        else
            $location.url(backMap[$location.path()]);
    };

    this.setUrl = function(previousUrl, currentUrl) {
        if(isSamePage) {
            isSamePage = false;   
            return;
        }

        if(isBackClicked) {
            isBackClicked = false;
            return;
        }
        
        previousUrl = previousUrl.split('#')[1];
        currentUrl = currentUrl.split('#')[1].split('?')[0];
        
        backMap[currentUrl] = previousUrl;
        isSamePage = false;
    };

    this.setKey = function(current, next) {
        if(current == undefined) return;
        if(next == undefined) return;
        if(current.controller == next.controller)
            isSamePage = true;
    };
};

dcsApp.service('locationService', ['$location', 'dialogService', locationService]);
