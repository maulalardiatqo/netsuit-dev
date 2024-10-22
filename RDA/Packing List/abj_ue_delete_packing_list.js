/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect", "N/format"], function (record, search, serverWidget, runtime, currency, redirect, format) {

    function beforeSubmit(context) {
        if (context.type == context.UserEventType.DELETE) {
            var dataRec = context.oldRecord;
            var dataRecID = context.oldRecord.id;
            var allIdFul = dataRec.getValue('custbody_rda_packlist_do_number');
            log.debug('allIdFul', allIdFul)
            allIdFul.forEach(function(id) {
                if(id){
                    var recIf = record.load({
                        type: "itemfulfillment",
                        id : id,
                        isDynamic: true
                    });
                    recIf.setValue({
                        fieldId : "custbody_rda_flag_centangpackinglist",
                        value : false,
                    });
                    recIf.setValue({
                        fieldId : "custbody_rda_nopol",
                        value : '',
                    });
                    recIf.save();

                }
            })
        }
    }
    return {
        beforeSubmit: beforeSubmit,
    };
});