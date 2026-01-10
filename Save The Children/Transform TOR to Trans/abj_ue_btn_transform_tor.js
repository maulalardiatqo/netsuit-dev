/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record"], (runtime, log, record) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            var recLoad = record.load({
                type : 'customrecord_tor',
                id : rec.id
            })
            var showBtnPR = false
            var showBtnExp = false
            var showBtnPO = false
            var showBtnTar = false
            var status = recLoad.getValue('custrecord_tor_status');
            if(status == '2'){
                var allLine = recLoad.getLineCount({
                    sublistId : 'recmachcustrecord_tori_id'
                })
                log.debug('allLine', allLine)
                if(allLine > 0){
                    for(var i = 0; i < allLine; i ++){
                        var cekTransType = recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_tor_transaction_type',
                            line : i
                        })
                        
                        var createdTrans = recLoad.getSublistValue({
                            sublistId : 'recmachcustrecord_tori_id',
                            fieldId : 'custrecord_tor_link_trx_no',
                            line : i
                        })
                        log.debug('cekTransType', cekTransType)
                        if(cekTransType == '1' && (createdTrans == '' || createdTrans == null)){
                            showBtnPO = true
                        }
                        if(cekTransType == '2' && (createdTrans == '' || createdTrans == null)){
                            showBtnExp = true
                        }
                        if(cekTransType == '3' && (createdTrans == '' || createdTrans == null)){
                            showBtnPR = true
                        }
                        if(cekTransType == '4' && (createdTrans == '' || createdTrans == null)){
                            showBtnTar = true
                        }
                    }
                }
                if(showBtnPR){
                    form.addButton({
                        id: 'custpage_btn_transform_pr',
                        label: "Transform PR",
                        functionName: "transformPR()"
                    });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_transaction.js"
                }
                if(showBtnPO){
                    form.addButton({
                        id: 'custpage_btn_transform_po',
                        label: "Transform PO",
                        functionName: "transformPO()"
                    });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_transaction.js"
                }
                if(showBtnExp){
                    form.addButton({
                        id: 'custpage_btn_transform_exp',
                        label: "Transform Expense Management",
                        functionName: "transformExp()"
                    });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_transaction.js"
                }
                if(showBtnTar){
                    form.addButton({
                        id: 'custpage_btn_transform_tar',
                        label: "Transform TAR",
                        functionName: "transformTar()"
                    });
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_transaction.js"
                }
            }
            
        }
    }
    return{
        beforeLoad : beforeLoad
    }
});