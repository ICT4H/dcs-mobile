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
};

dcsApp.service('dialogService', [dialogService]);
