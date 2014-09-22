var settingsController = function($rootScope, $scope) {
    $scope.pageSizes = $rootScope.pageSizes;
    $scope.pageSize = $rootScope.pageSize;

    $scope.onPageSizeChange = function() {
        $rootScope.pageSize.value = $scope.pageSize.value;
    };
};
dcsApp.controller('settingsController', ['$rootScope', '$scope', settingsController]);