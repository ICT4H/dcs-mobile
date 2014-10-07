dcsApp.service('app', ['$q', '$http', 'messageService', function($q, $http, msg){
    this.user = {'name':'', 'password': '', 'serverUrl':''};
    this.isAuthenticated = false;
    var exculdeHeaders = {'ds_name': 'ds_name', 'date':'date'};

	this.httpRequest = function(uri){
		var deferred = $q.defer();
        user = this.user;
        console.log('calls user name: ' + user.name + '; url: ' + user.url + uri + "password: " +user.password);
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);
                
        $http.get(user.url + uri).success(function(response) {
            console.log("Success: " + uri);
            deferred.resolve(response);
        }).error(function(data, status, headers, config) {
            console.log("failed: " + uri);
            deferred.reject(status);
        });
        return deferred.promise;
	};

    this.httpPostRequest = function(uri, data) {
        var deferred = $q.defer();
        user = this.user;
        console.log('calls user name: ' + user.name + '; url: ' + user.url + uri);
        $http.defaults.headers.post["Content-Type"] = "text/plain";
        $http.defaults.headers.common.Authorization = 'Basic ' + btoa(user.name + ':' + user.password);

        $http.post(user.url + uri, data)
            .success(deferred.resolve)
            .error(function(data, status, headers, config) {
                deferred.reject(status);
            });

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

    this.httpGetMediaFile = function(submission_uuid, fileName) {
        user = this.user;
        var url = user.url + '/client/attachment/' + submission_uuid + '/' + fileName;
        var headersMap = {"Authorization": 'Basic ' + btoa(this.user.name + ':' + this.user.password)};
        // TODO use file system to find the base url.
        var saveToFileUrl = 'file:///sdcard/dcs/' + fileName;

        console.log('downloading file: ' + fileName);

        return downloadMedia(headersMap, url, saveToFileUrl);
    }

    function downloadMedia(headerMap, url, saveToFileUrl) {
        var deferred = $q.defer();
        var fileTransfer = new FileTransfer();

        fileTransfer.download(
            encodeURI(url),
            saveToFileUrl,
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

    this.flickArray = function(array, element) {
        if(array.indexOf(element) >= 0)
            array.splice(array.indexOf(element), 1);
        else
            array.push(element);
    };

    this.extractHeaders = function(headers) {
        var orderHeaders = [];
        var flag = false;
                
        angular.forEach(headers, function(value, key) { 
            if(typeof value != "object") {
                if(!exculdeHeaders.hasOwnProperty(key))
                    orderHeaders.push(key);
                flag = true;
            }
        }); 
        
        if(flag) 
            orderHeaders.push("more");
        return orderHeaders;
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
    }
}]);
