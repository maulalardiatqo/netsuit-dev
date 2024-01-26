/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/format', 'N/search', 'N/runtime'], function(serverWidget, file, record, format, search, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Upload and Process Data'
            });

            // var fileField = form.addField({
            //     id: 'custpage_file',
            //     type: serverWidget.FieldType.FILE,
            //     label: 'Upload File'
            // });

            // fileField.isMandatory = true;

            form.addSubmitButton({
                label: 'Submit'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            var userObj = runtime.getCurrentUser();
            log.debug('userObj', userObj);
            try {
                var fileId = '73914'
                var fileObj = file.load({ id: fileId });
                var fileContent = fileObj.getContents();
                log.debug('fileCOntent', fileContent);

                var lines = fileContent.split('\n');
                var columnNames = lines[0].split(',');

                var data = [];
                for (var i = 1; i < lines.length; i++) {
                    var rowData = lines[i].split(',');
                    var rowObject = {};
                    for (var j = 0; j < columnNames.length; j++) {
                        rowObject[columnNames[j]] = rowData[j];
                    }
                    data.push(rowObject);
                }
                // log.debug('Column Names', columnNames);
                // log.debug('Data', data);
                
                var successSave = [];
                var flaseSave = [];
                var lastNumber
                var countRecord = 0
                var allIdIFSuccess = []
                for (var i = 0; i < data.length; i++) {
                    var rowData = data[i];
                    var cekNo = rowData.cekNo;
                    if(cekNo){
                        var idSO = cekNo
                        var documentNumber = rowData.documentNumber
                        var transDate = rowData.date

                        var parts = transDate.split('/');
                        var formattedDate = parts[2] + '-' + parts[1] + '-' + parts[0];
                        log.debug('formattedDate', formattedDate);
                        var year = parts[2];
                        var month = parts[1];
    
                        var monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        var monthText = monthNames[parseInt(month, 10)];
    
                        var periodDate = monthText + ' ' + year;
    
                        log.debug('periodDate', periodDate);
                        var accountingperiodSearchObj = search.create({
                            type: "accountingperiod",
                            filters:
                            [
                                ["periodname","is", periodDate]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "periodname",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({name: "internalid", label: "Internal ID"})
                            ]
                        });
                        var periodId
                        var searchResultCount = accountingperiodSearchObj.runPaged().count;
                        accountingperiodSearchObj.run().each(function(result){
                            var internalIdPeriod = result.getValue({
                                name : 'internalid'
                            })
                            periodId = internalIdPeriod
                        return true;
                        });
                        // log.debug('periodId', periodId)
                        date = new Date(formattedDate);
                        log.debug('date', date)

                        var recTransform = record.transform({
                            fromType: record.Type.SALES_ORDER,
                            fromId: idSO,
                            toType: record.Type.ITEM_FULFILLMENT,
                            isDynamic: true,
                        });
                        var lineTotal = recTransform.getLineCount({
                            sublistId: 'item'
                        });
                        log.debug('lineTotal', lineTotal);
                        recTransform.setValue({
                            fieldId: 'customform',
                            value: '40',
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'tranid',
                            value: documentNumber,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'transactionnumber',
                            value: documentNumber,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'trandate',
                            value: date,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'postingperiod',
                            value: periodId,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'shipstatus',
                            value: 'C',
                            ignoreFieldChange: true
                        });
                        for (var j = 0; j < lineTotal; j++) {
                            recTransform.selectLine({
                                sublistId: 'item',
                                line: j
                            });
                            var itemId = recTransform.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                            });
                            log.debug('itemId', itemId)
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: itemId
                            });
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'itemreceive',
                                value: true
                            });
                            recTransform.commitLine({ sublistId: 'item' });
                        }
                        var recTransformSave = recTransform.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        
                        if(recTransformSave){
                            log.debug('recTransformSave', recTransformSave);
                            countRecord++
                            successSave.push(documentNumber)
                            lastNumber = documentNumber
                            allIdIFSuccess.push(recTransformSave)
                        }else{
                            flaseSave.push(documentNumber)
                        }
                    }
                }
                log.debug('successSave', successSave);
                log.debug('countRecord', countRecord);
                log.debug('falseSave', flaseSave);
                log.debug('lastNumber', lastNumber);
                log.debug('allIdIFSuccess', allIdIFSuccess);
    
            }catch(e){
                log.debug('error', e)
            }
            
        }
    }

    return {
        onRequest: onRequest
    };
});
