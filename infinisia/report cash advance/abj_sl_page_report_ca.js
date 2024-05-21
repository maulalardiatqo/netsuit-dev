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

    function onRequest(context) {
        try{
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "Report Cash Advance",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            
            var empFilter = form.addField({
                id: "custpage_employee_option",
                label: "Employee",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "employee",
            });
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var empId = context.request.parameters.custpage_employee_option;


                    var currentRecord = createSublist("custpage_sublist_item", form);
                    var dataCheck = search.load({
                        id: "customsearch_cash_advance_check",
                    });
                    log.debug('empId', empId)
                    if(empId){
                        dataCheck.filters.push(
                            search.createFilter({
                                name: "employee",
                                operator: search.Operator.IS,
                                values: empId,
                            })
                        );
                    }
                    log.debug('dataCheck', dataCheck)
                    var resultDataChect = getAllResults(dataCheck);
                    log.debug('resultDataChect', resultDataChect)
                    var line = 0
                    resultDataChect.forEach(function (row) {
                        var noTrans = row.getValue({
                            name: "transactionnumber"
                        })
                        var idTrans = row.getValue({
                            name : "internalid"
                        })
                        var empName = row.getValue({
                            name: "altname",
                            join: "employee",
                        })
                        var employee = row.getValue({
                            name: "internalid",
                            join: "employee",
                        })
                        var memo = row.getValue({
                            name: "memo"
                        });
                        var amountCash = row.getValue({
                            name: "amount"
                        });
                        var transferDate = row.getValue({
                            name: "trandate"
                        });
                        var account = row.getValue({
                            name : 'account'
                        });
                        log.debug('data', {employee : employee, account : account,});
                        var expDate
                        var expAmount
                        var depoAmount
                        var paymentAmount
                        var expensereportSearchObj = search.create({
                            type: "expensereport",
                            // settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                            filters:
                            [
                                ["type","anyof","ExpRept"], 
                                "AND", 
                                ["mainline","is","F"], 
                                "AND", 
                                ["employee","anyof",empId], 
                                "AND", 
                                ["taxline","is","F"], 
                                "AND", 
                                ["advanceaccount","anyof",account], 
                                "AND", 
                                ["custbody_abj_deposit_no","anyof",idTrans]
                            ],
                            columns:
                            [
                                search.createColumn({name: "tranid", label: "Document Number"}),
                                search.createColumn({name: "advanceaccount", label: "Advance To Apply Account"}),
                                search.createColumn({name: "trandate", label: "Date"}),
                                search.createColumn({
                                    name: "amount",
                                    join: "CUSTBODY_ABJ_DEPOSIT_NO",
                                    label: "Amount"
                                }),
                                search.createColumn({name: "internalid", label: "Internal ID"})
                            ]
                        });
                        var searchResultCount = expensereportSearchObj.runPaged().count;
                        log.debug("expensereportSearchObj result count",searchResultCount);
                        expensereportSearchObj.run().each(function(result){
                            var internalIdExp = result.getValue({
                                name: "internalid"
                            })
                            var dateExp = result.getValue({
                                name: "trandate"
                            });
                            expDate = dateExp
                            var amountExp = result.getValue({
                                name : "amount"
                            });
                            expAmount = amountExp
                            var amountDepo = result.getValue({
                                name: "amount",
                                join: "CUSTBODY_ABJ_DEPOSIT",
                            })
                            if(amountDepo){
                                depoAmount = amountDepo
                            }
                            var vendorpaymentSearchObj = search.create({
                                type: "vendorpayment",
                                settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                                filters:
                                [
                                    ["type","anyof","VendPymt"], 
                                    "AND", 
                                    ["appliedtotransaction","anyof",internalIdExp]
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
                            var searchResultCount = vendorpaymentSearchObj.runPaged().count;
                            log.debug("vendorpaymentSearchObj result count",searchResultCount);
                            vendorpaymentSearchObj.run().each(function(data){
                                var pyAmt = data.getValue({
                                    name: "amount",
                                    summary: "MAX",
                                })
                                if(pyAmt) {
                                    paymentAmount = pyAmt
                                }
                            });
                        });
                        var diffAmt = Number(amountCash) - Number(expAmount);
                        log.debug('diffAmt', diffAmt)
                        if(amountCash){
                            amountCash = format.format({
                                value: amountCash,
                                type: format.Type.CURRENCY
                            });
                        }
                        if(expAmount){
                            expAmount = format.format({
                                value: expAmount,
                                type: format.Type.CURRENCY
                            });
                        }
                        if(diffAmt){
                            diffAmt = format.format({
                                value: diffAmt,
                                type: format.Type.CURRENCY
                            });
                        }
                        if(depoAmount){
                            depoAmount = format.format({
                                value: depoAmount,
                                type: format.Type.CURRENCY
                            });
                        }
                        if(paymentAmount){
                            paymentAmount = format.format({
                                value: paymentAmount,
                                type: format.Type.CURRENCY
                            });
                        }
                        var idTrans = row.getValue({
                            name: "internalid"
                        });
                        log.debug('idTrans', idTrans)
                        var link = '<a href="https://9274135.app.netsuite.com/app/accounting/transactions/check.nl?id=' + idTrans + '&whence=" target="_blank">' + noTrans + '</a>';
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_no",
                            value: link || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_emp",
                            value: empName || '-',
                            line: line,
                        });
                        
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_description",
                            value: memo || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_amount",
                            value: amountCash || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_transfer_date",
                            value: transferDate || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_sattlement_date",
                            value: expDate || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_sattlement_amount",
                            value: expAmount || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_different",
                            value: diffAmt || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_refund",
                            value: depoAmount || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_kurang_bayar",
                            value: paymentAmount || '-',
                            line: line,
                        });
                        line++
                    })
                    context.response.writePage(form);
                
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    function createSublist(sublistname, form) {
        var sublist_in = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Report Cash Advance",
        });
        sublist_in.addField({
            id: "custpage_sublist_no",
            label: "No Form",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_emp",
            label: "Name Of Employee",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_description",
            label: "Description",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_amount",
            label: "Amount",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_transfer_date",
            label: "Transfer Date",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_sattlement_date",
            label: "Settlement Date",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_sattlement_amount",
            label: "Settlement Amount",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_different",
            label: "Different",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_refund",
            label: "Refund",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_kurang_bayar",
            label: "Kurang Bayar",
            type: serverWidget.FieldType.TEXT,
        });

        return sublist_in;
    }
    return{
        onRequest : onRequest
    }
});