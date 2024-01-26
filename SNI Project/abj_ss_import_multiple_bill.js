/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/file', 'N/format'],
  function(search, record, email, runtime, file, format) {
    
    function execute(scriptContext) {
        try {
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
            // log.debug('Data', data);

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
            // log.debug('groupedData', groupedData);
            var countRecord = 1;
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
                    log.debug('periodId', periodId)
                    var date = new Date(formattedDate);
                    transDate = date

                    var transactionNumber = headerData.transactionNumber;
                    var internalIdVendor = headerData.internalIdVendor;
                    var memo = headerData.memo;
                    var dueDate = headerData.dueDate;
                    if(dueDate){
                        var part = dueDate.split('/');
                        var formatDue = part[2] + '-' + part[1] + '-' + part[0];
                        var due = new Date(formatDue);
                        dueDate = due
                    }
                    log.debug('dueDate', dueDate);
                    var locationId = headerData.locationId;

                    log.debug('data header', {
                        transDate : transDate,
                        transactionNumber : transactionNumber,
                        internalIdVendor : internalIdVendor
                    })

                    var createNew = record.create({
                        type : 'vendorbill',
                        isDynamic: true
                    })
                    createNew.setValue({
                        fieldId: 'custbody1',
                        value: '200281',
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'transactionnumber',
                        value: transactionNumber,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'tranid',
                        value: transactionNumber,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'trandate',
                        value: transDate,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'entity',
                        value: internalIdVendor,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'memo',
                        value: memo,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'duedate',
                        value: dueDate,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'custbody_sp_type_purch',
                        value: '2',
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'subsidiary',
                        value: '13',
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'location',
                        value: locationId,
                        ignoreFieldChange: true
                    });
                    // createNew.setValue({
                    //     fieldId: 'postingperiod',
                    //     value: periodId,
                    //     ignoreFieldChange: true
                    // });
                    var idPoGrouped = {}
                    for (var i = 0; i < transactionGroup.length; i++) {
                        var lineData = transactionGroup[i];
                        var idPo = lineData.internLIdPO
                        log.debug('idPO', idPo);
                        if(!idPoGrouped[idPo]){
                            idPoGrouped[idPo] = [];
                        }
                        idPoGrouped[idPo].push(idPo)
                        var productCode = lineData.productCode
                        var qty = lineData.qty
                        var unit = lineData.unit
                        // log.debug('pu', {
                        //     productCode : productCode,
                        //     unit : unit
                        // })
                        // var unitstypeSearchObj = search.create({
                        //     type: "unitstype",
                        //     filters:
                        //     [
                        //         ["name","is",productCode], 
                        //         "AND", 
                        //         ["unitname","is",unit]
                        //     ],
                        //     columns:
                        //     [
                        //         search.createColumn({
                        //             name: "name",
                        //             sort: search.Sort.ASC,
                        //             label: "Name"
                        //         }),
                        //         search.createColumn({name: "unitname", label: "Unit Name"}),
                        //         search.createColumn({name: "internalid", label: "Internal ID"})
                        //     ]
                        // });
                        // var searchResultCount = unitstypeSearchObj.runPaged().count;
                        // var idUnit
                        // unitstypeSearchObj.run().each(function(result){
                        //     var internalIdunit = result.getValue({
                        //         name: "internalid"
                        //     });
                        //     idUnit = internalIdunit
                        // return true;
                        // });

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
                        log.debug('lineData', {
                            productCode : productCode,
                            unit : unit,
                            discountLine : discountLine
                        })
                        createNew.selectNewLine({ sublistId: 'item' });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: productCode
                        });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'orderdoc',
                            value: idPo
                        });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: qty
                        });
                        log.debug('idUnit', idUnit);
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'units',
                            value: idUnit
                        });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            value: locationId
                        });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'department',
                            value: '1'
                        });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: taxcode
                        });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: rate
                        });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: amount
                        });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol3',
                            value: discountLine
                        });
                        createNew.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'grossamt',
                            value: grossAmount
                        });
                        createNew.commitLine({ sublistId: 'item' });
                    }
                    // log.debug('idPoGrouped', idPoGrouped)
                    // for (var idPo in idPoGrouped) {
                    //     if (idPoGrouped.hasOwnProperty(idPo)) {
                    //         var groupPo = idPoGrouped[idPo];
                    //         log.debug('groupedPo', groupPo);
                    //         var dataPo = groupPo[0]; 
                    //         createNew.selectNewLine({ sublistId: 'purchaseorders' });
                    //         log.debug('afterselectline')
                    //         createNew.setCurrentSublistValue({
                    //             sublistId: 'purchaseorders',
                    //             fieldId: 'internalid',
                    //             value: dataPo,
                    //             ignoreFieldChange: true
                    //         });
                    //         createNew.setCurrentSublistValue({
                    //             sublistId: 'purchaseorders',
                    //             fieldId: 'linkurl',
                    //             value: "/app/accounting/transactions/purchord.nl"
                    //         });
                    //         createNew.commitLine({ sublistId: 'purchaseorders' });
                    //     }
                    // }
                    var createIdNew = createNew.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    if(createIdNew){
                        log.debug('createIdNew', createIdNew);
                        countRecord++
                    }
                }
                log.debug('countRecord', countRecord);
            }

        }catch(e){
            log.debug('error', e)
        }
    }

    return {
        execute: execute
    };
});
