/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log'], (runtime, log) => {
    function beforeLoad(scriptContext) {
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            try {
                const objForm = scriptContext.form;
                var currentRecord = scriptContext.newRecord;
                var linkJournal = currentRecord.getValue({
                    fieldId: 'custbody_void_custom_journal'
                });
                var chequeNumb = currentRecord.getValue({
                    fieldId: 'custbody_sol_etris_cheque'
                });
                log.debug('linkJournal', linkJournal);
              if (!chequeNumb) {
               objForm.addButton({
                   id: 'custpage_generate_number_cheque',
                   label: 'Generate Cheque Number',
                   functionName: 'generateNumber'
               }); 
              }
                if(!linkJournal){
                    log.debug('masukif')
                    objForm.addButton({
                        id: 'custpage_generate_void_cjv',
                        label: 'Void Custom Journal',
                        functionName: 'voidCustomJournal'
                    });
                }
                
                // scriptContext.form.clientScriptModulePath = "SuiteScripts/HRDC/Vendor Portal/running_number_cheque_cs.js";

                  scriptContext.form.clientScriptModulePath = "SuiteScripts/running_number_cheque_cs.js";
            } catch (error) {
            log.error({
                title: 'custpage_generate_number_cheque',
                details: error.message
            });
            }
      }
    }
    return {
      beforeLoad: beforeLoad
    };
  });