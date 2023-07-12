/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
"N/ui/serverWidget",
"N/search",
"N/record",
"N/ui/message",
"N/url",
"N/redirect",
"N/currency",
'N/config',
'N/runtime',
'N/task'
], function(serverWidget, search, record, message, url, redirect, currency, config, runtime, task) {
function onRequest(context) {
    var contextRequest = context.request;
    var ibId = contextRequest.parameters.ibid;
    function checkArrayValues(array) {
        return array.every(function(element) {
            return element === array[0];
        });
    }

    function executeScheduled() {
        var scriptTask = task.create({
        taskType: task.TaskType.SCHEDULED_SCRIPT,
        scriptId: "customscript_alocated_landedcost_ss",
        deploymentId: "customdeploy_alocated_landedcost_ss",
        params: {
            "custscript_allocated_lc_searchid" : ibIDform,
            "custscript_allocated_lc_context" : dataResult
        }
        
    });
   
    var scriptTaskId = scriptTask.submit();

    log.debug("scriptTaskId", scriptTaskId);
    }


    if (contextRequest.method === "GET") {
    rec_inbound = record.load({
        type: "inboundshipment",
        id: ibId,
    });
    let shipmentNumber = rec_inbound.getValue("shipmentnumber");
    let dateCreated = rec_inbound.getValue("shipmentcreateddate");
    let externalDocNum = rec_inbound.getValue("externaldocumentnumber");
    let shipmentbasecurrency = rec_inbound.getValue("shipmentbasecurrency");

    var form = serverWidget.createForm({
        title: "Allocate Landed Cost",
    });

    var idInbound = form
        .addField({
        id: "custpage_id_inbound",
        label: "ID Inbound",
        type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN,
        });

    idInbound.defaultValue = ibId;

    var cust_shipmentnumber = form
        .addField({
        id: "custpage_shipmentnumber",
        label: "Shipment Number",
        type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE,
        });

    cust_shipmentnumber.defaultValue = shipmentNumber;

    var cust_shipmentcreateddate = form
        .addField({
        id: "custpage_shipmentcreateddate",
        label: "Date Created",
        type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE,
        });

    cust_shipmentcreateddate.defaultValue = dateCreated;

    var cust_externaldocumentnumber = form
        .addField({
        id: "custpage_externaldocumentnumber",
        label: "External Document Number	",
        type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE,
        });

    cust_externaldocumentnumber.defaultValue = externalDocNum;

    // Sublist Coloumn
    var sublist = form.addSublist({
        id: "sublist",
        type: serverWidget.SublistType.INLINEEDITOR,
        label: "List",
    });

    var gr_costCategory = sublist
        .addField({
        id: "sublist_gr_cost_category",
        label: "COST CATEGORY",
        type: serverWidget.FieldType.SELECT,
        source: "costcategory",
        })
        .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
        });

    var gr_amount = sublist
        .addField({
        id: "sublist_gr_amount",
        label: "AMOUNT",
        type: serverWidget.FieldType.CURRENCY,
        })
        .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
        });

    var gr_costCurrency = sublist
        .addField({
        id: "sublist_gr_cost_currency",
        label: "CURRENCY",
        type: serverWidget.FieldType.SELECT,
        source: "currency",
        })
        .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
        });

    //gr_costCurrency.defaultValue = shipmentbasecurrency;

    var gr_exchangeRate = sublist
        .addField({
        id: "sublist_gr_exchange",
        label: "EXCHANGE RATE",
        type: serverWidget.FieldType.FLOAT,
        })
        .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
        });

    gr_exchangeRate.defaultValue = "1";

    var gr_allocationMethodField = sublist
        .addField({
        id: "sublist_gr_cost_allocation_method",
        label: "COST ALLOCATION METHOD",
        type: serverWidget.FieldType.SELECT,
        source: "customlist_lc_cost_alloc_method",
        })
        .updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY,
        });

    var LcCostAllocs = search.create({
        type: 'customrecordabj_ib_cost_allocation',
        columns: ['custrecord_ca_ib_cost_category',
        'custrecord_ca_ib_cost_amount',
        'custrecord_ca_ib_cost_currency',
        'custrecord_ca_ib_cost_exchange_rate',
        'custrecord_ca_ib_cost_alloc_method',
        'custrecord_exchangerate1'
        ],
        filters: [{
        name: 'custrecord_abj_ca_ib_number',
        operator: 'is',
        values: ibId
        }, ]
    }).run().getRange({
        start: 0,
        end: 4
    });
    // log.debug("LcCostAllocs", LcCostAllocs);
    var vrecord = context.currentRecord;
    var idx = 0;
    LcCostAllocs.forEach(function(LcCostAlloc) {
        var cost_Category = LcCostAlloc.getValue({
        name: 'custrecord_ca_ib_cost_category'
        })
        sublist.setSublistValue({
        id: 'sublist_gr_cost_category',
        line: idx,
        value: cost_Category
        });
        // log.debug("cost_Category", cost_Category);

        var cost_Amount = LcCostAlloc.getValue({
        name: 'custrecord_ca_ib_cost_amount'
        })
        sublist.setSublistValue({
        id: 'sublist_gr_amount',
        line: idx,
        value: cost_Amount
        });
        // log.debug("cost_Amount", cost_Amount);

        var cost_Currency = LcCostAlloc.getValue({
        name: 'custrecord_ca_ib_cost_currency'
        })
        sublist.setSublistValue({
        id: 'sublist_gr_cost_currency',
        line: idx,
        value: cost_Currency || shipmentbasecurrency
        });
        // log.debug("cost_Currency", cost_Currency);

        var cost_Exchange = LcCostAlloc.getValue({
        name: 'custrecord_exchangerate1'
        })
        sublist.setSublistValue({
        id: 'sublist_gr_exchange',
        line: idx,
        value: cost_Exchange || 1
        });
        // log.debug("cost_Exchange", cost_Exchange);

        var cost_allocMethod = LcCostAlloc.getValue({
        name: 'custrecord_ca_ib_cost_alloc_method'
        })
        sublist.setSublistValue({
        id: 'sublist_gr_cost_allocation_method',
        line: idx,
        value: cost_allocMethod
        });
        // log.debug("cost_allocMethod", cost_allocMethod);
        idx++;
    });

    gr_costCategory.isMandatory = true;
    gr_costCurrency.isMandatory = true;
    gr_exchangeRate.isMandatory = true;
    gr_amount.isMandatory = true;
    gr_allocationMethodField.isMandatory = true;

    var submitButton = form.addSubmitButton({
        label: "Allocate",
    });
    submitButton.id = 'submitButton';

    var datatranss = search.load({
        id: "customsearchabj_ib_rec_trans",
    });

    datatranss.filters.push(
        search.createFilter({
        name: "internalid",
        operator: search.Operator.IS,
        values: ibId,
        })
    );
    var datatransset = datatranss.run();
    datatranss = datatransset.getRange(0, 100);

    var allExchangeRate = [];
    datatranss.forEach(function(datatrans) {
        var grId = datatrans.getValue({
        name: datatransset.columns[2]
        });
        var irRec = record.load({
        type: record.Type.ITEM_RECEIPT,
        id: grId,
        });
        var exchangeRateIr = irRec.getValue("exchangerate");
        allExchangeRate.push(exchangeRateIr);
    });
    log.debug("allExchangeRate", allExchangeRate);
    if (LcCostAllocs.length > 0 && !checkArrayValues(allExchangeRate)) {
        submitButton.isDisabled = true;
    }

    form.addButton({
        id: "close_btn",
        label: "Close",
        functionName: "goBack",
    });

    form.addButton({
        id: "reallocate_btn",
        label: "Recalculate Exchange Rate",
        functionName: "doRecalculate(" + ibId + ")",
    });
    form.clientScriptModulePath = "SuiteScripts/is_new_alocated_landedcost_cs.js";

    context.response.writePage(form);
    } else {
        var ibIDform = contextRequest.parameters.custpage_id_inbound;
        var count = contextRequest.getLineCount({
            group: "sublist",
            });
            var dataArray = [];
            for (var j = 0; j < count; j++) {
            var item_cost_category = contextRequest.getSublistValue({
                group: "sublist",
                name: "sublist_gr_cost_category",
                line: j,
            });

            var item_amount_val = contextRequest.getSublistValue({
                group: "sublist",
                name: "sublist_gr_amount",
                line: j,
            });

            var exchange_rate = contextRequest.getSublistValue({
                group: "sublist",
                name: "sublist_gr_exchange",
                line: j,
            });
            var currency_input = contextRequest.getSublistValue({
                group: "sublist",
                name: "sublist_gr_cost_currency",
                line: j,
            });
            var gr_allocationMethod = contextRequest.getSublistValue({
                group: "sublist",
                name: "sublist_gr_cost_allocation_method",
                line: j,
            });
            dataArray.push({
                item_cost_category,
                item_amount_val,
                exchange_rate,
                currency_input,
                gr_allocationMethod
            })
        }
        var dataResult = dataArray
        
        log.debug('dataResult', dataResult);
        executeScheduled(ibIDform, dataResult);
        // var html = "<html><body>";
        // if (success_gr_create_count > 0) {
        //     html += "<h3>" + scc_messages + "</h3>";
        // }
        // if (failed_gr_create_count > 0) {
        //     html += "<h3>" + err_messages + "</h3>";
        // }

        // html +=
        //     '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-2)" value="OK" />';
        // html += "</body></html>";

        // var form = serverWidget.createForm({
        //     title: "Result of Allocate Landed Cost",
        // });

        // if (success_gr_create_count > 0) {
        //     form.addPageInitMessage({
        //     type: message.Type.CONFIRMATION,
        //     title: "Success!",
        //     message: html,
        //     });
        // }

        // if (failed_gr_create_count > 0) {
        //     form.addPageInitMessage({
        //     type: message.Type.ERROR,
        //     title: "Failed!",
        //     message: html,
        //     });
        // }

        // context.response.writePage(form);

        var scriptObj = runtime.getCurrentScript();
        log.debug({
            title: "Remaining usage units: ",
            details: scriptObj.getRemainingUsage()
        });
    }
}
return {
    onRequest: onRequest,
};
});