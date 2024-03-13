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
                value: '<=0%',
                text: 'Penjualan dengan Margin dibawah Harga ≤0%'
            });
            prosentField.addSelectOption({
                value: '>=1 && <=20%',
                text: 'Penjualan dengan Margin ≥1% ≤20% '
            });
            prosentField.addSelectOption({
                value: '>=20 && <=50%',
                text: 'Penjualan dengan Margin >20% ≤50% '
            });
            prosentField.addSelectOption({
                value: '>=50%',
                text: 'Penjualan dengan Margin >50%'
            });
            prosentField.isMandatory = true
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var formula = context.request.parameters.custpage_bill_option;
                
                var dataToShow = [];
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
                        ["createdfrom","noneof","@NONE@"]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "altname",
                            join: "customer",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "itemid",
                            join: "item",
                            label: "Name"
                        }),
                        search.createColumn({name: "trandate", label: "Date"}),
                        search.createColumn({name: "externalid", label: "External ID"}),
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
                            label: "Total Invoice"
                        }),
                        search.createColumn({name: "createdfrom", label: "Created From"})
                    ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
                invoiceSearchObj.run().each(function(result){
                    var custName = result.getValue({
                        name: "altname",
                        join: "customer",
                    });
                    var itemName = result.getValue({
                        name: "itemid",
                        join: "item",
                    })
                    var trandDate = result.getValue({
                        name: "trandate"
                    })
                    var invNumb = result.getValue({
                        name: "tranid"
                    })
                    var qty = result.getValue({
                        name: "quantity"
                    })
                    var grossAmount = result.getValue({
                        name: "grossamount"
                    });
                    var priceKg = result.getValue({
                        name: "formulanumeric",
                        formula: "{grossamount}/{quantity}",
                    })
                    var totalInv = result.getValue({
                        name: "formulanumeric",
                        formula: "{quantity}*({grossamount}/{quantity})",
                    })
                    
                    var createdFormText = result.getText({
                        name: "createdfrom"
                    })
                    
                    log.debug('createdFormText', createdFormText)
                    var cogsItem = 0
                    if(createdFormText.includes('Sales Order')){
                        var createdForm = result.getValue({
                            name: "createdfrom"
                        })
                        log.debug('createdForm', createdForm)
                        var recSo = record.load({
                            type : 'salesorder',
                            id : createdForm
                        });
                        var POcheck = recSo.getValue('otherrefnum');
                        var linkCount = recSo.getLineCount({
                            sublistId : 'links'
                        });
                        if(linkCount > 0){
                            
                            for(var i = 0; i < linkCount; i++){
                                var linkType = recSo.getSublistValue({
                                    sublistId : 'links',
                                    fieldId : 'type',
                                    line : i
                                })
                                if(linkType == 'Item Fulfillment'){
                                    var ifId = recSo.getSublistValue({
                                        sublistId : 'links',
                                        fieldId : 'id',
                                        line : i
                                    })
                                    log.debug('ifId', ifId)
                                    var itemfulfillmentSearchObj = search.create({
                                        type: "itemfulfillment",
                                        filters:
                                        [
                                            ["type","anyof","ItemShip"], 
                                            "AND", 
                                            ["mainline","is","F"], 
                                            "AND", 
                                            ["internalid","anyof",ifId]
                                        ],
                                        columns:
                                        [
                                            search.createColumn({
                                                name: "amount",
                                                summary: "MAX",
                                                label: "Amount"
                                            })
                                        ]
                                    });
                                    var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
                                    log.debug("itemfulfillmentSearchObj result count",searchResultCount);
                                    itemfulfillmentSearchObj.run().each(function(data){
                                        var amountMax = data.getValue({
                                            name: "amount",
                                            summary: "MAX",
                                        })
                                        cogsItem = amountMax
                                        return true;
                                    });
                                }
                            }
                        }
                        var totalCogs = Number(qty) * Number(cogsItem)
                        var grossProfit = Number(totalInv) - Number(totalCogs);
                        var prosentGostProfit = Number(grossProfit) / (totalInv)
                        if(formula == '<=0%'){
                            if(prosentGostProfit <= 0){
                                dataToShow.push({
                                    custName : custName,
                                    itemName : itemName,
                                    trandDate : trandDate,
                                    invNumb : invNumb,
                                    qty : qty,
                                    grossAmount : grossAmount,
                                    priceKg : priceKg,
                                    totalInv : totalInv,
                                    createdFormText : createdFormText,
                                    cogsItem: cogsItem,
                                    totalCogs : totalCogs,
                                    grossProfit : grossProfit,
                                    prosentGostProfit : prosentGostProfit
                                })
                            }
                        }else if(formula == '>=1 && <=20%'){
                            if(prosentGostProfit >= 1 && prosentGostProfit  <= 20){
                                log.debug('formula', formula)
                                log.debug('prosentGosProfit', prosentGostProfit);
                                dataToShow.push({
                                    custName : custName,
                                    itemName : itemName,
                                    trandDate : trandDate,
                                    invNumb : invNumb,
                                    qty : qty,
                                    grossAmount : grossAmount,
                                    priceKg : priceKg,
                                    totalInv : totalInv,
                                    createdFormText : createdFormText,
                                    cogsItem: cogsItem,
                                    totalCogs : totalCogs,
                                    grossProfit : grossProfit,
                                    prosentGostProfit : prosentGostProfit
                                })
                            }
                        } else if(formula == '>=20 && <=50%'){
                            if(prosentGostProfit >= 20 && prosentGostProfit  <= 50){
                                dataToShow.push({
                                    custName : custName,
                                    itemName : itemName,
                                    trandDate : trandDate,
                                    invNumb : invNumb,
                                    qty : qty,
                                    grossAmount : grossAmount,
                                    priceKg : priceKg,
                                    totalInv : totalInv,
                                    createdFormText : createdFormText,
                                    cogsItem: cogsItem,
                                    totalCogs : totalCogs,
                                    grossProfit : grossProfit,
                                    prosentGostProfit : prosentGostProfit
                                })
                            }
                        }else if(formula == '>=50%'){
                            if(prosentGostProfit >= 50){
                                dataToShow.push({
                                    custName : custName,
                                    itemName : itemName,
                                    trandDate : trandDate,
                                    invNumb : invNumb,
                                    qty : qty,
                                    grossAmount : grossAmount,
                                    priceKg : priceKg,
                                    totalInv : totalInv,
                                    createdFormText : createdFormText,
                                    cogsItem: cogsItem,
                                    totalCogs : totalCogs,
                                    grossProfit : grossProfit,
                                    prosentGostProfit : prosentGostProfit
                                })
                            }
                        }

                    }
                    return true;
                });
                log.debug('dataToShow', dataToShow)
                var currentRecord = createSublist("custpage_sublist_item", form);
                    var no = 1
                    var i = 0
                    dataToShow.forEach(function(data) {
                        var custName = data.custName ||  '-'
                        var itemName = data.itemName ||  '-'
                        var trandDate = data.trandDate ||  '-'
                        var invNumb = data.invNumb ||  '-'
                        var qty = data.qty ||  '-'
                        var grossAmount = data.grossAmount ||  0
                        grossAmount = format.format({
                            value: grossAmount,
                            type: format.Type.CURRENCY
                        });
                        var priceKg = data.priceKg ||  0
                        priceKg = format.format({
                            value: priceKg,
                            type: format.Type.CURRENCY
                        })
                        var totalInv = data.totalInv ||  0
                        totalInv = format.format({
                            value: totalInv,
                            type: format.Type.CURRENCY
                        })
                        var createdFormText = data.createdFormText ||  '-'
                        var cogsItem = data.cogsItem ||  0
                        cogsItem = format.format({
                            value: cogsItem,
                            type: format.Type.CURRENCY
                        });
                        var totalCogs = data.totalCogs ||  0
                        totalCogs = format.format({
                            value: totalCogs,
                            type: format.Type.CURRENCY
                        });
                        var grossProfit = data.grossProfit ||  0
                        grossProfit = format.format({
                            value: grossProfit,
                            type: format.Type.CURRENCY
                        });
                        var prosentGostProfit = data.prosentGostProfit ||  0
                        // prosentGostProfit = pembulatan(prosentGostProfit)
                        prosentGostProfit = prosentGostProfit + '%'
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
                            value: itemName,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_invdate",
                            value: trandDate,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_noinv",
                            value: invNumb,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_custpo",
                            value: createdFormText,
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
                            value: '-',
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_qty",
                            value: qty,
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
                            value: priceKg,
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
                            value: cogsItem,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_totalcogs",
                            value: totalCogs,
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