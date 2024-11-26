/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog) {
    var records = currentRecord.get();

    function pageInit(context) {
        log.debug('init masuk');
    }

    function validateLine(context) {
        var sublistName = context.sublistId;
        if (sublistName === 'expense') {
            var currentRecordObj = context.currentRecord;

            var departmentHeader = currentRecordObj.getValue('department') || 0;

            var category = Math.abs(currentRecordObj.getCurrentSublistValue({
                sublistId: "expense",
                fieldId: "category",
            }));
            var departmnetLine = Math.abs(currentRecordObj.getCurrentSublistValue({
                sublistId: "expense",
                fieldId: "department",
            }));
            log.debug('category', category)
            log.debug('departmnetLine', departmnetLine)
            if(category){
                var recExpCategory = record.load({
                    type : 'expensecategory',
                    id : category
                })
                var listExp = recExpCategory.getValue('custrecord_rda_department_expense');
                log.debug('listExp', listExp);
                if (!listExp.includes(departmnetLine.toString())) {
                    log.debug('tidak ada data');
                    dialog.alert({
                        title: 'Warning!',
                        message: '<div style="color: red;">Category yang anda pilih tidak sesuai dengan department</div>'
                    });
                    return false;
                }
            }
            
        }
        return true; 
    }
    return {
        pageInit: pageInit,
        validateLine: validateLine
    };
});
