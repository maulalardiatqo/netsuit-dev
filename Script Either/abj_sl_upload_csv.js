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
                                if (values.length >= 15) {
                                    var subsidiary = 12
                                    var tranid = values[2];
                                    var trandate = values[3];
                                    var idAccount = values[6];
                                    var accountDepID = values[8];
                                    var memo = values[10]
                                    var memoLine = values[11];
                                    var amount = values[14];
                                    var periodId = values[15].replace(/\r/g, '');
                                    log.debug('trandate atas', trandate);
                                    if(trandate){
                                        trandate = format.parse({value:trandate, type: format.Type.DATE});
                                    }
                                    
                                    log.debug('data', {'subsidiary' : subsidiary, 'tranid' : tranid, 'trandate' : trandate, 'idAccount' : idAccount, 'accountdepid' : accountDepID, 'memo' : memo, 'memoLine' : memoLine, 'amount' : amount, 'periodId' : periodId});
                                    if (idAccount && tranid) {
                                        if (!transactions[tranid]) {
                                            transactions[tranid] = {
                                                tranid : tranid,
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
                                            memoLine: memoLine,
                                            amount: amount,
                                            accountDepID
                                        };
                                        log.debug('lineData', lineData)
                                        transactions[tranid].lines.push(lineData);
                                    }
                                }
                            }
                        });
                        var successRec = 0;
                        var recIDArry = []

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
                            log.debug('setAccount',transaction.idaccount)
                            newRecord.setValue({
                                fieldId: 'tranid',
                                value: transaction.tranid,
                                ignoreFieldChange: true
                            });
                            log.debug('setTranid', transaction.tranid)
                            newRecord.setValue({
                                fieldId: 'trandate',
                                value: transaction.trandate,
                                ignoreFieldChange: true
                            });
                            log.debug('setTrandate', transaction.trandate)
                            newRecord.setValue({
                                fieldId: 'postingperiod',
                                value: transaction.periodId,
                                ignoreFieldChange: true
                            });
                            log.debug('setPostingPeriod', transaction.periodId)
                            newRecord.setValue({
                                fieldId: 'subsidiary',
                                value: transaction.subsidiary,
                                ignoreFieldChange: true
                            });
                            log.debug('setSubsidiary', transaction.subsidiary)
                            newRecord.setValue({
                                fieldId: 'memo',
                                value: transaction.memo,
                                ignoreFieldChange: true
                            });
                            log.debug('setMemo', transaction.memo)
                            transaction.lines.forEach(function (lineData) {
                                newRecord.selectNewLine({
                                    sublistId: 'other'
                                });

                                newRecord.setCurrentSublistValue({
                                    sublistId: 'other',
                                    fieldId: 'account',
                                    value: lineData.accountDepID
                                });
                                log.debug('setAccountLine', lineData.accountDepID)
                                newRecord.setCurrentSublistValue({
                                    sublistId: 'other',
                                    fieldId: 'memo',
                                    value: lineData.memoLine
                                });
                                log.debug('setMemoLine', lineData.memoLine)
                                newRecord.setCurrentSublistValue({
                                    sublistId: 'other',
                                    fieldId: 'amount',
                                    value: lineData.amount
                                });
                                log.debug('setAmount', lineData.amount)
                                newRecord.commitLine({
                                    sublistId: 'other'
                                });
                                log.debug('setCommitLine')
                            });

                            var recordId = newRecord.save();
                            log.debug('New record created with ID:', recordId);
                            if(recordId){
                                successRec++;
                                recIDArry.push(recordId)
                            }
                            
                        }
                        log.debug('recIDArry', recIDArry);
                        context.response.write('<h2>Success</h2><p>import ' + successRec + 'record with ID ['+ recIDArry.join(', ') +']</p>');
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
