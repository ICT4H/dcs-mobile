dcsApp.service('messageService', ['$rootScope', function ($rootScope) {

    var enableMessage = function(MessageType, message) {
        $rootScope.css = MessageType;
        $rootScope.message_to_display = message;
        $rootScope.showMessage = true;
        apply();
    };

    var apply = function() {
        if(!$rootScope.$$phase) {
            $rootScope.$apply();
        }
    }
    
    this.hideAll = function() {
        $rootScope.showMessage = false;
        $rootScope.loading = false;
        apply();
    };

    // this.hideLoading = function() {
    //     $rootScope.loading = false;
    //     apply();
    // }

    this.hideLoadingWithInfo = function(message) {
        $rootScope.loading = false;
        this.displayInfo(message);
    }

    this.hideLoadingWithErr = function(message) {
        $rootScope.loading = false;
        this.displayError(message);
    }

    this.hideMessage = function() {
        $rootScope.showMessage = false;
        $rootScope.loading = false;
        apply();
    };

    this.showLoading = function() {
        $rootScope.loading = true;
        apply();
    }

    this.showLoadingWithInfo = function(message) {
        $rootScope.loading = true;
        this.displaySuccess(message);
    }

    this.displaySuccess = function(message) {
        enableMessage("alert-success", message);
    };

    this.displayInfo = function(message) {
        enableMessage("alert-info", message);
    };

    this.displayError = function(message) {
        enableMessage("alert-danger", message);
    };

}])

