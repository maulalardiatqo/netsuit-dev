/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
    "N/format",
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    format,
) {
    function getAllResults(s) {
        var results = s.run();
        var searchResults = [];
        var searchid = 0;
        do {
            var resultslice = results.getRange({
                start: searchid,
                end: searchid + 1000,
            });
            resultslice.forEach(function (slice) {
                searchResults.push(slice);
                searchid++;
            });
        } while (resultslice.length >= 1000);
        return searchResults;
    }
    function pembulatan(angka) {
        if (angka >= 0) {
            var bulat = Math.floor(angka);
            var desimal = angka - bulat;
    
            if (desimal >= 0.5) {
                return (bulat + 1).toFixed(2);
            } else {
                return bulat.toFixed(2);
            }
        } else {
            return Math.ceil(angka).toFixed(2);
        }
    }
        function onRequest(context) {
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "Report Gross Profit",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            var prosentField = form.addField({
                id: "custpage_bill_option",
                label: "Prosentase",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
            });
            prosentField.addSelectOption({
                value: '',
                text: '- select -',
            });
            prosentField.addSelectOption({
                value: '1',
                text: 'Penjualan dengan Margin dibawah Harga ≤0%'
            });
            prosentField.addSelectOption({
                value: '2',
                text: 'Penjualan dengan Margin ≥1% ≤20% '
            });
            prosentField.addSelectOption({
                value: '3',
                text: 'Penjualan dengan Margin >20% ≤50% '
            });
            prosentField.addSelectOption({
                value: '4',
                text: 'Penjualan dengan Margin >50%'
            });
            prosentField.isMandatory = true
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                try{
                    var formula = context.request.parameters.custpage_bill_option;
                
                var dataToShow = [];
                var dataPertama = []
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                    [
                        ["type","anyof","CustInvc"], 
                        "AND", 
                        ["taxline","is","F"], 
                        "AND", 
                        ["item","noneof","@NONE@"], 
                        "AND", 
                        ["createdfrom.type","anyof","SalesOrd"]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "altname",
                            join: "customer",
                            label: "Name"
                        }),
                        search.createColumn({name: "item", label: "Item"}),
                        search.createColumn({name: "trandate", label: "Date"}),
                        search.createColumn({name: "tranid", label: "External ID"}),
                        search.createColumn({name: "quantity", label: "Quantity"}),
                        search.createColumn({name: "grossamount", label: "Amount (Gross)"}),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "{grossamount}/{quantity}",
                            label: "price / kg"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "{quantity}*({grossamount}/{quantity})",
                            label: "Total Infoice"
                        }),
                        search.createColumn({name: "createdfrom", label: "Created From"}),
                        search.createColumn({
                            name: "salesorder",
                            join: "appliedToTransaction",
                            label: "Sales Order"
                        }),
                        search.createColumn({name: "unit", label: "Units"})
                    ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
                log.debug("invoiceSearchObj result count",searchResultCount);
                invoiceSearchObj.run().each(function(result){
                    var custName = result.getValue({
                        name: "altname",
                        join: "customer",
                    })
                    var item = result.getText({
                        name : 'item'
                    });
                    var invDate = result.getValue({
                        name : 'trandate'
                    });
                    var invNo = result.getValue({
                        name : 'tranid'
                    });
                    var qtyInv = result.getValue({
                        name : 'quantity'
                    });
                    var grossAmount = result.getValue({
                        name : 'grossamount'
                    });
                    var pricePerKG = result.getValue({
                        name: "formulanumeric",
                        formula: "{grossamount}/{quantity}"
                    });
                    var totalInv = result.getValue({
                        name: "formulanumeric",
                        formula: "{quantity}*({grossamount}/{quantity})",
                    });
                    var soId = result.getValue({
                        name: "createdfrom",
                    })
                    var soText = result.getText({
                        name: "createdfrom",
                    })
                    var unit = result.getValue({
                        name : 'unit'
                    })
                    dataPertama.push({
                        custName : custName,
                        item : item,
                        invDate : invDate,
                        invNo : invNo,
                        qtyInv : qtyInv,
                        grossAmount : grossAmount,
                        pricePerKG : pricePerKG,
                        totalInv : totalInv,
                        soId : soId,
                        unit : unit,
                        soText : soText
                    })
                    return true;
                });

                var dataKedua = []
                var itemfulfillmentSearchObj = search.create({
                    type: "itemfulfillment",
                    filters:
                    [
                        ["type","anyof","ItemShip"], 
                        "AND", 
                        ["mainline","is","F"], 
                        "AND", 
                        ["createdfrom.type","anyof","SalesOrd"]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "amount",
                            summary: "MAX",
                            label: "Amount"
                        }),
                        search.createColumn({
                            name: "createdfrom",
                            summary: "GROUP",
                            label: "Created From"
                        })
                    ]
                });
                var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
                log.debug("itemfulfillmentSearchObj result count",searchResultCount);
                itemfulfillmentSearchObj.run().each(function(data){
                    var idSO = data.getValue({
                        name: "createdfrom",
                        summary: "GROUP",
                    })
                    var amount = data.getValue({
                        name: "amount",
                        summary: "MAX",
                    })
                    dataKedua.push({
                        idSO : idSO,
                        amount : amount
                    })
                    return true;
                });
                log.debug('dataPertama', dataPertama)
                log.debug('dataKedua', dataKedua)

                var hasilGabungan = [];
                dataPertama.forEach(function(data1) {
                    dataKedua.forEach(function(data2) {
                        if (data1.soId === data2.idSO) {
                            var custName = data1.custName
                            var item = data1.item
                            var invDate = data1.invDate
                            var invNo = data1.invNo
                            var qtyInv = data1.qtyInv
                            var unit = data1.unit
                            var grossAmount = data1.grossAmount
                            var pricePerKG = data1.pricePerKG
                            var totalInv= data1.totalInv
                            var soId = data1.soId
                            var soText = data1.soText
                            var amount = data2.amount
                            var totalCoGs = Number(qtyInv) * Number(amount)
                            var grossProfit = Number(totalInv) - Number(totalCoGs);
                            var prosentGostProfit = Number(grossProfit) / (totalInv)
                            log.debug('prosentGostProfit', prosentGostProfit)
                            
                            var dataGabungan = {
                                custName: custName,
                                item: item,
                                invDate: invDate,
                                invNo: invNo,
                                qtyInv: qtyInv,
                                unit : unit,
                                grossAmount: grossAmount,
                                pricePerKG: pricePerKG,
                                totalInv: totalInv,
                                soId: soId,
                                soText : soText,
                                amount: amount, 
                                totalCoGs : totalCoGs,
                                grossProfit : grossProfit,
                                prosentGostProfit : prosentGostProfit
                            };
                            if (formula === '1') {
                                if (prosentGostProfit <= 0) {
                                    hasilGabungan.push(dataGabungan);
                                }
                            } else if (formula === '2') {
                                if (prosentGostProfit >= 1 && prosentGostProfit <= 20) {
                                    hasilGabungan.push(dataGabungan);
                                }
                            } else if (formula === '3') {
                                if (prosentGostProfit >= 20 && prosentGostProfit <= 50) {
                                    hasilGabungan.push(dataGabungan);
                                }
                            } else if (formula === '4') {
                                if (prosentGostProfit >= 50) {
                                    hasilGabungan.push(dataGabungan);
                                }
                            }
                        }
                    });
                });
                log.debug('hasilGabungan', hasilGabungan)
                var currentRecord = createSublist("custpage_sublist_item", form);
                var no = 1
                var i = 0
                hasilGabungan.forEach(data=>{
                    var custName = data.custName
                    var item = data.item

                    var invDate = data.invDate
                    log.debug('invDate', invDate)
                    var invNo = data.invNo
                    log.debug('invNo', invNo)
                    var qtyInv = data.qtyInv
                    var grossAmount = data.grossAmount
                    if(grossAmount){
                        grossAmount = format.format({
                            value: grossAmount,
                            type: format.Type.CURRENCY
                        });
                    }
                   
                    var pricePerKG = data.pricePerKG
                    if(pricePerKG){
                        pricePerKG = format.format({
                            value: pricePerKG,
                            type: format.Type.CURRENCY
                        });
                    }
                    var totalInv= data.totalInv
                    if(totalInv){
                        totalInv = format.format({
                            value: totalInv,
                            type: format.Type.CURRENCY
                        });
                    }
                    var unit = data.unit
                    var soId = data.soId
                    var soText = data.soText
                    var amount = data.amount
                    if(amount){
                        amount = format.format({
                            value: amount,
                            type: format.Type.CURRENCY
                        });
                    }
                    var totalCoGs = data.totalCoGs
                    if(totalCoGs){
                        totalCoGs = format.format({
                            value: totalCoGs,
                            type: format.Type.CURRENCY
                        });
                    }
                    var grossProfit = data.grossProfit
                    if(grossProfit){
                        grossProfit = format.format({
                            value: grossProfit,
                            type: format.Type.CURRENCY
                        });
                    }
                    var prosentGostProfit = data.prosentGostProfit

                    var prosentGostProfit = data.prosentGostProfit ||  0
                    prosentGostProfit = prosentGostProfit + '%'
                    log.debug('prosentGostProfit ', prosentGostProfit)
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_no",
                        value: no,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_custname",
                        value: custName,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_desc",
                        value: item,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_invdate",
                        value: invDate,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_noinv",
                        value: invNo,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_custpo",
                        value: soText,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_salesrep",
                        value: '-',
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_duedate",
                        value: '-',
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_qtypack",
                        value: '-',
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_packaging",
                        value: '-',
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_unit",
                        value: unit || '-',
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_qty",
                        value: qtyInv,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_grossamount",
                        value: grossAmount,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_pricekg",
                        value: pricePerKG,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_totalinv",
                        value: totalInv,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_pibdate",
                        value: '-',
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_cogskg",
                        value: amount || '0',
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_totalcogs",
                        value: totalCoGs,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_grossprofit",
                        value: grossProfit,
                        line: i,
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_prosent",
                        value: prosentGostProfit,
                        line: i,
                    });
                    no++
                    i++
                })
                context.response.writePage(form);
                }catch(e){
                    log.debug('error', e)
                }
                
            }
        }
        function createSublist(sublistname, form) {
            var sublist_in = form.addSublist({
                id: sublistname,
                type: serverWidget.SublistType.LIST,
                label: "Report Gross Profit",
            });
            sublist_in.addField({
                id: "custpage_sublist_no",
                label: "No",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_custname",
                label: "Customer Name",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_desc",
                label: "Description",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_invdate",
                label: "Inv date",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_noinv",
                label: "No. Inv",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_custpo",
                label: "custpo",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_salesrep",
                label: "salesman1",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_duedate",
                label: "duedate",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_qtypack",
                label: "Qty Pack",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_packaging",
                label: "Packaging",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_unit",
                label: "Unit",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_qty",
                label: "Qty",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_grossamount",
                label: "Price / Pack",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_pricekg",
                label: "Price / KG / PCS",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_totalinv",
                label: "Total Inv",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_pibdate",
                label: "Tanggal PIB",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_cogskg",
                label: "COGS / KG / PCS",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_totalcogs",
                label: "Total COGS",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_grossprofit",
                label: "Gross Profit",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_prosent",
                label: "Persentase",
                type: serverWidget.FieldType.TEXT,
            });
            return sublist_in;
        }
        return{
            onRequest : onRequest
        }
    })