
var DeviceHandler = {
    capturePhoto: function(callbacks) {},
    captureVideo: function(callbacks) {},
    captureAudio: function(callbacks) {},
    photoGallery: function(callbacks) {},
    videoGallery: function(callbacks) {}
};

(function() {
    var navigator;

    CordovaDeviceHandler = function(navigatorObj) {
        console.log('in cordovaDeviceHandler');
        navigator = navigatorObj; //this can be static since there will be one way to interact with device apis
    }

    CordovaDeviceHandler.prototype = Object.create(DeviceHandler);

    CordovaDeviceHandler.prototype.constructor = DeviceHandler;

    CordovaDeviceHandler.prototype.capturePhoto = function(callbacks) {
        deviceHandleMapper('photo', callbacks);
    }

    CordovaDeviceHandler.prototype.captureVideo = function(callbacks) {
        deviceHandleMapper('video', callbacks);
    }

    CordovaDeviceHandler.prototype.captureAudio = function(callbacks) {
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

    CordovaDeviceHandler.prototype.photoGallery = function(callbacks) {
        galleryHandler(callbacks, Camera.MediaType.PHOTO);
    }

    CordovaDeviceHandler.prototype.videoGallery = function(callbacks) {
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

}());

var cordovaDeviceHandler = new CordovaDeviceHandler(navigator);
