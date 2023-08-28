/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/format', 'N/search'], function(serverWidget, file, record, format, search) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Upload and Process Data'
            });

            var fileField = form.addField({
                id: 'custpage_file',
                type: serverWidget.FieldType.FILE,
                label: 'Upload File'
            });

            fileField.isMandatory = true;

            form.addSubmitButton({
                label: 'Submit'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            var fileObj = context.request.files['custpage_file'];

            log.debug('file', fileObj);
            if (fileObj) {
                var fileContents = fileObj.getContents();
                log.debug('fileContent', fileContents);
                if (fileContents) {
                    try {
                        var lines = fileContents.split('\n');
                        var transactions = {}; 

                        lines.forEach(function(line, index) {
                            if (index > 0) {
                                var values = line.split(',');
                                if (values.length >= 14) {
                                    var subsidiary = 2
                                    var tranid = values[2];
                                    var trandate = values[3];
                                    var idAccount = values[6];
                                    var accountDepID = values[8];
                                    var memo = values[10]
                                    var memoLine = values[11];
                                    var amount = values[14];
                                    trandate = format.parse({value:trandate, type: format.Type.DATE});
                                    var searchTrandId = search.create({
                                        type : 'deposit',
                                        columns: ['trandid'],
                                        filters: [{
                                        name: 'trandid',
                                        operator: 'is',
                                        values: tranid
                                        }]
                                    }).run().getRange(0, 1);
                                    log.debug('searchTrandID', searchTrandId);	
                                    if (idAccount && tranid) {
                                        if (!transactions[tranid]) {
                                            transactions[tranid] = {
                                                idaccount: idAccount,
                                                trandate: trandate,
                                                accountDepID: accountDepID,
                                                subsidiary: subsidiary,
                                                memo:memo,
                                                lines: []
                                            };
                                        }
                                        
                                        var lineData = {
                                            memo: memoLine,
                                            amount: amount,
                                            accountDepID
                                        };

                                        transactions[tranid].lines.push(lineData);
                                    }
                                }
                            }
                        });
                        var successRec = 0;
                        for (var tranid in transactions) {
                            var transaction = transactions[tranid];
                            var newRecord = record.create({
                                type: 'deposit',
                                isDynamic: true
                            });
                            newRecord.setValue({
                                fieldId: 'account',
                                value: transaction.idaccount,
                                ignoreFieldChange: true
                            });
                            newRecord.setValue({
                                fieldId: 'tranid',
                                value: transaction.tranid,
                                ignoreFieldChange: true
                            });
                            newRecord.setValue({
                                fieldId: 'trandate',
                                value: transaction.trandate,
                                ignoreFieldChange: true
                            });
                            newRecord.setValue({
                                fieldId: 'subsidiary',
                                value: transaction.subsidiary,
                                ignoreFieldChange: true
                            });
                            newRecord.setValue({
                                fieldId: 'memo',
                                value: transaction.memo,
                                ignoreFieldChange: true
                            });
                            
                            transaction.lines.forEach(function (lineData) {
                                newRecord.selectNewLine({
                                    sublistId: 'other'
                                });

                                newRecord.setCurrentSublistValue({
                                    sublistId: 'other',
                                    fieldId: 'account',
                                    value: lineData.accountDepID
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: 'other',
                                    fieldId: 'memo',
                                    value: lineData.memo
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: 'other',
                                    fieldId: 'amount',
                                    value: lineData.amount
                                });

                                newRecord.commitLine({
                                    sublistId: 'other'
                                });
                            });

                            var recordId = newRecord.save();
                            log.debug('New record created with ID:', recordId);
                            if(recordId){
                                successRec++;
                            }
                            
                        }
                        context.response.write('<h2>Success</h2><p>import ' + successRec + 'record.</p>');
                    } catch (e) {
                        log.error('Error processing file:', e);
                    }
                } else {
                    log.error('Uploaded file is empty');
                }
            } else {
                log.error('No file uploaded');
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
