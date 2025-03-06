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
                    record.submitFields({
                        type: "itemfulfillment",
                        id: id,
                        values: {
                            custbody_rda_flag_centangpackinglist: false,
                            custbody_rda_nopol: ''
                        }
                    });

                }
            })
        }
    }
    function afterSubmit(context){
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
            var dataRec = context.newRecord;
            var nopol = dataRec.getValue('custbody_rda_packlist_nopol')
            var allIdFul = dataRec.getValue('custbody_rda_packlist_do_number');
            log.debug('allIdFul', allIdFul);
            allIdFul.forEach(function(id) {
                log.debug('id', id)
                if(id){
                    record.submitFields({
                        type: "itemfulfillment",
                        id: id,
                        values: {
                            custbody_rda_flag_centangpackinglist: true,
                            custbody_rda_nopol: nopol
                        }
                    });
                }
            });
        }
    }
    return {
        beforeSubmit: beforeSubmit,
        afterSubmit : afterSubmit
    };
});