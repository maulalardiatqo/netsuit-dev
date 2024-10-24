/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/render"], function (serverWidget, search, record, url, runtime, currency, error, config, render) {
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
                var currentRecord = createSublist("custpage_sublist_item", form);
                var soToPR = search.load({
                    id: "customsearch_abj_so_to_pr",
                });
                var soToPRSet = soToPR.run();
                var soToPR = soToPRSet.getRange(0, 100);
                log.debug('soToPR', soToPR.length)
                if (soToPR.length > 0) {
                    for (let i = 0; i < soToPR.length; i++) {
                        let customerName = soToPR[i].getText({
                            name: soToPRSet.columns[0],
                        });
                        log.debug('customerName', customerName)
                        let customerId = soToPR[i].getValue({
                            name: soToPRSet.columns[0],
                        });
                        let docNumber = soToPR[i].getValue({
                            name: soToPRSet.columns[1],
                        });
                        let poNumber = soToPR[i].getValue({
                            name: soToPRSet.columns[2],
                        });
                        let salesRepName = soToPR[i].getText({
                            name: soToPRSet.columns[3],
                        });
                        let salesRepId = soToPR[i].getValue({
                            name: soToPRSet.columns[3],
                        });
                        let itemId = soToPR[i].getValue({
                            name: soToPRSet.columns[4],
                        });
                        let itemName = soToPR[i].getText({
                            name: soToPRSet.columns[4],
                        });
                        let totalOrder = soToPR[i].getValue({
                            name: soToPRSet.columns[5],
                        });
                        let osPOKg = soToPR[i].getValue({
                            name: soToPRSet.columns[6],
                        });
                        let units = soToPR[i].getValue({
                            name: soToPRSet.columns[7],
                        });
                       
                        let poPackag = soToPR[i].getValue({
                            name: soToPRSet.columns[8],
                        });
                        let idSO = soToPR[i].getValue({
                            name: soToPRSet.columns[8],
                        });
                        var rateUnit = 1
                        log.debug('units', units)
                        if(units){
                            var unitstypeSearchObj = search.create({
                                type: "unitstype",
                                filters:
                                [
                                    ["unitname","is",units]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "conversionrate", label: "Rate"})
                                ]
                            });
                            var searchResultUnit = unitstypeSearchObj.run().getRange({start: 0, end: 1});
                            
                            if (searchResultUnit.length > 0) {
                                var rUnit = searchResultUnit[0].getValue({name: "conversionrate"});
                                if(rUnit){
                                    rateUnit = rUnit
                                }
                            } 
                        }
                        var osPOperPackag = Number(osPOKg) / Number(rateUnit)
                        log.debug('osPOperPackag', osPOperPackag)
                        log.debug('rateUnit', rateUnit)
                        // search qty onHand
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
                           
                            var searchResult2 = inventorynumberSearchObj.run().getRange({start: 0, end: 1});
              
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
                            value: currentStock || " ",
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_incoming_stock",
                            value: " ",
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