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
                        let item = soToPR[i].getValue({
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
                            name: soToPRSet.columns[9],
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
                id: "custpage_sublist_customer",
                label: "CUSTOMER",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_doc_number",
                label: "DOC NUMBER",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_pocustomer",
                label: "PO CUSTOMER",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_busdevrep",
                label: "BUSDEV REP",
                type: serverWidget.FieldType.TEXT,
            });
            sublist_in.addField({
                id: "custpage_sublist_itemname",
                label: "ITEM",
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
            // sublist_in.addField({
            //     id: "custpage_sublist_qtyorder",
            //     label: "QTY ORDER/PACKING",
            //     type: serverWidget.FieldType.TEXT,
            // });
            sublist_in.addField({
                id: "custpage_sublist_ospo_packing",
                label: "OS PO/PACKING",
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