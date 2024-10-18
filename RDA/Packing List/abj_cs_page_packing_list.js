/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log", "N/search"],
    function(error,dialog,url,record,currentRecord,log, search) {
        var allIdIr = []
        var records = currentRecord.get();
        function pageInit(context) {
            console.log("masuk client");
        }
        function fieldChanged(context) {
            if(context.fieldId == 'custpage_nopol'){
                var vrecord = context.currentRecord;
                console.log('change');
                var noPol = vrecord.getValue('custpage_nopol');
                console.log('noPol', noPol);
                if(noPol){
                    var nameAsset = ''
                    var customrecord_ncfar_assetSearchObj = search.create({
                        type: "customrecord_ncfar_asset",
                        filters:
                        [
                            ["custrecord_rda_nopol_","is",noPol]
                        ],
                        columns:
                        [
                            search.createColumn({name: "altname", label: "Name"})
                        ]
                    });
                    var searchResults = customrecord_ncfar_assetSearchObj.run().getRange({ start: 0, end: 1 });
            
                    if (searchResults.length > 0) {
                        var altName = searchResults[0].getValue({ name: 'altname' });
                        if(altName){
                            nameAsset = altName
                        }
                    }
                    console.log('nameAsset', nameAsset)
                    if(nameAsset != '' ){
                        vrecord.setValue({
                            fieldId: 'custpage_armada',
                            value : nameAsset
                        });
                    }
                }else{
                    vrecord.setValue({
                        fieldId: 'custpage_armada',
                        value : ''
                    });
                }
                

            }
            if(context.fieldId == 'custpage_order_number'){
                var vrecord = context.currentRecord;
                console.log('change');
                var noDo = vrecord.getValue('custpage_order_number');
                if(noDo){
                    console.log('noDo', noDo)
                    var salesorderSearchObj = search.create({
                        type: "salesorder",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                        filters:
                        [
                            ["type","anyof","SalesOrd"], 
                            "AND", 
                            ["number","equalto",noDo], 
                            "AND", 
                            ["mainline","is","T"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                    });
                    var searchResults = salesorderSearchObj.run().getRange({ start: 0, end: 1 });
                    
                    if (searchResults.length > 0) {
                        var idSO = searchResults[0].getValue({ name: 'internalid' });
                        console.log('idSO', idSO)
                        var dataSearch = search.load({
                            id: "customsearch_rda_packing_list_shipped",
                        });
                        dataSearch.filters.push(
                            search.createFilter({
                            name: "createdfrom",
                            operator: search.Operator.ANYOF,
                            values: idSO,
                            })
                        );
                        var dateSearchSet = dataSearch.run();
                        var dataSearch = dateSearchSet.getRange(0, 1000);

                        if (dataSearch.length > 0) {
                            var allData = []
                            for (var i = 0; i < dataSearch.length; i++) {
                                var doNumber = dataSearch[i].getValue({
                                    name: dateSearchSet.columns[0],
                                });
                                var soNumber = dataSearch[i].getValue({
                                    name: dateSearchSet.columns[1],
                                });
                                var doDate = dataSearch[i].getValue({
                                    name: dateSearchSet.columns[2],
                                });
                                var customer = dataSearch[i].getValue({
                                    name: dateSearchSet.columns[3],
                                });
                                var memo = dataSearch[i].getValue({
                                    name: dateSearchSet.columns[4],
                                });
                                allData.push({
                                    doNumber : doNumber,
                                    soNumber : soNumber,
                                    doDate : doDate,
                                    customer : customer,
                                    memo : memo
                                })
                            }
                            console.log('allData', allData)
                            allData.forEach(function(data) {
                                var doNumber = data.doNumber
                                var soNumber = data.soNumber
                                var doDate = data.doDate
                                var customer = data.customer
                                var memo = data.memo
                            
                                vrecord.selectNewLine({ sublistId: 'custpage_sublist_item' });
                                vrecord.setCurrentSublistValue({
                                    sublistId: 'custpage_sublist_item', 
                                    fieldId: 'custpage_sublist_item_select',
                                    value: false
                                });
                                vrecord.setCurrentSublistValue({
                                    sublistId: 'custpage_sublist_item', 
                                    fieldId: 'custpage_sublist_process',
                                    value: 'test'
                                });
                                records.setCurrentSublistValue({
                                    sublistId: 'custpage_sublist_item', 
                                    fieldId: 'custpage_sublist_transaction_type',
                                    value: 'Sales Order'
                                });
                                vrecord.setCurrentSublistValue({
                                    sublistId: 'custpage_sublist_item', 
                                    fieldId: 'custpage_sublist_no_so',
                                    value: 'test'
                                });
                                vrecord.commitLine({ sublistId: 'custpage_sublist_item' });

                              
                            });
                        }else{
                            alert("No Data Found!")
                            vrecord.setValue({
                                fieldId: 'custpage_order_number',
                                value : ''
                            });
                        }   

                    }else{
                        alert("No Matching Data!")
                        vrecord.setValue({
                            fieldId: 'custpage_order_number',
                            value : ''
                        });

                    }
                }
            }
        }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
    };
}); 
 