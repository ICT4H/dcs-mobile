dcsApp.controller('submissionController', ['$routeParams', 'localStore', 'messageService', function($routeParams, localStore, msg){
    
    var submission_id = $routeParams.submission_id;
    var buttonLabel = submission_id == "null" ?'Save':'Update';

    var getDate = function() {
        var now  =new Date();
        var date = now.toLocaleDateString();
        var time = now.toLocaleTimeString();
        time = time.replace(time.slice(time.length-6,time.length-3),'');
        return date.concat(' '+time)
    };

    options = {
        'localStore': localStore,
        'buttonLabel': buttonLabel,
        'project_id': $routeParams.project_id,
        'submission_id': submission_id,
        'onSuccess': msg.displaySuccess,
        'onError': msg.displayError,
        'getDate':getDate
    };
    loadEnketo(options);

}]);
