 /**
     * @NApiVersion 2.1
     * @NScriptType UserEventScript
     * @NModuleScope SameAccount
     */
define(['N/ui/serverWidget', 'N/record', 'N/error', 'N/ui/message', 'N/search'], function(ui, record, error, message, search) {

    function beforeLoad(context) {
        if(context.type === context.UserEventType.VIEW){
            try{
                var form = context.form;
                var currentRecord = context.newRecord;
                var idRec = currentRecord.id;
                var cekBin = currentRecord.getValue("custbody_ajb_bin_transfer_no");
                if(cekBin == ''){
                    form.addButton({
                        id: 'custpage_generatebin',
                        label: 'Check Bin',
                        functionName: 'onButtonClick('+ idRec +')',
                    });
                }
                
                context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_autogeneratebin.js';
            }catch (error) {
                log.error({
                    title: 'custpage_change_print_title',
                    details: error.message
                });
            }
        }
    } 
    return {
        beforeLoad: beforeLoad,
    }
    });
