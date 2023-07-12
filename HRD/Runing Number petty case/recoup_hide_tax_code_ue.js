/**
	 * @NApiVersion 2.1
	 * @NScriptType UserEventScript
	 */
define(['N/search', 'N/record', 'N/ui/serverWidget', 'N/log'], function(search, record, serverWidget, log){
function beforeLoad(scriptContext){
    if(scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.CREATE){
        log.debug('Masuk');
        try{
                var curForm = scriptContext.form;
                var objSublist = curForm.getSublist({
                    id: 'expense',
                });
                var fieldSublist = objSublist.getField({
                    id: 'taxcode', 
                    });
                fieldSublist.isMandatory = false;

                fieldSublist.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                 });
            }
            
            catch(error){
                log.error({
                    title: 'beforSubmit',
                    details: error.message
                  });
            
            }
        }
    }
    return {
        beforeLoad: beforeLoad,
    }

});