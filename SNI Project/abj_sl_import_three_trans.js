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

            // log.debug('file', fileObj);
            if (fileObj) {
                var fileContents = fileObj.getContents();
                // log.debug('fileContent', fileContents);
                if (fileContents) {
                    try {
                        var returnSave = []
                        var IRsave = []
                        var creditMemoSave = []
                        var skippedTRans = [];
                        var countSkipped = 0;
                        var lines = fileContents.split('\n');
                        var transactions = {};
                        var groupedData = {};
                        lines.forEach(function(line, index) {
                            if (index > 0) {
                                var values = line.split(',');
                                // log.debug('values', values)
                                // log.debug('values length', values.length)
                                if (values.length >= 14) {
                                    var dateTran = values[0]
                                    // log.debug('dateTran', dateTran);
                                    var transNumber = values[1]
                                    // log.debug('transactionNumber', transNumber);
                                    var invId = values[2]
                                    var memo = values[3]
                                    var locationId = values[4]
                                    var productCode = values[5]
                                    var description = values[6]
                                    var unit = values[7]
                                    var unitPrice = values[8]
                                    // log.debug('unitPrice', unitPrice);
                                    var discountLine = values[9]
                                    // log.debug('discountLine', discountLine)
                                    var taxtRateId = values[10]
                                    var qty = values[11]
                                    var grossAmount = values[13]
                                    var isDiscount = values[14]
                                    if (!groupedData[transNumber]) {
                                        groupedData[transNumber] = [];
                                    }
                                    groupedData[transNumber].push({
                                        dateTran : dateTran,
                                        transNumber : transNumber,
                                        invId : invId,
                                        memo : memo,
                                        locationId : locationId,
                                        productCode : productCode,
                                        description : description,
                                        unit : unit,
                                        unitPrice : unitPrice,
                                        discountLine : discountLine,
                                        taxtRateId : taxtRateId,
                                        qty : qty,
                                        grossAmount : grossAmount,
                                        isDiscount : isDiscount
                                    })
                                }
                            }
                        }); 
                        var successRec = 0
                        for (var transNumber in groupedData) {
                            if (groupedData.hasOwnProperty(transNumber)) {
                                var transactionGroup = groupedData[transNumber];
                                var headerData = transactionGroup[0];
                                var transDate = headerData.dateTran
                                var parts = transDate.split('/');
                                var formattedDate = parts[2] + '-' + parts[1] + '-' + parts[0];
                                var year = parts[2];
                                var month = parts[1];
            
                                var monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                var monthText = monthNames[parseInt(month, 10)];
            
                                var periodDate = monthText + ' ' + year;
            
                                // log.debug('periodDate', periodDate);
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
                                
                                var transNumber = headerData.transNumber
                                var invId = headerData.invId
                                var memo = headerData.memo
                                var locationId = headerData.locationId
                                
                                var returnRec = record.transform({
                                    fromType: record.Type.INVOICE,
                                    fromId: invId,
                                    toType: record.Type.RETURN_AUTHORIZATION,
                                    isDynamic: true
                                });
                                var lineInv = returnRec.getLineCount({
                                    sublistId: 'item'
                                });
                                // log.debug('lineInv', lineInv)
                                returnRec.setValue({
                                    fieldId: 'tranid',
                                    value: transNumber,
                                    ignoreFieldChange: true
                                });
                                returnRec.setValue({
                                    fieldId: 'memo',
                                    value: transNumber,
                                    ignoreFieldChange: true
                                });
                                returnRec.setValue({
                                    fieldId: 'trandate',
                                    value: transDate,
                                    ignoreFieldChange: true
                                });
                                returnRec.setValue({
                                    fieldId: 'orderstatus',
                                    value: 'B',
                                    ignoreFieldChange: true
                                });
                                returnRec.setValue({
                                    fieldId: 'status',
                                    value: 'Pending Receipt',
                                    ignoreFieldChange: true
                                });
                                returnRec.setValue({
                                    fieldId: 'statusRef',
                                    value: 'pendingReceipt',
                                    ignoreFieldChange: true
                                });
                                
                                // line 1
                                var itemToProcess = []
                                var lineToRemove = []
                                for (var i = 0; i < transactionGroup.length; i++) {
                                    var lineData = transactionGroup[i];
                                    var transactionNumber = lineData.transNumber
                                    var productCode = lineData.productCode
                                    var description = lineData.description
                                    var unit = lineData.unit
                                    var unitPrice = lineData.unitPrice
                                    // log.debug('unitPrice', unitPrice);
                                    var isDiscount = lineData.isDiscount
                                    var discountLine = lineData.discountLine
                                    // log.debug('discountLine', discountLine)
                                    var taxtRateId = lineData.taxtRateId
                                    var qty = lineData.qty
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
                                        if(units){
                                            idUnit = units
                                        }
                                        
                                        // log.debug('idUnit', idUnit);
                                        productCode = idItem
                                        return true;
                                    });
                                    // log.debug('idItem', productCode);
                                    // log.debug('unitPrice', unitPrice);
                                    itemToProcess.push({
                                        productCode : productCode,
                                        idUnit : idUnit,
                                        description : description,
                                        unitPrice : unitPrice,
                                        taxtRateId : taxtRateId,
                                        qty : qty,
                                        grossAmount : grossAmount,
                                        isDiscount : isDiscount,
                                        discountLine : discountLine,
                                        transactionNumber : transactionNumber
                                    })

                                }

                                var productCodeToCheck = [];
                                var isToRemove = true;
                                var saveTrans = true
                                for (var j = 0; j < lineInv; j++) {
                                    returnRec.selectLine({
                                        sublistId: 'item',
                                        line: j
                                    });
                                    var itemId = returnRec.getCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                    });
                                    var taxcodeInv = returnRec.getCurrentSublistValue({
                                        sublistId : 'item',
                                        fieldId : 'taxcode'
                                    });
                                    // log.debug('rateInv', rateInv);
                                    // log.debug('itemId', itemId);
                                    // log.debug('itemProcess', itemToProcess);
                                    var itemMatched = itemToProcess.find(item => item.productCode === itemId);
                                    if (itemMatched === ' ' || !itemMatched) {
                                        lineToRemove.push(j);
                                    }else{
                                        var idUnit = itemMatched.idUnit
                                        var unitPrice = itemMatched.unitPrice
                                        // log.debug('unitPriceLast', unitPrice);
                                        var taxtRateId = itemMatched.taxtRateId
                                        var transactionNumber = itemMatched.transactionNumber
                                        var qty = itemMatched.qty
                                        var grossAmount = itemMatched.grossAmount
                                        var isDiscount = itemMatched.isDiscount
                                        var discountLine = itemMatched.discountLine
                                        log.debug('cek kesamaan', {
                                            taxcodeInv : taxcodeInv,
                                            taxtRateId : taxtRateId
                                        })
                                        if(taxcodeInv == taxtRateId){
                                            if(itemId == '154'){
                                                if(isToRemove){
                                                    lineToRemove.push(j);
                                                }else{
                                                    returnRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'item',
                                                        value: itemId
                                                    });
                                                    returnRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'price',
                                                        value: '-1'
                                                    });
                                                    
                                                    // returnRec.setCurrentSublistValue({
                                                    //     sublistId: 'item',
                                                    //     fieldId: 'units',
                                                    //     value: idUnit
                                                    // });
                                                    returnRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'quantity',
                                                        value: qty
                                                    });
                                                    var amountNotDisc = Number(unitPrice) * Number(qty)
                                                    
                                                    // log.debug('taxtRateId', taxtRateId);
                                                    returnRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'taxcode',
                                                        value: taxtRateId
                                                    });
                                                    // returnRec.setCurrentSublistValue({
                                                    //     sublistId: 'item',
                                                    //     fieldId: 'rate',
                                                    //     value: '-1%' 
                                                    // });
                                                    log.debug('unitPrice', unitPrice);
                                                    returnRec.setCurrentSublistText({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        text: unitPrice 
                                                    });
                                                    
                                                    returnRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'amount',
                                                        value: amountNotDisc
                                                    });
                                                    returnRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'refamt',
                                                        value: amountNotDisc
                                                    });
                                                    returnRec.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'grossamt',
                                                        value: grossAmount
                                                    });
                                                    returnRec.commitLine({ sublistId: 'item' });
                                                    isToRemove = true
                                                }
                                            }else{
                                                // log.debug('itemId', itemId);
                                                productCodeToCheck.push(itemId);
                                                // set line pertama
                                                returnRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'item',
                                                    value: itemId
                                                });
                                                returnRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'price',
                                                    value: '-1'
                                                });
                                                
                                                // returnRec.setCurrentSublistValue({
                                                //     sublistId: 'item',
                                                //     fieldId: 'units',
                                                //     value: idUnit
                                                // });
                                                returnRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'quantity',
                                                    value: qty
                                                });
                                                var amountNotDisc = Number(unitPrice) * Number(qty)
                                                
                                                // log.debug('taxtRateId', taxtRateId);
                                                returnRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'taxcode',
                                                    value: taxtRateId
                                                });
                                                returnRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'rate',
                                                    value: unitPrice
                                                });
                                                
                                                returnRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'amount',
                                                    value: amountNotDisc
                                                });
                                                returnRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'refamt',
                                                    value: amountNotDisc
                                                });
                                                returnRec.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'grossamt',
                                                    value: grossAmount
                                                });
                                                returnRec.commitLine({ sublistId: 'item' });
                                                isToRemove = false
                                            
                                                if(isDiscount == 1){
                                                    // set kedua
                                                    
                                                    
                                                }                                                                                
                                                
                                                // log.debug('itemId', itemId);
                                            } 
                                        }else{
                                            saveTrans = false
                                        }
                                        
                                    }
                                }
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

                                for (var i = lineToRemove.length - 1; i >= 0; i--) {
                                    returnRec.removeLine({
                                        sublistId: 'item',
                                        line: lineToRemove[i]
                                    });
                                }
                                if(saveTrans){
                                    var returnRec = returnRec.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    log.debug('returnRec', returnRec)
                                    if(returnRec){
                                        successRec += 1
                                        returnSave.push(returnRec)
                                        // item receipt
                                        var receiptRec = record.transform({
                                            fromType: record.Type.RETURN_AUTHORIZATION,
                                            fromId: returnRec,
                                            toType: record.Type.ITEM_RECEIPT,
                                            isDynamic: true
                                        });
                                        receiptRec.setValue({
                                            fieldId: 'trandate',
                                            value: transDate,
                                            ignoreFieldChange: true
                                        })
                                        receiptRec.setValue({
                                            fieldId: 'postingperiod',
                                            value: periodId,
                                            ignoreFieldChange: true
                                        })
                                        var lineIR = receiptRec.getLineCount({
                                            sublistId: 'item'
                                        });
                                        // log.debug('lineIr', lineIR);
                                        for (var i = 0; i < lineIR; i++) {
                                            receiptRec.selectLine({
                                                sublistId: 'item',
                                                line: i
                                            });
                                            var itemIr = receiptRec.getCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                            });
                                            var qtyIr = receiptRec.getCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                            });
                                            receiptRec.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: itemIr
                                            });
                                            receiptRec.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                                value: qtyIr
                                            });
                                            receiptRec.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'itemreceive',
                                                value: true
                                            });
                                        }
                                        var receiptSave = receiptRec.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        log.debug('receiptSave', receiptSave)
                                        if(receiptSave){
                                            IRsave.push(receiptSave)
                                        }
    
                                        // credit memo
                                        var creditRec = record.transform({
                                            fromType: record.Type.RETURN_AUTHORIZATION,
                                            fromId: returnRec,
                                            toType: record.Type.CREDIT_MEMO,
                                            isDynamic: true
                                        });
                                        creditRec.setValue({
                                            fieldId: 'account',
                                            value: '119',
                                            ignoreFieldChange: true
                                        })
                                        creditRec.setValue({
                                            fieldId: 'entityname',
                                            value: transNumber,
                                            ignoreFieldChange: true
                                        })
                                        creditRec.setValue({
                                            fieldId: 'tranid',
                                            value: transNumber,
                                            ignoreFieldChange: true
                                        })
                                        creditRec.setValue({
                                            fieldId: 'postingperiod',
                                            value: periodId,
                                            ignoreFieldChange: true
                                        })
                                        creditRec.setValue({
                                            fieldId: 'memo',
                                            value: transNumber,
                                            ignoreFieldChange: true
                                        })
                                        creditRec.setValue({
                                            fieldId: 'trandate',
                                            value: transDate,
                                            ignoreFieldChange: true
                                        })
                                        var creditSave = creditRec.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                        if(creditSave){
                                            log.debug('creditSave', creditSave)
                                            creditMemoSave.push(creditSave)
                                        }
                                    }
                                }else{
                                    skippedTRans.push(transNumber)
                                    countSkipped += 1
                                }
                                
                            }
                        }
                        log.debug('1 process', {returnSave : returnSave, IRsave : IRsave, creditMemoSave : creditMemoSave});
                        log.debug('skippedTrans', skippedTRans);
                        log.debug('countSkipped', countSkipped);
                        log.debug('successRec', successRec);
                    }catch(e){
                        log.debug('error', e)
                    }
                }
            }
        }
    }
    return {
        onRequest: onRequest
    };
});
