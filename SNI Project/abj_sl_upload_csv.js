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
                var userObj = runtime.getCurrentUser();
                log.debug('userObj', userObj);
                var fileId = '73914'
                var fileObj = file.load({ id: fileId });
                var fileContent = fileObj.getContents();
                // log.debug('fileCOntent', fileContent);
    
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
                log.debug('Data', data);
    
                var groupedData = {};
                for (var i = 0; i < data.length; i++) {
                    var rowData = data[i];
                    var cekNo = rowData.date;
                    var transactionNum = rowData.transactionNumber
                    var date = rowData.date;
                    var idVendor = rowData.internalIdVendor
                    var memo = rowData.memo
                    var dueDate = rowData.dueDate
                    var locationId = rowData.locationId
                    var idPo = rowData.internLIdPO
                    log.debug('internaidPO', idPo)
                    var productCode = rowData.productCode
                    var qty = rowData.qty
                    var unit = rowData.unit
                    var taxcode = rowData.taxRateId
                    var unitPrice = rowData.unitPrice
                    var rate = rowData.rate
                    var discountLine = rowData.discountLine
                    var amount = rowData.amount
                    var grossAmount = rowData.grossAmount
                    if(cekNo){
                        if (!groupedData[transactionNum]) {
                            groupedData[transactionNum] = [];
                        }
                        groupedData[transactionNum].push({
                            date: date,
                            transactionNumber: transactionNum,
                            internalIdVendor: idVendor,
                            memo: memo,
                            dueDate: dueDate,
                            locationId: locationId,
                            internLIdPO: idPo,
                            productCode: productCode,
                            qty: qty,
                            unit: unit,
                            taxcode : taxcode,
                            unitPrice: unitPrice,
                            rate: rate,
                            discountLine: discountLine,
                            amount: amount,
                            grossAmount: grossAmount
                        });
                    }
                    
                }
                var countRecord = 0
                var transNumberSuccess = [];
                var transNumberFalss = [];
                var transNumberDoubleItem = [];
                for (var transactionNum in groupedData) {
                    if (groupedData.hasOwnProperty(transactionNum)) {
                        var transactionGroup = groupedData[transactionNum];
                        var headerData = transactionGroup[0]; 
                
                        var transDate = headerData.date;
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
                        var date = new Date(formattedDate);
                        transDate = date
    
                        var transactionNumber = headerData.transactionNumber;
                        var internalIdVendor = headerData.internalIdVendor;
                        var idPo = headerData.internLIdPO
                        var memo = headerData.memo;
                        var dueDate = headerData.dueDate;
                        if(dueDate){
                            var part = dueDate.split('/');
                            var formatDue = part[2] + '-' + part[1] + '-' + part[0];
                            var due = new Date(formatDue);
                            dueDate = due
                        }
                        // log.debug('dueDate', dueDate);
                        var locationId = headerData.locationId;
    
                        log.debug('data header', {
                            transDate : transDate,
                            transactionNumber : transactionNumber,
                            internalIdVendor : internalIdVendor
                        })
                        log.debug('idPO', idPo)
                        var recTransform = record.transform({
                            fromType: record.Type.PURCHASE_ORDER,
                            fromId: idPo,
                            toType: record.Type.VENDOR_BILL,
                            isDynamic: true,
                        });
                        var lineTotal = recTransform.getLineCount({
                            sublistId: 'item'
                        });
                        log.debug('lineTotal', lineTotal);
    
                        recTransform.setValue({
                            fieldId: 'transactionnumber',
                            value: transactionNumber,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'tranid',
                            value: transactionNumber,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'trandate',
                            value: transDate,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'postingperiod',
                            value: periodId,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'entity',
                            value: internalIdVendor,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'memo',
                            value: memo,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'duedate',
                            value: dueDate,
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'custbody_sp_type_purch',
                            value: '2',
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'subsidiary',
                            value: '13',
                            ignoreFieldChange: true
                        });
                        recTransform.setValue({
                            fieldId: 'location',
                            value: locationId,
                            ignoreFieldChange: true
                        });
                    }
                    var itemToProcess = []
                    var lineToRemove = []
                    var allItem = []
                    log.debug('transactionGroup', transactionGroup.length)
                    
                    for (var i = 0; i < transactionGroup.length; i++) {
                        var lineData = transactionGroup[i];
                        var productCode = lineData.productCode
                        var qty = lineData.qty
                        var unit = lineData.unit
                        var unitPrice = lineData.unitPrice
                        var rate = lineData.rate
                        var discountLine = lineData.discountLine
                        var taxcode = lineData.taxcode
                        var amount = lineData.amount
                        var locationId = lineData.locationId
                        if(discountLine){
                            discountLine = discountLine.replace('%','')
                        }
                        var amount = lineData.amount
                        var grossAmount = lineData.grossAmount
    
                        var itemSearchObj = search.create({
                            type: "item",
                            filters:
                            [
                                ["name","is", productCode]
                            ],
                            columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({name: "stockunit", label: "Primary Stock Unit"}),
                            ]
                        });
                        var searchResultCount = itemSearchObj.runPaged().count;
                        var idUnit
                        itemSearchObj.run().each(function(result){
                            var idItem = result.getValue({
                                name : "internalid"
                            })
                            var units = result.getValue({
                                name:"stockunit"
                            })
                            idUnit = units
                            productCode = idItem
                            return true;
                        });
                        itemToProcess.push({
                            productCode: productCode,
                            itemId: itemId,
                            qty: qty,
                            idUnit: idUnit,
                            locationId: locationId,
                            taxcode: taxcode,
                            rate: rate,
                            amount: amount,
                            discountLine: discountLine,
                            grossAmount: grossAmount
                        });
                        
                        
                    }
                    productCodeToCheck = [];
                    for (var j = 0; j < lineTotal; j++) {
                        recTransform.selectLine({
                            sublistId: 'item',
                            line: j
                        });
                        var itemId = recTransform.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                        });
                        // lineToRemove.push(j)
                        var itemMatched = itemToProcess.find(item => item.productCode === itemId);
                        log.debug('itemMatched', itemMatched)
                        if (itemMatched === ' ' || !itemMatched) {
                            log.debug('itemMatch kosong')
                            lineToRemove.push(j);
                        }else{
                            productCodeToCheck.push(itemId);
                            var qty = itemMatched.qty;
                            var idUnit = itemMatched.idUnit;
                            var locationId = itemMatched.locationId;
                            var taxcode = itemMatched.taxcode;
                            var rate = itemMatched.rate;
                            var amount = itemMatched.amount;
                            var discountLine = itemMatched.discountLine;
                            var grossAmount = itemMatched.grossAmount;
    
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: itemId
                            });
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                value: qty
                            });
                            log.debug('idUnit', idUnit);
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'units',
                                value: idUnit
                            });
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                value: locationId
                            });
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'department',
                                value: '1'
                            });
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                value: taxcode
                            });
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: rate
                            });
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: amount
                            });
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol3',
                                value: discountLine
                            });
                            recTransform.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                value: grossAmount
                            });
                            recTransform.commitLine({ sublistId: 'item' });
                        }
                        
                    }
                    log.debug('productCodeToCheck',productCodeToCheck)
                    var duplicateFound = false;

                    for (var i = 0; i < productCodeToCheck.length - 1; i++) {
                        for (var j = i + 1; j < productCodeToCheck.length; j++) {
                            if (productCodeToCheck[i] === productCodeToCheck[j]) {
                                duplicateFound = true;
                                break;
                            }
                        }
                        if (duplicateFound) {
                            break;
                        }
                    }

                    if (duplicateFound) {
                        log.debug('ada data yang sama');
                        transNumberDoubleItem.push(transactionNumber)
                    }
                    log.debug('itemToProcessLength', itemToProcess.length)
                    log.debug('lineToRemove', lineToRemove)
                    log.debug('lineToRemoveLength', lineToRemove.length)
                    // itemToProcess.forEach((data)=>{
                    //     var productCode = data.productCode
                    //     var qty = data.qty
                    //     var idUnit = data.idUnit
                    //     var locationId = data.locationId
                    //     var taxcode = data.taxcode
                    //     var rate = data.rate
                    //     var amount = data.amount
                    //     var discountLine = data.discountLine
                    //     var grossAmount = data.grossAmount
    
                    //     recTransform.selectLine({ sublistId: 'item' });
                        
                    // })
                    for (var i = lineToRemove.length - 1; i >= 0; i--) {
                        recTransform.removeLine({
                            sublistId: 'item',
                            line: lineToRemove[i]
                        });
                    }
                    
                    var custBody1 = recTransform.getValue('custbody1');
                    recTransform.setValue({
                        fieldId: 'custbody1',
                        value: '200281',
                        ignoreFieldChange: true
                    });
                    log.debug('after set custbody1')
                    var recTransformSave = recTransform.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    if(recTransformSave){
                        log.debug('recTransformSave', recTransformSave);
                        countRecord++
                        transNumberSuccess.push(transactionNum)
                    }else{
                        transNumberFalss.push(transactionNumber)
                    }
                }
                log.debug('countRecord', countRecord)
                log.debug('transNumberSuccess', transNumberSuccess);
                log.debug('transNumberFalss', transNumberFalss)
                log.debug('transactionNumberDoubleItem', transNumberDoubleItem);
    
            }catch(e){
                log.debug('error', e)
            }
            
        }
    }

    return {
        onRequest: onRequest
    };
});
