/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

 define(['N/ui/serverWidget', "N/record", "N/ui/message"], function(serverWidget, record, message) {

    function onRequest(context) {
       
        if (context.request.method === 'GET') {
            var idRecord = context.request.parameters.idrec
            log.debug('idrecord', idRecord);
            var form = serverWidget.createForm({
                title: 'Edit Print Title'
            });

            // Create a field group
            var fieldGroup = form.addFieldGroup({
                id: 'field_group',
                label: 'Field Group'
            });
            var idrecField = form.addField({
                id: 'custpage_idrec',
                label: 'IDREC',
                type: serverWidget.FieldType.TEXT,
                container: 'field_group'
            });
            idrecField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            idrecField.defaultValue = idRecord;
            // Add a select option field
            var printTitle = form.addField({
                id: 'print_title',
                label: 'PRINT TITLE',
                type: serverWidget.FieldType.SELECT,
                container: 'field_group'
            });
            printTitle.addSelectOption({
                value: '1',
                text: 'Official Receipt'
            });
            printTitle.addSelectOption({
                value: '2',
                text: 'Payment voucher'
            });
            printTitle.addSelectOption({
                value: '3',
                text: 'AR Journal'
            });
            printTitle.addSelectOption({
                value: '4',
                text: 'AP Journal'
            });

            // Add a submit button
            form.addSubmitButton({
                label: "Submit",
              });

            // Set the client script
            form.clientScriptModulePath = 'SuiteScripts/lock_cjv_cs.js';

            // Write the page
            context.response.writePage(form);

        } else {
            log.debug('masuk else');
            var selectedValue = context.request.parameters.print_title;
            log.debug('selectedValue', selectedValue);
            var idRecord = context.request.parameters.custpage_idrec
            log.debug('idrecordElse', idRecord);
            // Get the current record
            if(idRecord){
                log.debug('masuk if idRecord')
                var rec =  record.load({
                    type: 'customtransaction_sol_custom_journal',
                    id: idRecord,
                    isDynamic: true,
                  });
                rec.setValue({
                    fieldId: 'custbody_sol_cjv_print_title',
                    value: selectedValue,
                    ignoreFieldChange: true
                });
                var recordidSave = rec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                    });
                log.debug('recordidSave', recordidSave)
            }
            if(recordidSave){
                var html = "<html><body>";
                html += "<h3>Print Title Updated</h3>";
                html +=
                    '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-2)" value="OK" />';
                    html += "</body></html>";
            
                    var form = serverWidget.createForm({
                    title: "Success Edit Print Title",
                    });
                form.addPageInitMessage({
                            type: message.Type.CONFIRMATION,
                            title: "Success!",
                            message: html,
                        });
                context.response.writePage(form);
              }
              
        }

    }

    return {
        onRequest: onRequest
    };

});
