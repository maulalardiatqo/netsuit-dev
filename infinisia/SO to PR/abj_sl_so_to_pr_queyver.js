/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/render","N/query"], function (serverWidget, search, record, url, runtime, currency, error, config, render, query) {
    try{
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
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "SO to PR",
            });
            form.addButton({
                id: "convertPR",
                label: "Convert to PR",
                functionName: "soToPR",
            });
            if (contextRequest.method == "GET") {
                var sqlQuery = `
             SELECT 
                    so.entity AS entity_id,
                    customer.entityid AS entity_name, 
                customer.companyname AS company_name,
                            so.tranid AS tranid,
                            so.otherrefnum AS otherrefnum,
                            so.custbody_abj_sales_rep_fulfillment AS salesrep_id,
                            employee.firstname AS salesrep_name,
                employee.lastname AS sales_last_name,
                            so.id,
                            line.transaction,
                            line.item AS item_id,
                            item.itemid AS item_name,
                item.itemtype AS item_type,
                            line.quantity AS quantity,
                            line.quantityshiprecv AS quantity_ship_received,
                            line.units AS unit,
                    unitsTypeUom.unitName AS unit_name,
                    unitsTypeUom.conversionRate AS conversion_rate,
                        FROM 
                            transaction AS so
                        JOIN 
                            transactionline AS line
                        ON 
                            so.id = line.transaction
                        JOIN
                            customer
                        ON
                            so.entity = customer.id 
                        JOIN
                            employee
                        ON
                            so.custbody_abj_sales_rep_fulfillment = employee.id
                        JOIN
                            item
                        ON
                            line.item = item.id 
                JOIN
                    unitsTypeUom
                ON
                    line.units = unitsTypeUom.internalId
                WHERE 
                    so.type = 'SalesOrd'
                AND
                    line.item IS NOT NULL
                AND 
                    line.item IN (SELECT id FROM item)
            `;

                var resultSet = query.runSuiteQL({
                    query: sqlQuery
                });

                var results = resultSet.asMappedResults();

                if (results.length > 0) {
                    var currentRecord = createSublist("custpage_sublist_item", form);
                    var allData = []
                    for (var i = 0; i < results.length; i++) {
                        var result = results[i];
                        var customer_fName = result.entity_name
                        var customer_lName = result.company_name
                        var customerName = customer_fName + " " + customer_lName
                        var customerId =  result.entity_id
                        var docNumber = result.tranid
                        var poNumber = result.otherrefnum
                        var salesRepName = result.salesrep_name + ' ' + result.sales_last_name
                        var salesRepId = result.salesrep_id
                        var itemId = result.item_id
                        var itemName = result.item_name
                        var osPOKg = Math.abs(result.quantity)
                        var units = result.unit_name
                        var idSO = result.id
                        var rateUnit = result.conversion_rate

                        var currentStock = 0
                        var isReSearch = true
                        var inventorynumberSearchObj = search.create({
                            type: "inventorynumber",
                            filters:
                            [
                                ["item.type","anyof","InvtPart"], 
                                "AND", 
                                ["item","anyof",itemId], 
                                "AND", 
                                ["custitemnumber1","anyof",salesRepId], 
                                "AND", 
                                ["custitemnumber_lot_customer","anyof",customerId], 
                                "AND", 
                                ["custitemnumber_lot_so_number","anyof",idSO]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "custitemnumber1",
                                    summary: "GROUP",
                                    label: "Sales Rep"
                                }),
                                search.createColumn({
                                    name: "custitemnumber_lot_customer",
                                    summary: "GROUP",
                                    label: "Customer"
                                }),
                                search.createColumn({
                                    name: "quantityonhand",
                                    summary: "SUM",
                                    label: "On Hand"
                                })
                            ]
                        });
                       
                        var searchResult = inventorynumberSearchObj.run().getRange({start: 0, end: 1});
                        if (searchResult.length > 0) {
                            var qtyOnhand = searchResult[0].getValue({ name: "quantityonhand",
                                summary: "SUM",
                            });
                            if(qtyOnhand){
                                currentStock = Number(qtyOnhand)
                                isReSearch = false
                            }
                        } 
                        if(isReSearch == true){
                            var inventorynumberSearchObj2 = search.create({
                                type: "inventorynumber",
                                filters:
                                [
                                    ["item.type","anyof","InvtPart"], 
                                    "AND", 
                                    ["item","anyof",itemId], 
                                    "AND", 
                                    ["custitemnumber1","anyof",salesRepId], 
                                    "AND", 
                                    ["custitemnumber_lot_customer","anyof",customerId],
                                    "AND", 
                                    ["custitemnumber_lot_so_number","anyof","@NONE@"]
                                ],
                                columns:
                                [
                                    search.createColumn({
                                        name: "custitemnumber1",
                                        summary: "GROUP",
                                        label: "Sales Rep"
                                    }),
                                    search.createColumn({
                                        name: "custitemnumber_lot_customer",
                                        summary: "GROUP",
                                        label: "Customer"
                                    }),
                                    search.createColumn({
                                        name: "quantityonhand",
                                        summary: "SUM",
                                        label: "On Hand"
                                    })
                                ]
                            });
                           
                            var searchResult2 = inventorynumberSearchObj2.run().getRange({start: 0, end: 1});
              
                            if (searchResult2.length > 0) {
                                var qtyOnhand = searchResult2[0].getValue({ name: "quantityonhand",
                                    summary: "SUM",
                                });
                                if(qtyOnhand){
                                    currentStock = Number(qtyOnhand)
                                    isReSearch = false
                                }
                            } 
                        }
                        var osPOperPackag = Number(osPOKg) / Number(rateUnit)
                        var scriptObj = runtime.getCurrentScript();
                        log.debug("totalEksekusi ", i)
                        log.debug({ 
                            title: "Remaining usage units cek in looping: ",
                            details: scriptObj.getRemainingUsage(),
                        });
                        // search incoming stock
                        var incoimngStock = 0
                        var research = true
                        if(idSO){
                            var purchaseorderSearchObj = search.create({
                                type: "purchaseorder",
                                filters:
                                [
                                    ["type","anyof","PurchOrd"], 
                                    "AND", 
                                    ["customform","anyof","104"], 
                                    "AND", 
                                    ["status","anyof","PurchOrd:E","PurchOrd:B"], 
                                    "AND", 
                                    ["mainline","is","F"], 
                                    "AND", 
                                    ["taxline","is","F"], 
                                    "AND", 
                                    ["cogs","is","F"], 
                                    "AND", 
                                    ["formulatext: {item}","isnotempty",""], 
                                    "AND", 
                                    ["formulatext: {custcol_abj_sales_rep_line}","isnotempty",""], 
                                    "AND", 
                                    ["item","anyof", itemId], 
                                    "AND", 
                                    ["custcol_abj_sales_rep_line","anyof",salesRepId], 
                                    "AND", 
                                    ["custcol_abj_customer_line","anyof",customerId], 
                                    "AND", 
                                    ["custcol_abj_no_so","anyof",idSO]
                                ],
                                columns:
                                [
                                    search.createColumn({
                                        name: "item",
                                        summary: "GROUP",
                                        label: "Item"
                                    }),
                                    search.createColumn({
                                        name: "custcol_abj_sales_rep_line",
                                        summary: "GROUP",
                                        label: "Sales Rep"
                                    }),
                                    search.createColumn({
                                        name: "custcol_abj_customer_line",
                                        summary: "GROUP",
                                        label: "ABJ - Customer"
                                    }),
                                    search.createColumn({
                                        name: "quantity",
                                        summary: "SUM",
                                        label: "Quantity"
                                    }),
                                    search.createColumn({
                                        name: "quantityshiprecv",
                                        summary: "SUM",
                                        label: "Quantity Fulfilled/Received"
                                    }),
                                    search.createColumn({
                                        name: "formulanumeric",
                                        summary: "SUM",
                                        formula: "{quantity}-{quantityshiprecv}",
                                        label: "Formula (Numeric)"
                                    })
                                ]
                            });
                            var searchIncom1 = purchaseorderSearchObj.run().getRange({start: 0, end: 1});
              
                            if (searchIncom1.length > 0) {
                                var qtyIncomingStock = searchIncom1[0].getValue({
                                    name: "formulanumeric",
                                    summary: "SUM",
                                    formula: "{quantity}-{quantityshiprecv}",
                                })
                                if(qtyIncomingStock){
                                    incoimngStock += Number(qtyIncomingStock)
                                    research = false
                                }
                            } 
                           
                        }
                        if(research == true){
                            var purchaseorderSearchObj2 = search.create({
                                type: "purchaseorder",
                                filters:
                                [
                                    ["type","anyof","PurchOrd"], 
                                    "AND", 
                                    ["customform","anyof","104"], 
                                    "AND", 
                                    ["status","anyof","PurchOrd:E","PurchOrd:B"], 
                                    "AND", 
                                    ["mainline","is","F"], 
                                    "AND", 
                                    ["taxline","is","F"], 
                                    "AND", 
                                    ["cogs","is","F"], 
                                    "AND", 
                                    ["formulatext: {item}","isnotempty",""], 
                                    "AND", 
                                    ["formulatext: {custcol_abj_sales_rep_line}","isnotempty",""], 
                                    "AND", 
                                    ["item","anyof", itemId], 
                                    "AND", 
                                    ["custcol_abj_sales_rep_line","anyof",salesRepId], 
                                    "AND", 
                                    ["custcol_abj_customer_line","anyof",customerId],
                                    "AND", 
                                    ["custcol_abj_no_so","anyof","@NONE@"]
                                ],
                                columns:
                                [
                                    search.createColumn({
                                        name: "item",
                                        summary: "GROUP",
                                        label: "Item"
                                    }),
                                    search.createColumn({
                                        name: "custcol_abj_sales_rep_line",
                                        summary: "GROUP",
                                        label: "Sales Rep"
                                    }),
                                    search.createColumn({
                                        name: "custcol_abj_customer_line",
                                        summary: "GROUP",
                                        label: "ABJ - Customer"
                                    }),
                                    search.createColumn({
                                        name: "quantity",
                                        summary: "SUM",
                                        label: "Quantity"
                                    }),
                                    search.createColumn({
                                        name: "quantityshiprecv",
                                        summary: "SUM",
                                        label: "Quantity Fulfilled/Received"
                                    }),
                                    search.createColumn({
                                        name: "formulanumeric",
                                        summary: "SUM",
                                        formula: "{quantity}-{quantityshiprecv}",
                                        label: "Formula (Numeric)"
                                    })
                                ]
                            });
                           
                            var searchIncom2 = purchaseorderSearchObj2.run().getRange({start: 0, end: 1});
              
                            if (searchIncom2.length > 0) {
                                var qtyIncomingStock = searchIncom2[0].getValue({
                                    name: "formulanumeric",
                                    summary: "SUM",
                                    formula: "{quantity}-{quantityshiprecv}",
                                })
                                if(qtyIncomingStock){
                                    incoimngStock += Number(qtyIncomingStock)
                                    research = false
                                }
                            } 
                        }
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_idso",
                            value: idSO || " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_doc_number",
                            value: docNumber || " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_itemname",
                            value: itemName || " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_customer",
                            value: customerName || " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_pocustomer",
                            value: poNumber || " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_busdevrep",
                            value: salesRepName || " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ospo",
                            value: osPOKg || " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_packsize",
                            value: units || " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ospo_packing",
                            value: osPOperPackag || " ",
                            line: i,
                        });
                        // berlum terset
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_current_stock",
                            value: currentStock || 0,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_incoming_stock",
                            value: incoimngStock || 0,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_tanggal_kirim",
                            value: " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_forecast_busdev",
                            value: " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_forecast_perhitungan",
                            value: " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_avg_busdev",
                            value: " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_avg_accounting",
                            value: " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_totalorder_kg",
                            value: " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_packsize_order",
                            value: " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_total_packaging",
                            value: " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_note",
                            value: " ",
                            line: i,
                        });
                    }
                } 
            
                
                context.response.writePage(form);
            
                var scriptObj = runtime.getCurrentScript();
                log.debug({
                    title: "Remaining usage units: ",
                    details: scriptObj.getRemainingUsage(),
                });
                
            }
        }
        function createSublist(sublistname, form) {
            var sublist_in = form.addSublist({
                id: sublistname,
                type: serverWidget.SublistType.LIST,
                label: "SO List",
                tab: "matchedtab",
            });
            sublist_in.addMarkAllButtons();
    
            sublist_in.addField({
                id: "custpage_sublist_item_select",
                label: "Select",
                type: serverWidget.FieldType.CHECKBOX,
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
            });
            sublist_in
            .addField({
                id: "custpage_sublist_idso",
                label: "ID SO",
                type: serverWidget.FieldType.TEXT,
            })
            .updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist_in.addField({
                id: "custpage_sublist_doc_number",
                label: "SO NUMBER",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_itemname",
                label: "ITEM",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_current_stock",
                label: "CURRENT STOCK",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_incoming_stock",
                label: "INCOMING STOCK",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_busdevrep",
                label: "SALES REP",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_customer",
                label: "CUSTOMER",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_ospo",
                label: "OS PO/KG",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_packsize",
                label: "PACK SIZE",
                type: serverWidget.FieldType.TEXT,
            });
            
            sublist_in.addField({
                id: "custpage_sublist_ospo_packing",
                label: "OS PO/PACKING",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_pocustomer",
                label: "PO CUSTOMER",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_tanggal_kirim",
                label: "TANGGAL KIRIM",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_forecast_busdev",
                label: "FORECAST BUSDEV",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_forecast_perhitungan",
                label: "FORECAST PERHITUNGAN",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_avg_busdev",
                label: "AVG BUSDEV",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_avg_accounting",
                label: "AVG ACCOUNTING",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_totalorder_kg",
                label: "TOTAL ORDER/1KG",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_packsize_order",
                label: "PACK SIZE ORDER",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_total_packaging",
                label: "TOTAL PACKAGING",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_note",
                label: "NOTE",
                type: serverWidget.FieldType.TEXT,
            });
            return sublist_in;
        }
    }catch(e){
        log.debug('error', e)
    }
   
    return {
        onRequest: onRequest,
      };
    });