/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/error'], function(record, search, error) {
  
    function beforeSubmit(context) {
      if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
        var currentRecord = context.newRecord;
        var idEntity = currentRecord.getValue('entity');
        
        if (idEntity) {
          var employeeRecord = record.load({
            type: 'employee', 
            id: idEntity
          });
          
          if (employeeRecord) {
            var giveAccess = employeeRecord.getValue('giveaccess');
            log.debug('cek', {idEntity:idEntity, giveAccess:giveAccess});
            if (!giveAccess) {
                var errorMsg = 'Access is not allowed for this employee.';
                throw new error.create({
                  name: 'INVALID_ACCESS',
                  message: errorMsg,
                  stack: errorMsg
                });
            }
          }
        }
      }
    }
  
    return {
      beforeSubmit: beforeSubmit
    };
  });
  