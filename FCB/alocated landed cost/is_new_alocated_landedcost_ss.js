    /**
     *@NApiVersion 2.1
    *@NScriptType ScheduledScript
    */
    define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/config', 'N/task'],
    function(search, record, email, runtime, config, task) {
        function execute(context) {

            try{
                function getAllResults(s) {
                var results = s.run();
                var searchResults = [];
                var searchid = 0;
                do {
                    var resultslice = results.getRange({
                    start: searchid,
                    end: searchid + 1000
                    });
                    resultslice.forEach(function(slice) {
                    searchResults.push(slice);
                    searchid++;
                    });
                } while (resultslice.length >= 1000);
                return searchResults;
                }
                var ibIDform = runtime.getCurrentScript().getParameter("custscript_allocated_lc_searchid");
                var dataResult = runtime.getCurrentScript().getParameter("custscript_allocated_lc_context");
                dataResult = JSON.parse(dataResult);
            log.debug('dataResult', dataResult);
                var info = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });
        
                var baseCurrencySearch = search.create({
                type: search.Type.CURRENCY,
                filters: [
                    ["internalid", search.Operator.IS, info.getValue("basecurrency")]
                ],
                columns: [
                    "name"
                ]
                });
        
                var searchResultBcr = baseCurrencySearch.run().getRange({
                start: 0,
                end: 1
                });
                var baseCurrency = searchResultBcr[0].getValue({
                name: "name"
                });
                log.debug("baseCurrency", baseCurrency);
                var datatranss = search.load({
                    id: "customsearchabj_ib_rec_trans",
                });

                datatranss.filters.push(
                    search.createFilter({
                        name: "internalid",
                        operator: search.Operator.IS,
                        values: ibIDform,
                    })
                );
                var datatransset = datatranss.run();
                datatranss = datatransset.getRange(0, 1000);

                var totalQty = 0;
                var totalWeight = 0;
                var totalPrice = 0;
                var counter_total = 1;
                var itemKey = [];
                    datatranss.forEach(function(datatrans) {
                        var grId = datatrans.getValue({
                        name: datatransset.columns[2]
                        });
                        ir_data_to_update = record.load({
                        type: record.Type.ITEM_RECEIPT,
                        id: grId,
                        });
                        var lineTotal = ir_data_to_update.getLineCount({
                        sublistId: "item"
                        });
                        log.debug("lineTotal", lineTotal);
                        // looping for sum quantity
                        for (var a = 0; a < lineTotal; a++) {
                        var qty_a = ir_data_to_update.getSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            line: a,
                        });
                
                        var price_a = ir_data_to_update.getSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_grr_amount",
                            line: a,
                        });
                        if (price_a <= 0) {
                            var rate_a = ir_data_to_update.getSublistValue({
                            sublistId: "item",
                            fieldId: "rate",
                            line: a,
                            });
                            price_a = rate_a * qty_a;
                        }
                
                        var item_key = ir_data_to_update.getSublistValue({
                            sublistId: "item",
                            fieldId: "itemkey",
                            line: a,
                        });
                        itemKey.push({
                            grId: grId,
                            item_key: item_key
                        });
                        log.debug('item_key', item_key);
                        var fieldLookUpItem = search.lookupFields({
                            type: search.Type.INVENTORY_ITEM,
                            id: item_key,
                            columns: ['type', 'weight']
                        });
                        var itemWeight = fieldLookUpItem.weight;
                        
                        let weight = itemWeight == "" ? 1 : itemWeight;
                        var qty_weight = qty_a * weight;
                
                        totalQty += qty_a;
                        totalWeight += qty_weight;
                        totalPrice += price_a;
                        }
                        counter_total++;
                    });
                    log.debug("counter counter_total", counter_total);
                    log.debug("total QTY ALL", totalQty);
                    log.debug("ITEM KEYY TOTAL WEIGHT", totalWeight);
                    log.debug("total PRICE ALL", totalPrice);
                    log.debug("itemKey", itemKey);
                    
                    // looping for data process
                    var success_gr_create_count = 0;
                    var failed_gr_create_count = 0;
                    var err_messages = "";
                    var scc_messages = "";

                    datatranss.forEach(function(datatrans) {
                    var grId = datatrans.getValue({
                        name: datatransset.columns[2]
                    });
                    var grDocNo = datatrans.getValue({
                        name: datatransset.columns[3]
                    });
                    ir_data_to_update = record.load({
                        type: "itemreceipt",
                        id: grId,
                    });
                    var currencyGr = ir_data_to_update.getText("currency");
                    // log.debug("currencyGr", currencyGr);
                    var dateGr = ir_data_to_update.getValue("trandate");
                    // log.debug("dateGr", dateGr);
                    // log.debug("GRID", grId);
                    var filteredArrayItem = itemKey.filter(function(obj) {
                        return obj.grId === grId;
                    });
                    var itemKeys = filteredArrayItem.map(function(obj) {
                        return obj.item_key;
                    });
                    var itemKeyGrID = [];
                    var inventoryitemSearchObj = search.create({
                        type: "inventoryitem",
                        filters: [
                        ["type", "anyof", "InvtPart"],
                        "AND",
                        ["internalid", "anyof", itemKeys]
                        ],
                        columns: [
                        search.createColumn({
                            name: "itemid",
                            sort: search.Sort.ASC
                        }),
                        "internalid",
                        "displayname",
                        "type",
                        "weight",
                        search.createColumn({
                            name: "custrecord_item_ca_cost_category",
                            join: "CUSTRECORD_CA_ID_ITEM"
                        }),
                        search.createColumn({
                            name: "custrecord_item_ca_percentage",
                            join: "CUSTRECORD_CA_ID_ITEM"
                        })
                        ]
                    });
                    var myResults = getAllResults(inventoryitemSearchObj);
                    myResults.forEach(function(result) {
                        var CostPercentage = result.getValue("custrecord_item_ca_percentage");
                        var CostCategory = result.getValue("custrecord_item_ca_cost_category");
                        var ItemID = result.getValue("internalid");
                        var ItemWeight = result.getValue("weight");
                        itemKeyGrID.push({
                        ItemID: ItemID,
                        itemWeight: ItemWeight,
                        Category: CostCategory,
                        Percentage: CostPercentage,
                        });
                    });
                    // log.debug("itemKeyGrID", itemKeyGrID);
            
                    var lineTotal = ir_data_to_update.getLineCount({
                        sublistId: "item"
                    });
                    for (var i = 0; i < lineTotal; i++) {
                        var qty = ir_data_to_update.getSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        line: i,
                        });
            
                        var price = ir_data_to_update.getSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_grr_amount",
                        line: i,
                        });
            
                        if (price <= 0) {
                        var rate = ir_data_to_update.getSublistValue({
                            sublistId: "item",
                            fieldId: "rate",
                            line: i,
                        });
                        price = rate * qty;
                        }
            
                        // get weight
                        var item_key = ir_data_to_update.getSublistValue({
                        sublistId: "item",
                        fieldId: "itemkey",
                        line: i,
                        });
                        
                        var itemWeight;
                        var qty_weight;
                        var cost_category_by_item = [];
                        for (var idx_x in itemKeyGrID) {
                        let item_id = itemKeyGrID[idx_x];
                        let item_id_to_check = item_id.ItemID;
                        
                        if (item_id_to_check == item_key) {
                            if (idx_x == 0) {
                            itemWeight = item_id.itemWeight;
                            let weight = itemWeight == "" ? 1 : itemWeight;
                            qty_weight = qty * weight;
                            }
                            let costCategory = item_id.Category;
                            let costPercentage = item_id.Percentage;
                            let landedCostAmount = Number(price * costPercentage / 100);
                            cost_category_by_item.push({
                            Category: costCategory,
                            Percentage: costPercentage,
                            landedcost: landedCostAmount,
                            });
                        }
                        }
            
                        // end get cost category
            
                        var subrec = ir_data_to_update.getSublistSubrecord({
                        sublistId: "item",
                        fieldId: "landedcost",
                        line: i,
                        });
            
                        var totalLandedNow = subrec.getLineCount({
                        sublistId: "landedcostdata",
                        });
                        //   log.debug("line total landed", totalLandedNow);
            
                        for (var n = totalLandedNow; n >= 0; n--) {
                        // log.debug("running line delete ", n + " of " + totalLandedNow);
                        subrec.removeLine({
                            sublistId: "landedcostdata",
                            line: n,
                            ignoreRecalc: true,
                        });
                        // log.debug("removed", "Line " + i + " has been removed.");
                        }
                        
                        var count = dataResult.length
                        for (var j = 0; j < count; j++) {
                            var item_cost_category = dataResult[j].item_cost_category;
                            var item_amount_val = dataResult[j].item_amount_val;
                            var exchange_rate = dataResult[j].exchange_rate;
                            var currency_input = dataResult[j].currency_input;
                            log.debug('currency_input', currency_input);
                            var fieldLookUpCr = search.lookupFields({
                                type: search.Type.CURRENCY,
                                id: currency_input,
                                columns: ['name']
                              });
                        var currencyText = fieldLookUpCr.name;
                        
                        if (currencyText == baseCurrency) {
                            var item_amount = parseFloat(item_amount_val) * parseFloat(exchange_rate);
                        } else {
                            var item_amount = parseFloat(item_amount_val) / parseFloat(exchange_rate);
                        }
            
                        var item_alloc_method = dataResult[j].gr_allocationMethod
            
                        if (item_alloc_method === "1") {
                            var item_amount_landed_cost = Number(
                            (item_amount / totalQty) * qty
                            );
                        }
            
                        if (item_alloc_method === "2") {
                            var item_amount_landed_cost = Number(
                            (item_amount / totalWeight) * qty_weight
                            );
                        }
            
                        if (item_alloc_method === "3") {
                            var item_amount_landed_cost = Number(
                            (item_amount / totalPrice) * price
                            );
                        }
            
                        if (item_alloc_method === "4") {
                            // log.debug("array cost category", cost_category_by_item);
                            var item_amount_landed_cost = 0;
                            for (var idx_c in cost_category_by_item) {
                            var cost_category = cost_category_by_item[idx_c];
                            var cost_category_to_check = cost_category.Category;
                            // log.debug("cost_category_to_check", cost_category_to_check);
                            // log.debug("item_cost_category", item_cost_category);
                            if (cost_category_to_check == item_cost_category) {
                                item_amount_landed_cost = cost_category.landedcost;
                            }
                            }
                        }
                        // log.debug("tes_1", "tes_1");
            
                        if (item_amount_landed_cost) {
                            var idx_subrec = subrec.getLineCount({
                            sublistId: "landedcostdata",
                            }) || 0;
                            subrec.insertLine({
                            sublistId: "landedcostdata",
                            line: idx_subrec,
                            });
                            // log.debug("tes_2", "tes_2");
            
                            subrec.setSublistValue({
                            sublistId: "landedcostdata",
                            fieldId: "costcategory",
                            line: idx_subrec,
                            value: item_cost_category,
                            });
                            // log.debug("tes_3", "tes_3");
            
                            subrec.setSublistValue({
                            sublistId: "landedcostdata",
                            fieldId: "amount",
                            line: idx_subrec,
                            value: item_amount_landed_cost,
                            });
                            // log.debug("tes_4", "tes_4");
                        }
                        }
                    }
            
                    try {
                        ir_data_to_update.setValue({
                        fieldId: 'custbody_abj_gr_ib_number',
                        value: ibIDform,
                        ignoreFieldChange: true
                        });
                        var recId = ir_data_to_update.save();
            
                        log.debug({
                        title: "Record created successfully",
                        details: "Id: " + recId,
                        });
            
                        success_gr_create_count += 1;
                        var scc_msg =
                        "Sucessfully Allocate Landed Cost" +
                        " for GR DOC NO " +
                        grDocNo +
                        "<br/>";
                        scc_messages += "&nbsp;" + scc_msg;
                    } catch (e) {
                        log.error({
                        title: e.name,
                        details: e.message,
                        });
                        var err_msg =
                        "Failed to Allocate Landed Cost" +
                        " for GR DOC NO " +
                        grDocNo +
                        " Error Name : " +
                        e.name +
                        " Message : " +
                        e.message +
                        "<br/>";
                        failed_gr_create_count += 1;
                        err_messages += "&nbsp;" + err_msg;
                    }
                    });
                var LcCostAllocs = search.create({
                    type: 'customrecordabj_ib_cost_allocation',
                    columns: ['internalid', 'custrecord_ca_ib_cost_category'],
                    filters: [{
                        name: 'custrecord_abj_ca_ib_number',
                        operator: 'is',
                        values: ibIDform
                    }, ]
                    }).run().getRange({
                    start: 0,
                    end: 4
                    });
            
                    var count = dataResult.length
                    for (var j = 0; j < count; j++) {

                    var item_cost_category = dataResult[j].item_cost_category
                    var rec_exists = false;
                    var rec_internalid;
                    for (i in LcCostAllocs) {
                        var LcCostAlloc = LcCostAllocs[i];
                        var costCategory_tocheck = LcCostAlloc.getValue({
                        name: 'custrecord_ca_ib_cost_category'
                        });
                        if (costCategory_tocheck === item_cost_category) {
                        rec_exists = true;
                        rec_internalid = LcCostAlloc.getValue({
                            name: 'internalid'
                        });
                        break;
                        }
                    }
                    var recCostAlloc;
                    if (rec_exists)
                        recCostAlloc = record.load({
                        type: "customrecordabj_ib_cost_allocation",
                        id: rec_internalid,
                        isDynamic: true
                        })
                    else
                        recCostAlloc = record.create({
                        type: "customrecordabj_ib_cost_allocation",
                        isDynamic: true
                        })
            
                    recCostAlloc.setValue({
                        fieldId: 'custrecord_abj_ca_ib_number',
                        value: ibIDform,
                        ignoreFieldChange: true
                    });
            
                    recCostAlloc.setValue({
                        fieldId: 'custrecord_ca_ib_cost_category',
                        value: item_cost_category,
                        ignoreFieldChange: true
                    });
            
                    var exchange_rate = dataResult[j].exchange_rate
                    var exchange_rate_2 = parseFloat(exchange_rate);
                    recCostAlloc.setValue({
                        fieldId: 'custrecord_ca_ib_cost_exchange_rate',
                        value: exchange_rate_2.toFixed(13),
                        ignoreFieldChange: true
                    });
                    recCostAlloc.setValue({
                        fieldId: 'custrecord_exchangerate1',
                        value: exchange_rate,
                        ignoreFieldChange: true
                    });
            
                    var item_amount = dataResult[j].item_amount_val
            
                    recCostAlloc.setValue({
                        fieldId: 'custrecord_ca_ib_cost_amount',
                        value: item_amount,
                        ignoreFieldChange: true
                    });
            
                    var currency_val = dataResult[j].currency_input
                    recCostAlloc.setValue({
                        fieldId: 'custrecord_ca_ib_cost_currency',
                        value: currency_val,
                        ignoreFieldChange: true
                    });
            
                    var item_alloc_method = dataResult[j].gr_allocationMethod
            
                    recCostAlloc.setValue({
                        fieldId: 'custrecord_ca_ib_cost_alloc_method',
                        value: item_alloc_method,
                        ignoreFieldChange: true
                    });
            
                    rec_internalid = recCostAlloc.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                }
                

            }catch (e) {
                log.debug("Error in Update Item Availability", e.name + ' : ' + e.message);
            }
            }
            
            return {
            execute: execute
        };
    });