/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            var recLoad = record.load({
                type : 'customrecord_tor',
                id : rec.id
            })
            var showBtn = false
            var status = recLoad.getValue('custrecord_tor_status');
            var allLine = recLoad.getLineCount({
                sublistId : 'recmachcustrecord_tori_id'
            })
            if(allLine > 0){
                for(var i = 0; i < allLine; i ++){
                    var cekTransType = recLoad.getSublistValue({
                        sublistId : '',
                        fieldId : 'custrecord_tor_transaction_type',
                        line : i
                    })
                    if(cekTransType && cekTransType != '' && cekTransType != null){
                        showBtn = true;
                        
                    }
                }
            }
            if(showBtn){
                form.addButton({
                    id: 'custpage_btn_transform',
                    label: "Transform",
                    functionName: "transform()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_go_to_sof.js"
            }
        }
    }
    return{
        beforeLoad : beforeLoad
    }
});