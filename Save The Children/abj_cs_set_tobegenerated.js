/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], function () {

    function pageInit(context) {
        try {
            if (context.mode === 'create') {
                var rec = context.currentRecord;

                rec.setValue({
                    fieldId: 'itemid',
                    value: 'To Be generated'
                });

                var fieldEl = document.getElementById('itemid'); 
                if (fieldEl) {
                    fieldEl.disabled = true;
                }
            }
        } catch (e) {
            console.log('Error pageInit:', e);
        }
    }

    return {
        pageInit: pageInit
    };
});
