/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function(serverWidget) {

    function beforeLoad(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
            return;
        }

        var form = context.form;
        form.clientScriptModulePath = 'SuiteScripts/abj_cs_copy_previos_tor.js';
        var sublistId = 'recmachcustrecord_tori_id'; 
        var sublist = form.getSublist({
            id: sublistId
        });
        if (sublist) {
            sublist.addButton({
                id: 'custpage_btn_copy_previous',
                label: 'Copy Previous',
                functionName: 'copyPreviousLine' 
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});