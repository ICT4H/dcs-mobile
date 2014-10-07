
// var mediaInterface = {
//     capturePhoto: function() {},
//     openGallery: function() {},
//     captureVideo: function() {}
// };

// function CordovaMedia(fileSystem, message) {

// }



// (function() {
//     CordovaDeviceHandler = function(navigator) {

//     }
// }());

var cordovaDeviceHandler = (function($, fs) {
    "use strict";
    console.log('in cordovaDeviceHandler');
    var capturePhoto, photoGallery, captureVideo, captureAudio, videoGallery;

    //TODO handle errors in all functions.

    capturePhoto = function(callbacks) {
        deviceHandleMapper('photo', callbacks);
    }

    captureVideo = function(callbacks) {
        deviceHandleMapper('video', callbacks);
    }

    captureAudio = function(callbacks) {
        deviceHandleMapper('audio', callbacks);
    }

    function deviceHandleMapper(handle, callbacks) {
        var deviceHandlers = {
            photo: navigator.device.capture.captureImage,
            video: navigator.device.capture.captureVideo,
            audio: navigator.device.capture.captureAudio
        };

        deviceHandlers[handle](
            function(mediaFiles) {
                var imageUrl = mediaFiles[0].fullPath;
                console.log('media fullPath: ' + imageUrl);
                callbacks.success(imageUrl);
            }, function() {
                console.log('failed as no media data: ' + handle);
                callbacks.error();
            }, {limit:1}
        );
    }

    photoGallery = function(callbacks) {
        galleryHandler(callbacks, Camera.MediaType.PHOTO);
    }

    videoGallery = function(callbacks) {
        galleryHandler(callbacks,Camera.MediaType.VIDEO);
    }

    function galleryHandler(callbacks, mediaType) {
        navigator.camera.getPicture(
            function(imageUrl) {
                callbacks.success(imageUrl);
            }, function() {
                console.log('failed as no imageData');
                callbacks.error();
            }, {quality: 50,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                destinationType: Camera.DestinationType.NATIVE_URI,
                allowEdit: false,
                mediaType: mediaType                
            }
        );
    }

    return {
        capturePhoto: capturePhoto,
        photoGallery: photoGallery,
        captureVideo: captureVideo,
        videoGallery: videoGallery,
        captureAudio: captureAudio,
    };

} )(jQuery, fileSystem);