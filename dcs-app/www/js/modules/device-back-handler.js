var navigatorWrapper = {
    confirmToExitApp: function() {
        function onConfirm(buttonIndex) {
            if (buttonIndex == BUTTON_NO)
                return;
            navigator.app.exitApp();
        };
        navigator.notification.confirm(
            'Do you want to exit?',
            onConfirm,
            'Garner', ['Yes', 'No']
        );
    }
}

var BackHandler;
(function() {
    BackHandler = function(navigatorWrapper) {
        this.navigatorWrapper = navigatorWrapper;
        this.projectsUrlPattern = /\/local-project-list/;
        this.submissionCreateEditUrlPattern = /\/project\/\w+\/submission\/(null|\d+)/;
        this.submissionsUrlPattern = /\/submission-list\/\w+/;

        this.onRouteChange = function(next) {
            if(this.projectsUrlPattern.test(next)) {
                this.callback = this.confirmToExitApp;
            } else if(this.submissionCreateEditUrlPattern.test(next)) {
                this.project_uuid = getProjectUuid(next);
                this.callback = this.goToSubmissions;
            } else if(this.submissionsUrlPattern.test(next)){
                this.project_uuid = getProjectUuid(next);
                this.callback = this.goToProjects;
            } else {
                this.callback = this.returnNothing;
            }
        };

        this.onBack = function() {
            return this.callback();
        };

        this.confirmToExitApp = function() {
            this.navigatorWrapper.confirmToExitApp();
        };

        this.setToProjects = function() {
            console.log('BackHandler: setting to projects');
            this.callback = this.goToProjects;
        };

        this.setToSubmissions = function() {
            this.callback = this.goToSubmissions;
        };

        this.goToProjects = function() {
            return '/local-project-list';
        };

        this.goToSubmissions = function() {
            return '/submission-list/' + this.project_uuid;
        };

        this.returnNothing = function() {
            return undefined;
        };

        var getProjectUuid = function(next) {
            return next.split('/')[2];
        }
    };
}());
