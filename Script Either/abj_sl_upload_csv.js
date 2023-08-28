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
                                    log.debug('trandate atas', trandate);
                                    if(trandate){
                                        var trandateToConve = trandate;
                                        trandate = format.parse({value:trandateToConve, type: format.Type.DATE});
                                        
                                        var parts = trandateToConve.split("/");
                                        var month = parseInt(parts[0]);
                                        var day = parseInt(parts[1]);
                                        var year = parseInt(parts[2]);
                                        var dateObject = new Date(year, month - 1, day);
                                        var monthIndex = dateObject.getMonth();
                                        var yearIndex = dateObject.getFullYear();
                                        log.debug('monthIndex', monthIndex);
                                        
                                        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                        var periodMonth = months[monthIndex];
                                        var periodYear = yearIndex
                                        var postingPeriod = periodMonth + ' ' + periodYear
                                        log.debug('postingPeriod', postingPeriod);
                                        log.debug('periodMonth', periodMonth);
                                        var searchPeriod = search.load({
                                            id : 'customsearch_acounting_period'
                                        });
                                        searchPeriod.filters.push(search.createFilter({
                                            name: 'periodname',
                                            operator: search.Operator.IS,
                                            values: postingPeriod
                                        }));
                                        var postingPeriodDataSet = searchPeriod.run();
                                        searchPeriod = postingPeriodDataSet.getRange(0, 1);
                                        var periodId = searchPeriod[0].getValue('internalid');
                                        log.debug('periodid', periodId);
                                    }
                                    
                                    
                                    if (idAccount && tranid) {
                                        if (!transactions[tranid]) {
                                            transactions[tranid] = {
                                                idaccount: idAccount,
                                                trandate: trandate,
                                                accountDepID: accountDepID,
                                                subsidiary: subsidiary,
                                                memo:memo,
                                                periodId,
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
                            log.debug('trandate', transaction.trandate)
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
                                fieldId: 'postingperiod',
                                value: transaction.periodId,
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
