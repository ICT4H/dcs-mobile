dcsApp.service('messageService', ['$rootScope', function ($rootScope) {
    this.isErrorMessage = false;
    $rootScope.messages = {};
    $rootScope.notificationLength = 0;
    var message = function(backUrl, css) {
        this.backUrl = backUrl;
        this.css = css;
    };

    this.addInfo = function(text, backUrl) {
       $rootScope.messages[text] = new message(backUrl || "", "alert-info"); 
       $rootScope.notificationLength = Object.keys($rootScope.messages).length;
       apply();
    };

    this.addError = function(error, backUrl){
        $rootScope.messages[error] = new message(backUrl || "", "alert-danger");
        $rootScope.notificationLength = Object.keys($rootScope.messages).length;
        apply();
    };

    var enableMessage = function(MessageType, message) {
        $rootScope.css = MessageType;
        $rootScope.message_to_display = message;
        $rootScope.showMessage = true;
        apply();
    };

    this.removeMessage = function(index){
        delete $rootScope.messages[index];
        $rootScope.notificationLength = Object.keys($rootScope.messages).length;
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

    this.handleError = function(status,message) {
        if(status == 404) {
            this.hideLoadingWithErr('unable to reach server');
            return;
        }
        this.hideLoadingWithErr(message);

    };

    this.hideLoadingWithInfo = function(message) {
        $rootScope.loading = false;
        this.displayInfo(message);
    };

    this.hideLoadingWithErr = function(message) {
        $rootScope.loading = false;
        this.displayError(message);
    };

    this.hideMessage = function() {
        if(!this.isErrorMessage) {
            $rootScope.showMessage = false;
            apply();
        }
    };

    this.showLoading = function() {
        $rootScope.loading = true;
        apply();
    }

    this.showLoadingWithInfo = function(msg) {
        $rootScope.loading = true;
        this.displaySuccess(msg);
    };

    this.displaySuccess = function(msg) {
        this.isErrorMessage = false;
        enableMessage("alert-success", msg);
    };

    this.displayInfo = function(message) {
        this.isErrorMessage = false;
        enableMessage("alert-info", message);
    };

    this.displayError = function(msg) {
        this.isErrorMessage = true;
        enableMessage("alert-danger", msg);
    };

}])

