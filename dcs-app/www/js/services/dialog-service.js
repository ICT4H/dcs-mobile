var dialogService = function() {
    var BUTTON_YES = 1;

    this.confirmBox = function(message, onYes, onNo) {
        function onConfirm(buttonIndex) {
            if(buttonIndex == BUTTON_YES)
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
