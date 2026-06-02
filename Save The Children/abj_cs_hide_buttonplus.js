/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([], function () {
     var hideButton = document.getElementById('custrecord_tar_link_to_tor_popup_new');
        console.log('hideButton', hideButton)
        if (hideButton) {
            hideButton.style.display = 'none';
        }
    function pageInit(context) {
        console.log('Script Loaded - Mode:', context.mode);

        // var style = document.createElement('style');
        // style.innerHTML = '#custrecord_tar_link_to_tor_popup_new { display: none !important; }';
        // document.head.appendChild(style);

       
    }
    
    function fieldChanged(context) {
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});