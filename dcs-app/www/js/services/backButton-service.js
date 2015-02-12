var backButtonService = function($location, $route, dialogService) {
	this.isSamePage = false;
	this.isBackClicked = false;
	this.urlMap = {};
	var excludePath = ['/local-project-list', '/'];
	this.init = function() {
		this.urlMap = {};
		this.isBackClicked = false;
		this.isSamePage = false;
	};

	this.setController = function(current, next) {
		if(!current) return;
		if(!next) return;
		if(current.controller == next.controller)
			this.isSamePage = true;
	};

	this.setUrl = function(previousUrl, currentUrl) {
		if(this.isBackClicked) {
			this.isBackClicked = false;
			this.isSamePage = false;
			return;
		}

		if(this.isSamePage) {
			this.isSamePage = false;
			return;			
		}

       	previousUrl = previousUrl.split('#')[1];
       	currentUrl = currentUrl.split('#')[1].split('?')[0];
       	if(excludePath.indexOf(currentUrl) == -1)
       		this.urlMap[currentUrl] = previousUrl;
	};

	this.goBack = function() {
		if(Object.keys(this.urlMap).length == 0) {
			dialogService.confirmBox("Do you want to exit?", function() {
				navigator.app.exitApp();
			});
		}
		else {
			this.isBackClicked = true;
			var currentPath = this.currentBackKey || $location.path();
			var pathToGo = this.urlMap[currentPath];
			this.currentBackKey = undefined;
			delete this.urlMap[currentPath];
			return pathToGo;
		}
	};
	
	this.add = function(path, url) {
		this.currentBackKey = path;
		this.urlMap[path] = url;
	};
};

dcsApp.service('backButtonService', ['$location', '$route', 'dialogService', backButtonService]);