/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/ui/dialog'], function(record, dialog) {
    var previousEntityValue = null;
  
    function onChangeField(context) {
      var currentRecord = context.currentRecord;
      var fieldId = context.fieldId;
  
      if (fieldId === 'entity') {
        var entityValue = currentRecord.getValue({ fieldId: 'entity' });
  
        if (entityValue !== previousEntityValue) {
          console.log('entityValue', entityValue);
          previousEntityValue = entityValue;
  
          if (entityValue) {
            var employeeRecord = record.load({ type: 'employee', id: entityValue });
            var giveAccessValue = employeeRecord.getValue({ fieldId: 'giveaccess' });
  
            if (!giveAccessValue) {
              dialog.alert({
                title: 'Warning',
                message: 'User Dont have access'
              });
            }
          }
        }
      }
    }
  
    return {
      fieldChanged: onChangeField
    };
  });
  