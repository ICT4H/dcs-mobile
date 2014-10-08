(function() {

    MediaButton = function(deviceHandler, fileSystem) {
        this.deviceHandler = deviceHandler;
        this.fileSystem = fileSystem;
    }

    MediaButton.prototype.addButtons = function($el, mediaType, applyCallbacks) {
        var buttons = this.getButtonForMedia(mediaType, applyCallbacks);

        $.each(buttons, function(i, options) {
            $el.append(getButton(options));
        })
    }

    MediaButton.prototype.getButtonForMedia = function(mediaType, applyCallbacks) {
        var buttonOptionsMap = {
            'image/*': [{
                label: 'Camera',
                clickHandler: this.deviceHandler.capturePhoto,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: applyCallbacks
            }, {
                label: 'Gallery',
                clickHandler: this.deviceHandler.photoGallery,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: applyCallbacks
            }],
            'video/*': [{
                label: 'Video',
                clickHandler: this.deviceHandler.captureVideo,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: applyCallbacks
            }, {
                label: 'Gallery-v',
                clickHandler: this.deviceHandler.videoGallery,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: applyCallbacks
            }],
            'audio/*': [{
                label: 'Audio',
                clickHandler: this.deviceHandler.captureAudio,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: applyCallbacks
            }]};

        return buttonOptionsMap[mediaType];
    }

    function getButton(options) {
        return $('<button />', {
            type  : 'button',
            html : options.label,
            on    : {
                click: function() {
                    options.clickHandler({
                        success: function(fileUrl) {
                            options.fsCallbacks(fileUrl, {
                                success: options.callbacks.success,
                                error: options.callbacks.error
                            });
                        },
                        error: options.callbacks.error
                    })
                }
            }
        });
    }

}());
