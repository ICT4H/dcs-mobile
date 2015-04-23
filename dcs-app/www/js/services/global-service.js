dcsApp.service('app', ['$q', '$http', 'messageService', '$rootScope', function($q, $http, msg, $rootScope){
    this.user = {'name':'', 'password': '', 'url':''};
    this.isAuthenticated = false;
    var exculdeHeaders = {'ds_name': 'ds_name', 'date':'date'};

	this.httpRequest = function(uri, queryParams){
		var deferred = $q.defer();
        var timeout = $q.defer();

        setTimeout(function () {
            timeout.resolve();
        }, 20000);

        user = this.user;
        console.log('calls user name: ' + user.name + '; url: ' + user.url + uri + "password: " +user.password);
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);
        var responsePromise = $http({
                method : 'get',
                url: user.url + uri,
                timeout: timeout.promise,
                params: queryParams
        });

        responsePromise.success(function(response) {
            console.log("Success: " + uri);
            deferred.resolve(response);
        });
        responsePromise.error(function(data, status, headers, config) {
            console.log("failed: " + uri);
            deferred.reject(status);
        });
        return deferred.promise;
	};

    this.httpPostRequest = function(uri, data) {
        var deferred = $q.defer();
        var timeout = $q.defer();

        setTimeout(function () {
            timeout.resolve();
        }, 20000);

        user = this.user;
        console.log('calls user name: ' + user.name + '; url: ' + user.url + uri);
        $http.defaults.headers.post["Content-Type"] = "text/plain";
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);
        var responsePromise = $http({
                method : 'post',
                url: user.url + uri,
                data: data,
                timeout: timeout.promise
            });
        responsePromise.success(deferred.resolve);
        responsePromise.error(deferred.reject);
        return deferred.promise;
    };

    this.httpPostFile = function(fileMeta, submission_uuid) {
        user = this.user;
        var url = user.url + '/client/attachment/' + submission_uuid;
        //TODO extract a method to get the auth after the usage of global var user is identified.
        var headersMap = {"Authorization": 'Basic ' + btoa(this.user.name + ':' + this.user.password)};

        console.log('calling httpPostFile with user name: ' + user.name + '; url: ' + url);
        
        return transfer(url, headersMap, fileMeta);
    }

    function transfer(serverUrl, headersMap, filesInfo) {
        var deferred = $q.defer();
        
        var win = function (r) {
            console.log("Code = " + r.responseCode);
            console.log("Response = " + r.response);
            console.log("Sent = " + r.bytesSent);
            deferred.resolve(filesInfo.name);
        }

        var fail = function (error) {
            alert("An error has occurred: Code = " + error.code);
            console.log("upload error source " + error.source);
            console.log("upload error target " + error.target);
            deferred.reject();
        }

        var options = new FileUploadOptions();
        options.fileName = filesInfo.name;
        options.fileKey = options.fileName;
        options.mimeType = filesInfo.type;
        options.headers = headersMap;

        var ft = new FileTransfer();
        ft.upload(filesInfo.path, encodeURI(serverUrl), win, fail, options);

        return deferred.promise;
    }

    this.httpGetMediaFile = function(submission, fileName) {
        var deferred = $q.defer();
        user = this.user;
        var url = user.url + '/client/attachment/' + submission.submission_uuid + '/' + fileName;
        var headersMap = {"Authorization": 'Basic ' + btoa(this.user.name + ':' + this.user.password)};

        fileSystem.changeToTempAndClear(this.user.name).then(function(tmpDir) {
            var submissionMediaDir = tmpDir.toURL();
            var saveFileToUrl = submissionMediaDir + fileName;
            console.log('downloading file to: ' + saveFileToUrl);
            downloadMedia(headersMap, url, saveFileToUrl).then(
                deferred.resolve,
                function() {
                    // failing to download also resolves; caller needs to handle this
                    deferred.resolve(undefined);
                }
            );
        });
        return deferred.promise;
    }

    function downloadMedia(headerMap, url, saveFileToUrl) {
        var deferred = $q.defer();
        var fileTransfer = new FileTransfer();

        fileTransfer.download(
            encodeURI(url),
            saveFileToUrl,
            function(entry) {
                console.log("download complete: " + entry.toURL());
                deferred.resolve();
            },
            function(error) {
                console.log("download error source " + error.source);
                console.log("download error target " + error.target);
                console.log("download error code" + error.code);
                deferred.reject();
            },
            false,
            {
                headers: headerMap
            }
        );
        return deferred.promise;
    }

    var searchInRepeat =  function(submission, searchStr, searchField) {
        var level = searchField.split("-");
        var flag = false;
        submission[level[0]].forEach(function(block) {
            if( block[level[1]].toLowerCase().indexOf(searchStr.toLowerCase()) >=0)
                flag = true;
        });
        return flag;
    };

    this.isSubmissionDisplayable = function(submission, searchStr, searchField) {
        if(!searchStr || !searchField)
            return true;
        if(searchField == "all")
            return JSON.stringify(submission).toLowerCase().indexOf(searchStr.toLowerCase()) >= 0;
        if(searchField.indexOf("-") >= 0)
            return searchInRepeat(submission, searchStr, searchField);
        return submission[searchField].toLowerCase().indexOf(searchStr.toLowerCase()) >= 0;
    };

    this.flipArrayElement = function(array, element) {
        if(array.indexOf(element) >= 0)
           array.splice(array.indexOf(element), 1);
        else
            array.push(element);
    };

    this.getSearchFields = function(headers, parent) {
        var self = this;
        var searchFields = {};
        angular.forEach(headers, function(value, key) { 
            if(parent != undefined)
                key = parent + "-" + key;
            if(value.constructor == {}.constructor) {
                angular.extend(searchFields, self.getSearchFields(value, key));
                return ;
            }
            if(!exculdeHeaders.hasOwnProperty(key))
                searchFields[key] = value;
        });
        return searchFields;
    };

    this.promises = function(array, onSuccess, onError) {
        $q.all(array).then(onSuccess, onError);
    };

    this.mapPromise = function(array, callBack) {
        return $q.all(array.map(callBack));
    };

    this.goBack = function() {};

    this.areItemSelected = function(selectedProject) {
        if(selectedProject.length ==0) {
            navigator.notification.alert('You need to select atleast one item.', function() {}, "CollectData");
            return false;
        }
        return true;
    };
}]);
