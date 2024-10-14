/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget"], (runtime, log, serverWidget) => {
    function hideField(form){
        log.debug('masuk function')
        try {
            var periodOffset = form.getField({
                id: 'periodoffset',
            });
            log.debug('periodOffset', periodOffset)
            if (periodOffset && typeof periodOffset !== 'undefined' && periodOffset !== null) {
                periodOffset.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            var startOffset = form.getField({
                id: 'revrecoffset',
            })
            if (startOffset && typeof startOffset !== 'undefined' && startOffset !== null) {
                startOffset.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
           
        } catch(error) {
            log.error({
                title: 'Error occurred when hiding field',
                details: JSON.stringify({
                    sublistId: "item"
                })
            });
        }
    }
    function beforeLoad(context) {
        log.debug('triggered')
        var form = context.form;
        var rec = context.newRecord;
        var recType = rec.type
        log.debug('recType', recType)
        if ( context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE || context.type === context.UserEventType.VIEW) {
            log.debug('masuk beforload')
            hideField(form);
            
        }
       
    }
return {
    beforeLoad: beforeLoad,
};
});