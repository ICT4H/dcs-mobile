(function() {

    ButtonFactory = function(deviceHandler, fileSystem) {
        console.log('ButtonFactory constructor')
        this.deviceHandler = deviceHandler;
        this.fileSystem = fileSystem;
    }

    ButtonFactory.prototype.getButtons = function(mediaType, widgetCallbacks) {
        console.log('type: ' + mediaType + '; callbacks: ' + widgetCallbacks);

        var mediaTypeOptions = {
            'image/*': [{
                label: 'Camera',
                clickHandler: this.deviceHandler.openCamera,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: widgetCallbacks
            }, {
                label: 'Gallery',
                clickHandler: this.deviceHandler.openPhotoGallery,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: widgetCallbacks
            }],
            'video/*': [{
                label: 'Video',
                clickHandler: this.deviceHandler.openVideoCamera,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: widgetCallbacks
            }, {
                label: 'Gallery-v',
                clickHandler: this.deviceHandler.openVideoGallery,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: widgetCallbacks
            }],
            'audio/*': [{
                label: 'Audio',
                clickHandler: this.deviceHandler.openAudioRecorder,
                fsCallbacks: this.fileSystem.copyFile,
                callbacks: widgetCallbacks
            }]};

        var options = mediaTypeOptions[mediaType];

        var htmlButtons = [];
        for (var i=0; i<options.length; i++) {
            htmlButtons.push( getHtmlButton(options[i]) );
        }

        return htmlButtons;
    }

    function getHtmlButton(options) {

        return $('<button/>', {
            type  : 'button',
            html : options.label,
            on    : {
                click: function() {
                    options.clickHandler({
                        success: function(fileUrl) {
                            options.fsCallbacks(fileUrl, options.callbacks);
                        },
                        error: options.callbacks.error
                    })
                }
            }
        });
    }

}());
