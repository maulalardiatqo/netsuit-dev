/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/currentRecord'], function(currentRecord) {
    function checkboxOnChange(context) {
        var currentRecordObj = currentRecord.get();
        console.log('currentRecord', currentRecord);
        var isChecked = currentRecordObj.getValue({
        fieldId: 'custpage_checkbox_all_departement'
        });
        console.log('isChecked');
        var departmentField = currentRecordObj.getField({
        fieldId: 'custpage_department'
        });

        departmentField.isMandatory = isChecked ? false : true;
    }

    return {
        fieldChanged: checkboxOnChange
    };
});