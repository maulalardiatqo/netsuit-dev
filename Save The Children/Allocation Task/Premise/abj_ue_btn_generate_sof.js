/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record"], (runtime, log, record) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            var form = context.form;
            var rec = context.newRecord;
            var cForm = rec.getValue('customform');
            log.debug('cForm', cForm)
            if(cForm == 140){
                log.debug('masuk sini')
                form.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                form.addButton({
                    id: 'custpage_btn_calculate',
                    label: "Calculate Debit Credit",
                    functionName: "calculate()"
                });
                var subItem = form.getSublist({
                    id : 'line'
                });
                subItem.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                subItem.addButton({
                    id: 'custpage_btn_calculate',
                    label: "Calculate Debit Credit",
                    functionName: "calculate()"
                });

                var sublistCustom = form.getSublist({
                    id : 'recmachcustrecord_stc_trx_id_allocation'
                })
                sublistCustom.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                sublistCustom.addButton({
                    id: 'custpage_btn_calculate',
                    label: "Calculate Debit Credit",
                    functionName: "calculate()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_je_premis.js"
            }
            if(cForm == 141){
                form.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "onClickGenerate()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_je_non_premis.js"
            }
        }
    }
    function afterSubmit(context) {
        if(context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT){
            
            try {
                var recId = context.newRecord.id;
                var recType = context.newRecord.type;
                var rec = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: true
                });
                var cForm = rec.getValue('customform');
                log.debug('cForm', cForm)
                if(cForm == 140){
                    var lineCount = rec.getLineCount({
                        sublistId: 'line'
                    });

                    if (lineCount > 0) {
                        for (var i = lineCount - 1; i >= 0; i--) {

                            var debit = rec.getSublistValue({
                                sublistId: 'line',
                                fieldId: 'debit',
                                line: i
                            }) || 0;

                            var credit = rec.getSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                line: i
                            }) || 0;

                            if ((credit === 0 || credit === '' || credit == null) &&
                                (debit === 0 || debit === '' || debit == null)) {

                                log.debug('Removing line', 'Line ' + i + ' removed (debit=0 & credit=0)');
                                rec.removeLine({
                                    sublistId: 'line',
                                    line: i
                                });
                            }
                        }

                        rec.save({
                            ignoreMandatoryFields: true
                        });
                    }
                }
                

            } catch (e) {
                log.error('Error afterSubmit', e);
            }
        }
    }
return {
    beforeLoad: beforeLoad,
    afterSubmit : afterSubmit
};
});