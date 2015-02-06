describe('Media ButtonFactory', function(){

    var deviceHandlerStub, fileSystemStub, widgetUpdateViewMock, buttonFactory;
    var success_invoking_fn = function(callbacks) {
        callbacks.success('dummy_url');
    }

    beforeEach(function() {

        deviceHandlerStub = {
            openCamera: success_invoking_fn,
            openPhotoGallery: success_invoking_fn
        }
        jasmine.createSpyObj('widgetUpdateViewStub', ['success']);
        fileSystemStub = {
            copyFile: function(fileUrl, widgetCallbacks) {
                widgetCallbacks.success('copied_dummy_url', 'dummy_file_name.jpg');
            }
        }
        var widgetUpdateViewStub = {
            success: function() {},
            error: function() {}
        }
        widgetUpdateViewMock = jasmine.createSpyObj('widgetUpdateViewStub', ['success']);
        spyOn(fileSystemStub, 'copyFile').and.callThrough();

        buttonFactory = new ButtonFactory(deviceHandlerStub, fileSystemStub);
        
    });

    it('should create camera and gallery button for image type', function() {
        var mediaButtons = buttonFactory.getButtons('image/*', widgetUpdateViewMock);
        var cameraButton = mediaButtons[0];
        var galleryButton = mediaButtons[1];

        expect(cameraButton).toHaveText('Camera');
        expect(galleryButton).toHaveText('Gallery');
    });

    it('camera on success should copy file and update the preview', function() {
        var mediaButtons = buttonFactory.getButtons('image/*', widgetUpdateViewMock);
        var cameraButton = mediaButtons[0];

        cameraButton.click();

        expect(fileSystemStub.copyFile).toHaveBeenCalled();
        expect(widgetUpdateViewMock.success).toHaveBeenCalledWith('copied_dummy_url', 'dummy_file_name.jpg');
    });

    it('gallery on success should copy file and update the preview', function() {
        var mediaButtons = buttonFactory.getButtons('image/*', widgetUpdateViewMock);
        var galleryButton = mediaButtons[1];

        galleryButton.click();

        expect(fileSystemStub.copyFile).toHaveBeenCalled();
        expect(widgetUpdateViewMock.success).toHaveBeenCalledWith('copied_dummy_url', 'dummy_file_name.jpg');
    });

});

