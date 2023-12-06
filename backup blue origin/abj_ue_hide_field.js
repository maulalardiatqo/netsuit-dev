/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget", "N/ui/message"], function (runtime, log, serverWidget, message) {
  function beforeLoad(context) {
    if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {
      var currentRecord = context.newRecord;
      var countryValue = currentRecord.getValue({
        fieldId: 'country'
      });
      log.debug('countryValue', countryValue);

      var tranPrefixField = context.form.getField({
        id: 'custrecord_fcn_npwppgrs'
      });

      if (countryValue !== 'ID') {
        log.debug('masuk')
        tranPrefixField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        });
      }
      if (countryValue === 'ID') {
        log.debug('indonesia')
        tranPrefixField.isMandatory = true;
      }
    }
  }

  function beforeSubmit(context) {
    var currentRecord = context.newRecord;
    var countryValue = currentRecord.getValue({
      fieldId: 'country'
    }); 
    
    if(countryValue === 'ID'){
      var taxRegistrationNumber = currentRecord.getValue({
        fieldId: 'custrecord_fcn_npwppgrs'
      });
      if (!taxRegistrationNumber) {
        log.debug('masuk tax')
        
        throw new Error('ERROR: TAX REGISTRATION NUMBER field is required For Indonesian Country');
      }
    }
  }

  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit
  };
});
