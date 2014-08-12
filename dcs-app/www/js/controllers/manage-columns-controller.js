dcsApp.controller('manageColumnsController', ['$rootScope', '$scope', '$routeParams', '$location', 'dcsService', 'localStore', 'messageService',
    function($rootScope, $scope, $routeParams, $location, dcsService, localStore, msg){

    $scope.pageTitle = "Server";
    msg.showLoadingWithInfo('Loading columns');

    $scope.project_uuid = $routeParams.project_uuid;
    
    console.log('in column ctrl');

    // var header_str = '{"data": {"ds_name": {"label":"Data Sender", "selected":true}'+
    //  ', "date": {"label":"Submission Date", "selected":false}}}';
    // $scope.project_name = 'project name';
    // $scope.project_uuid = '1';

    localStore.getProjectById($scope.project_uuid)
        .then(function(project) {
            $scope.project_name = project.name;
            $scope.project_uuid = project.project_uuid
            $scope.getSubmissions();
        });

    $scope.getSubmissions = function() {

        $rootScope.httpRequest('/client/submission-headers/?uuid='+$scope.project_uuid)
            .then(function(responce) {
                $scope.headers = responce.data;
                // $scope.headers = JSON.parse(header_str).data;
                // console.log($scope.headers);
                // console.log('responce: ');
                // console.log(responce);

                msg.hideAll();
            },function() {
                msg.hideLoadingWithErr('Failed to load columns');
                console.log('errored');
            });
    };

    // TODO remove this, used while dev
    // $scope.getSubmissions();

    $scope.toggle = function(key) {
    	console.log('header: ' + key);
    	$scope.headers[key].selected = !$scope.headers[key].selected;
    }
}]);
    