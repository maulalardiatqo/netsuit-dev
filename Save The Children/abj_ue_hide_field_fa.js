/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/record'], (serverWidget, record) => {

    const beforeLoad = (scriptContext) => {
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            
            var rec = scriptContext.newRecord;
            var recLoad = record.load({
                type : rec.type,
                id : rec.id
            })
            var transType = rec.type;
            var form = scriptContext.form;
            log.debug('Form Info', 'Type: ' + transType + ' | ID: ' + rec.id);

            var sublist;
            var isNeedHide = false;
            var idFieldFa;
            var idFieldStatus;

            if (transType === 'customrecord_tar') {
                isNeedHide = true;
                sublist = 'recmachcustrecord_tar_e_id';
                idFieldFa = 'custrecord_tar_approver_fa';
                idFieldStatus = 'custrecord_tar_apprvl_sts_fa';
            }
            if (transType === 'expensereport') {
                var cForm = recLoad.getValue('customform');
                if(cForm == '139'){
                    var expType = recLoad.getValue('custbody_stc_expense_report_type');
                    log.debug('expType', expType)
                    if(expType == '2' || expType == '3'){
                        isNeedHide = true;
                        sublist = 'expense';
                        idFieldFa = 'custcol_stc_approver_fa';
                        idFieldStatus = 'custcol_stc_apprvl_sts_fa';
                    }
                }
                
            }

            log.debug('isNeedHide', isNeedHide);

            if (isNeedHide) {
                form.clientScriptModulePath = "SuiteScripts/abj_cs_hide_field_fa.js";
            }
        }
    };

    return { beforeLoad };
});