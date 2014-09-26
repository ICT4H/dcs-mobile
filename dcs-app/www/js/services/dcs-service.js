dcsApp.service('dcsService', ['$q', '$rootScope','app', function($q, $rootScope, app) {

    this.getProjects = function(start,length) {
        return app.httpRequest("/client/project/?start="+start+"&length="+length);
    };

    this.verifyUser = function() {
        return app.httpRequest("/client/auth/");
    };

    this.checkProjectsStatus = function(projects) {
         // return app.httpPostRequest('/client/project/dummy/submission/check-status', 'id_version_dict=' + JSON.stringify(id_versions));
        return app.httpPostRequest('/client/projects/validate/', 'projects=' + JSON.stringify(projects));
    };

    this.getQuestion = function(project_uuid) {
        return app.httpRequest("/client/project/" + project_uuid);
    };

    this.getAllSubmissions = function(project_uuid) {
        return app.httpRequest("/client/project/" + project_uuid + "/submission/");
    };
    
    this.getSubmissions = function(project_uuid,start,length){
        return app.httpRequest('/client/submissions/?uuid='+project_uuid+'&start='+start+'&length='+length);
    };

    this.getSubmission = function(submission) {
        var deferred = $q.defer();
            app.httpRequest("/client/project/" + submission.project_uuid + "/submission/" + submission.submission_uuid).then(function(serverSubmission) {
                serverSubmission.project_uuid = submission.project_uuid;
                serverSubmission.status = submission.status;
                deferred.resolve(serverSubmission);

            },deferred.reject);
        return deferred.promise;
    };

    this.getSubmissionHeaders = function(project_uuid) {
        var deferred = $q.defer();
        app.httpRequest('/client/submission-headers/?uuid='+project_uuid).then(function(response) {
        deferred.resolve(response.data);
        },deferred.reject);

        return deferred.promise;
    };

    this.getSubmissionById = function(project_uuid, submission_uuid) {
        return app.httpRequest("/client/project/" + project_uuid + "/submission/" + submission_uuid);
    };

    this.postSubmissionAndPurgeObsoluteMedia = function(submission) {

        var createOrUpdateUrl = getCreateOrUpdateUrl(submission.submission_uuid);
        var deferred = $q.defer();

        app.httpPostRequest(createOrUpdateUrl,
            'form_data=' + submission.xml +'&retain_files=' + submission.un_changed_files)

            .then(function(response) {
                submission.status = BOTH;
                submission.submission_uuid = response.submission_uuid;
                submission.version = response.version;
                submission.is_modified = false;

                console.log('httpPostRequest resolved; updated submission' + JSON.stringify(submission));
                deferred.resolve(submission);
            }, deferred.reject);

        return deferred.promise;
    };

    function getCreateOrUpdateUrl(submission_uuid) {
        var baseUrl = "/client/project/dummy/submission/";
        var isNewSubmission = angular.isUndefined(submission_uuid) || submission_uuid == "undefined";
        return isNewSubmission ? baseUrl : (baseUrl + submission_uuid);
    }

    this.postSubmissionNewMedia = function(submission) {
        console.log('update submission response: ' + JSON.stringify(submission));

        var deferred = $q.defer();
        var fileNamesString = submission.new_files_added;
        console.log('fileNamesString: ' + fileNamesString);
        if ( !fileNamesString || !fileNamesString.length > 0) {
            console.log('no meida to upload');
            deferred.resolve(submission);
            return deferred.promise;
        }

        return getFilesMeta(fileNamesString)
            .then(function(filesMetaData) {
                console.log('all getFilesMeta promises done, result length: ' + filesMetaData.length);

                var transferPromises = [];
                angular.forEach(filesMetaData, function(fileMeta) {
                    transferPromises.push(app.httpPostFile(fileMeta, submission.submission_uuid));
                });

                $q.all(transferPromises).then(function() {
                    deferred.resolve(submission);
                });

                return deferred.promise;
            });
    }

    function getFilesMeta(fileNamesString) {
        console.log('in getFilesMeta, fileNamesString: ' + fileNamesString);

        var deferred = $q.defer();
        var fileNames = fileNamesString.split(',');
        var promises = [];
        angular.forEach(fileNames, function(fileName) {
            promises.push(getFileMeta(fileName));
        });

        return $q.all(promises);
    }

    function getFileMeta(fileName) {
        console.log('in getFileMeta, filename: ' + fileName);
        var deferred = $q.defer();

        cordovaMediaManager.fileNameToFileInfo(fileName, function(filePath, type) {
            console.log('cordovaMediaManager loaded filename: ' + fileName + ' path: '+ filePath + '; type: ' + type);
            deferred.resolve({name: fileName, path:filePath, type:type});
        });
        return deferred.promise;
    }

    this.checkSubmissionVersions = function(id_versions) {
        return app.httpPostRequest('/client/project/dummy/submission/check-status', 'id_version_dict=' + JSON.stringify(id_versions));
    };

}]);
