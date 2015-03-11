var dialogService = function() {

    this.confirmBox = function(message, onYes, onNo) {
        function onConfirm(buttonIndex) {
            if(buttonIndex!=BUTTON_NO)
                onYes();
            else 
                if(onNo)
                    onNo();
        }; 
        navigator.notification.confirm(
            message,
            onConfirm,
            'Garner',   
            ['Yes','No']
        );
    };

    this.infoBox = function(message, onOk) {
        navigator.notification.alert(message, onOk, 'Garner');
    };
};

dcsApp.service('dialogService', [dialogService]);
