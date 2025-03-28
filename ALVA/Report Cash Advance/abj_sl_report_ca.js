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

            var projectFilter = form.addField({
                id: "custpage_project_option",
                label: "Project",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "classification",
            });
            
            var empFilter = form.addField({
                id: "custpage_employee_option",
                label: "Employee",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "employee",
            });
            var datefilter = form.addField({
                id: "custpage_date_option",
                label: "Date",
                type: serverWidget.FieldType.DATE,
                container: "filteroption"
            });
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var projectId = context.request.parameters.custpage_project_option;
                var empId = context.request.parameters.custpage_employee_option;
                var dateFilter = context.request.parameters.custpage_date_option;


                    var currentRecord = createSublist("custpage_sublist_item", form);
                    var dataCheck = search.load({
                        id: "customsearch726",
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
                    if(projectId){
                        dataCheck.filters.push(
                            search.createFilter({
                                name: "class",
                                operator: search.Operator.IS,
                                values: projectId,
                            })
                        );
                    }
                    if(dateFilter){
                        dataCheck.filters.push(
                            search.createFilter({
                                name: "trandate",
                                operator: search.Operator.ON,
                                values: dateFilter,
                            })
                        );
                    }
                    var allData = [];
                    var resultDataChect = getAllResults(dataCheck);
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
                        var projectName = row.getValue({
                            name: "name",
                            join: "class",
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
                        var bank = row.getValue({
                            name: "custentity_abj_bank_name",
                            join: "employee",
                        });
                        var norec = row.getValue({
                            name: "custentity_abj_account_name",
                            join: "employee",
                        });
                        log.debug('norek', norec)
                        var bankAcc = row.getValue({
                            name: "custentity_abj_bank_account_name",
                            join: "employee",
                        })
                        var account = row.getValue({
                            name : 'account'
                        });
                        var project = row.getValue({
                            name : 'class'
                        })
                        log.debug('data', {employee : employee, account : account, project : project});
                        var expDate
                        var expAmount
                        var depoAmount
                        var paymentAmount
                        var expensereportSearchObj = search.create({
                            type: "expensereport",
                            settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                            filters:
                            [
                                ["type","anyof","ExpRept"], 
                                "AND", 
                                ["mainline","is","F"], 
                                "AND", 
                                ["taxline","is","F"], 
                                "AND", 
                                ["subsidiary","anyof","46","47","48","49"], 
                                "AND", 
                                ["class.internalid","noneof","@NONE@"], 
                                "AND", 
                                ["employee","anyof",employee], 
                                "AND", 
                                ["advanceaccount","anyof",account], 
                                "AND", 
                                ["class.internalid","anyof",project], 
                                "AND", 
                                ["custbody6","anyof",idTrans]
                            ],
                            columns:
                            [
                                search.createColumn({name: "tranid", label: "Document Number"}),
                                search.createColumn({
                                    name: "name",
                                    join: "class",
                                    label: "Project Name"
                                }),
                                search.createColumn({name: "advanceaccount", label: "Advance To Apply Account"}),
                                search.createColumn({name: "trandate", label: "Date"}),
                                search.createColumn({name: "amount", label: "Amount"}),
                                search.createColumn({
                                    name: "amount",
                                    join: "CUSTBODY_ABJ_DEPOSIT",
                                    label: "Deposit Amount"
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
                        var link = '<a href="https://8591721.app.netsuite.com/app/accounting/transactions/check.nl?id=' + idTrans + '&whence=" target="_blank">' + noTrans + '</a>';
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
                            id: "custpage_sublist_project_number",
                            value: projectName || '-',
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
                            id: "custpage_sublist_bank",
                            value: bank || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_norek",
                            value: bankAcc || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_nama_rekening",
                            value: norec || '-',
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
                        allData.push({
                            noTrans : noTrans,
                            empName : empName || '',
                            projectName : projectName,
                            memo : memo || '',
                            amountCash :amountCash,
                            transferDate : transferDate,
                            bank : bank,
                            bankAcc : bankAcc,
                            norec : norec,
                            expDate : expDate || '',
                            expAmount : expAmount || 0.00,
                            diffAmt : diffAmt || 0.00,
                            depoAmount : depoAmount || 0.00,
                            paymentAmount : paymentAmount || 0.00
                        })
                    });
                    form.addButton({
                        id: 'custpage_button_po',
                        label: "Export Excel",
                        functionName: "download('" + JSON.stringify(allData) + "')"
                    });
                    form.clientScriptModulePath = "SuiteScripts/abj_cs_report_ca.js";
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
            id: "custpage_sublist_project_number",
            label: "Project Number",
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
            id: "custpage_sublist_bank",
            label: "Bank",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_norek",
            label: "Nomor Rekening",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_nama_rekening",
            label: "Nama Rekening",
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