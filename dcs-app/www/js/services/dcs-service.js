dcsApp.service('dcsService', ['$q', '$rootScope','app', 'contextService', function($q, $rootScope, app, contextService) {

    this.getProjectsList = function(start,length, searchStr) {
        //TODO: add searchStr to the request.

        var params = {
            'start': start,
            'length': length
        };
        return app.httpRequest("/client/projects/", params);
    };

    this.getQuestionnaires = function(projects) {
        var params = {
            'ids': projects
        };
        return app.httpRequest("/client/projects/" , params);
    };

    this.verifyUser = function() {
        return app.httpRequest("/client/auth/", {});
    };

    this.checkProjectsStatus = function(projects) {
        return app.httpPostRequest('/client/project_status/', 'projects=' + JSON.stringify(projects));
    };

    this.checkSubmissionsStatus = function(project_uuid, submissions) {
        return app.httpPostRequest('/client/projects/'+ project_uuid +'/submission_status/', 'submissions=' + JSON.stringify(submissions));
    };

    this.getSubmissions = function(project_uuid, start, length, searchStr){
        return app.httpRequest('/client/projects/' + project_uuid + '/submissions/?start=' + start + '&length='+ length + '&search_str=' + searchStr);
    };

    this.getSubmissionsFrom = function(project_uuid, last_fetch){
        return app.httpRequest('/client/'+project_uuid+'/delta/?last_fetch='+last_fetch);
    };

    this.getSubmission = function(submission) {
        var deferred = $q.defer();
        app.httpRequest("/client/projects/" + submission.project_uuid + "/submissions/" + submission.submission_uuid)
            .then(function(serverSubmission) {
                serverSubmission.project_uuid = submission.project_uuid;
                serverSubmission.status = submission.status;
                serverSubmission.un_changed_files = submission.media_file_names_string;
                console.log('resolving dcsService.getSubmission');
                deferred.resolve(serverSubmission);

            },deferred.reject);
        console.log('dcsService.getSubmission return promise');
        return deferred.promise;
    };

    this.getSubmissionMedia = function(submission) {
        console.log('in getSubmissionMedia; submission: ' + JSON.stringify(submission));
        var media_file_names = submission.media_file_names_string;
        var deferred = $q.defer();
        if (!media_file_names || media_file_names.length < 1) {
            console.log('no media to download; media_file_names: ' + media_file_names);
            deferred.resolve(submission);
            return deferred.promise;
        }
        var promises = [];
        angular.forEach(media_file_names.split(','), function(fileName) {
            promises.push(app.httpGetMediaFile(submission, fileName));
        });

        $q.all(promises)
            .then(function() {
                deferred.resolve(submission);
            }, deferred.reject);

        return deferred.promise;
    }

    this.getSubmissionById = function(project_uuid, submission_uuid) {
        return app.httpRequest("/client/projects/" + project_uuid + "/submissions/" + submission_uuid);
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
        var baseUrl = "/client/projects/dummy/submissions/";
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

        fileSystem.setWorkingDir(app.user.name, contextService.getProject().project_uuid + '/' + submission.submission_id);
        return getFilesMeta(fileNamesString)
            .then(function(filesMetaData) {
                console.log('key: "value",  ' + filesMetaData.length);

                var transferPromises = [];
                angular.forEach(filesMetaData, function(fileMeta) {
                    transferPromises.push(app.httpPostFile(fileMeta, submission.submission_uuid));
                });

                $q.all(transferPromises).then(function(submittedFiles) {
                    updateMediaFileInfo(submission, submittedFiles);
                    deferred.resolve(submission);
                }, deferred.reject);

                return deferred.promise;
            });
    }

    function updateMediaFileInfo(submission, submittedFiles) {
        console.log('media files submited are: ' + submittedFiles);
        var new_files_added = removeSubmittedFromNewFilesInfo(submission.new_files_added, submittedFiles);
        var un_changed_files = updateSubmittedFileToRetain(submission.un_changed_files,submittedFiles);

        submission.new_files_added = new_files_added.join(',');
        submission.un_changed_files = un_changed_files.join(',');
    }

    function removeSubmittedFromNewFilesInfo(new_files_added, submittedFiles) {
        console.log('new_files_added: ' + new_files_added);

        var new_files = new_files_added.split(',');
        if (new_files.length > 0) {
            $.each(submittedFiles, function(i, submittedFile) {
                var index = $.inArray(submittedFile, new_files);
                if (index > -1) {
                    new_files.splice(index, 1);
                }
            });
        }
        console.log('new_files: ' + new_files);
        // this will always be empty, but incase of some unpredicated failure this will keep data consistent
        return new_files;
    }

    function updateSubmittedFileToRetain(un_changed_files, submittedFiles) {
        console.log('un_changed_files: ' + un_changed_files);
        
        var un_changed = un_changed_files.split(',');
        un_changed = $.merge(submittedFiles, un_changed);
        un_changed = un_changed.filter(onlyUnique);
        console.log('un_changed: ' + un_changed);

        return un_changed;
    }

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    function getFilesMeta(fileNamesString) {
        console.log('in getFilesMeta, fileNamesString: ' + fileNamesString);

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

        fileSystem.fileNameToFileInfo(fileName, function(filePath, type) {
            console.log('cordovaMediaManager loaded filename: ' + fileName + ' path: '+ filePath + '; type: ' + type);
            deferred.resolve({name: fileName, path:filePath, type:type});
        });
        return deferred.promise;
    }

    this.checkSubmissionVersions = function(id_versions) {
        return app.httpPostRequest('/client/project/dummy/submission_status/', 'id_version_dict=' + JSON.stringify(id_versions));
    };

}]);
