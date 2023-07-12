    /**
     * @NApiVersion 2.1
     * @NScriptType UserEventScript
     * @NModuleScope SameAccount
     */
    define(['N/ui/serverWidget', 'N/record', 'N/error', 'N/ui/dialog'], function(ui, record, error, dialog) {

        function beforeLoad(context) {
            if (context.type === context.UserEventType.EDIT) {
                var record = context.newRecord;
                var etrisProcessName = record.getValue({ fieldId: 'custbody_sol_etris_process_name' });
                if (etrisProcessName) { // jika etrisProcessName memiliki nilai
                  var lockedFields = ['custbody_sol_cjv_print_title']; // field yang tidak dikunci
                  var fields = record.getFields();
                  for (var i = 0; i < fields.length; i++) {
                    var fieldId = fields[i];
                    if (!lockedFields.includes(fieldId)) { // jika field tidak termasuk field yang tidak dikunci
                      var field = record.getField({ fieldId: fieldId });
                      if (field) { // jika field ditemukan
                        field.isDisabled = true; // kunci field
                      }
                    }
                  }
                  alert('CJV is Locked'); // tampilkan pesan
                }
            }
            if(context.type === context.UserEventType.VIEW){
                try{
                      //   console.log('idRec', idRec);
      // var suiteletUrl = url.resolveScript({
      //   scriptId: 'customscript_abj_lock_cjv_sl',
      //   deploymentId: 'customdeploy_abj_lock_cjv_sl',
      //   returnExternalUrl: false
      // });
      // console.log('suiteurl', suiteletUrl);
      // window.location.href = suiteletUrl + "&idrec=" + idRec;
                    var form = context.form;
                    var currentRecord = context.newRecord;
                    var idRec = currentRecord.id;
                    log.debug('idRec', idRec);
                    var processName = currentRecord.getValue('custbody_sol_etris_process_name');
                    log.debug('processName', processName);
                    if(processName){
                        form.addButton({
                        id: 'custpage_change_print_title',
                        label: 'Change Print Title',
                        functionName: 'onButtonClick('+ idRec +')',
                        });
                        context.form.clientScriptModulePath = 'SuiteScripts/lock_cjv_cs.js';
                    }
                }catch (error) {
                    log.error({
                        title: 'custpage_change_print_title',
                        details: error.message
                    });
                }
            }
        } 
        return {
            beforeLoad: beforeLoad,
        }
        });
    