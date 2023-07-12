/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define([], function() {
    function pageInit(context) {
    }
    
    function onButtonClick() {
        var myDialog = window.dialogArguments;
        myDialog.close('ok');
    }

    function onDialogCancel() {
        var myDialog = window.dialogArguments;
        myDialog.close('cancel');
    }

    return {
        pageInit: pageInit,
        onButtonClick: onButtonClick,
        onDialogCancel: onDialogCancel
    };
});
