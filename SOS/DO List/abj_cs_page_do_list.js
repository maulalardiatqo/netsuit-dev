/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log", "N/search", "N/runtime", 'N/ui/message'],
    function(error,dialog,url,record,currentRecord,log, search, runtime, message) {
        var allIdIr = []
        var records = currentRecord.get();
        function convertDate(dateStr) {
            const date = new Date(dateStr);
        
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); 
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        function pageInit(){
            console.log("masuk client");
            const orderNumberSo = records.getField({ fieldId: 'custpage_order_number_so' });
            const orderNumberTo = records.getField({ fieldId: 'custpage_order_number_to' });
            orderNumberSo.isDisplay = false
            orderNumberTo.isDisplay = false
        }

        function fieldChanged(context){
            if (context.fieldId !== 'custpage_order_type') return;
            console.log('fieldHasChanged')
            const rec = currentRecord.get();
            const orderType = rec.getValue({ fieldId: 'custpage_order_type' });

            const orderNumberSO = rec.getField({ fieldId: 'custpage_order_number_so' });
            const orderNumberTO = rec.getField({ fieldId: 'custpage_order_number_to' });
            if (orderType === '1') {
                orderNumberSO.isDisplay = true
                orderNumberTO.isDisplay = false
            } else if (orderType === '2') {
                orderNumberTO.isDisplay = true
                orderNumberSO.isDisplay = false
            }

           
        }
        window.onCustomButtonClick = function(context) {
            searchFilter(context)
        }
        function searchFilter(context){
            var cekLine = records.getLineCount({sublistId : "custpage_sublist"});
            console.log('cekLine', cekLine)
            if(cekLine > 0){
                for(var i = cekLine - 1; i >= 0; i--){
                    var isSelect = records.getSublistValue({
                        sublistId : "custpage_sublist",
                        fieldId : "custpage_sublist_item_select",
                        line : i
                    });
                    console.log('isSelect', isSelect)
                    if(isSelect == false){
                        records.selectLine({ sublistId: 'custpage_sublist', line: i });
                        records.removeLine({ sublistId: 'custpage_sublist', line: i});
                    }
                }
            }
            console.log('cek log')
            var subsidiary = records.getValue('custpage_subsidiary');
            var orderType = records.getValue('custpage_order_type');
            var noDo
            if(orderType == '1'){
                noDo = records.getValue('custpage_order_number_so');
            }else{
                noDo = records.getValue('custpage_order_number_to');
            }
            
            var customerId = records.getValue('custpage_customer');
            var date_from = convertDate(records.getValue('custpage_date_from'));
            var date_to = convertDate(records.getValue('custpage_date_to'));
            var subsId = records.getValue('custpage_subsidiary');
            if(subsidiary){
                console.log('subsidiary', subsidiary)
                var dataSearch = search.load({
                    id: "customsearch588",
                });
                console.log('1')
                console.log('data filter', {customerId : customerId, date_from : date_from, date_to : date_to, subsId : subsId})
                if(customerId){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "name",
                        join : "custrecord_packship_itemfulfillment",
                        operator: search.Operator.ANYOF,
                        values: customerId,
                        })
                    );
                }
                console.log('2')
                if(date_from){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "trandate",
                        join : "custrecord_packship_itemfulfillment",
                        operator: search.Operator.ONORAFTER,
                        values: date_from,
                        })
                    );
                }
                console.log('3')
                if(date_to){
                     dataSearch.filters.push(
                        search.createFilter({
                        name: "trandate",
                        join : "custrecord_packship_itemfulfillment",
                        operator: search.Operator.ONORBEFORE,
                        values: date_to,
                        })
                    );
                }
                console.log('4')
                if(noDo){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "createdfrom",
                        join : "custrecord_packship_itemfulfillment",
                        operator: search.Operator.ANYOF,
                        values: noDo,
                        })
                    );
                }
                console.log('5')
                if(subsidiary){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "subsidiary",
                        join : "custrecord_packship_itemfulfillment",
                        operator: search.Operator.ANYOF,
                        values: subsidiary,
                        })
                    );
                }
                console.log('6')
                var dateSearchSet = dataSearch.run();
                console.log('runSearch result', JSON.stringify(dateSearchSet));
                var dataSearch = dateSearchSet.getRange({
                    start: 0,
                    end: 1000
                });

                console.log('dataSearch', dataSearch)
                if (dataSearch.length > 0) {
                    var allData = []
                    for (var i = 0; i < dataSearch.length; i++) {
                        var doNumber = dataSearch[i].getValue({
                            name: dateSearchSet.columns[0],
                        });
                        var soNumber = dataSearch[i].getText({
                            name: dateSearchSet.columns[1],
                        });
                        var doDate = dataSearch[i].getValue({
                            name: dateSearchSet.columns[2],
                        });
                        var customer = dataSearch[i].getText({
                            name: dateSearchSet.columns[3],
                        });
                        var idCus = dataSearch[i].getValue({
                            name: dateSearchSet.columns[3],
                        });
                        var currency = dataSearch[i].getText({
                            name: dateSearchSet.columns[4],
                        });
                        var idSubs = dataSearch[i].getValue({
                            name: dateSearchSet.columns[5],
                        });

                        var idFul = dataSearch[i].getValue({
                            name: dateSearchSet.columns[6],
                        });
                        var packCartonId = dataSearch[i].getValue({
                            name: dateSearchSet.columns[7],
                        });
                        var packCartonText = dataSearch[i].getText({
                            name: dateSearchSet.columns[7],
                        });
                        allData.push({
                            doNumber : doNumber,
                            soNumber : soNumber,
                            doDate : doDate,
                            customer : customer,
                            currency : currency,
                            idCus : idCus,
                            idSubs : idSubs,
                            idFul : idFul,
                            packCartonId : packCartonId,
                            packCartonText : packCartonText
                        })
                    }
                    console.log('allData', allData)
                    allData.forEach(function(data) {
                        var doNumber = data.doNumber
                        var soNumber = data.soNumber
                        var doDate = data.doDate
                        var customer = data.customer
                        var currency = data.currency
                        var idFul = data.idFul
                        var packCartonText = data.packCartonText
                        var packCartonId = data.packCartonId
                    
                        records.selectNewLine({ sublistId: 'custpage_sublist' });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_item_select',
                            value: false
                        })
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_transaction_type',
                            value: 'Sales Order'
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_no_so',
                            value: soNumber
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_no_fulfill',
                            value: 'Item Fulfillment #' + ' ' +doNumber
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_date',
                            value: doDate
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_customer',
                            value: customer
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_curr',
                            value: currency
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_idcus',
                            value: idCus
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_subsidiary',
                            value: idSubs
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_idfulfill',
                            value: idFul
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_pack_carton',
                            value: packCartonText
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_pack_carton_id',
                            value: packCartonId
                        });
                        records.commitLine({ sublistId: 'custpage_sublist' });

                        
                    });
                }else{
                    alert("No Data Found!")
                    records.setValue({
                        fieldId: 'custpage_order_number',
                        value : ''
                    });
                }   

                
            }else{
                alert("Please fill in the Area and Subsidiary fields");
            }
        }
        function markAll() {
            var rec = currentRecord.get();
            var sublistName = 'custpage_sublist';  
    
            var lineCount = rec.getLineCount({ sublistId: sublistName });
            for (var i = 0; i < lineCount; i++) {
                rec.selectLine({ sublistId: sublistName, line: i });
                rec.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custpage_sublist_item_select',
                    value: true
                });
                rec.commitLine({ sublistId: sublistName });
            }
        }
    
        function unmarkAll() {
            var rec = currentRecord.get();
            var sublistName = 'custpage_sublist';  
    
            var lineCount = rec.getLineCount({ sublistId: sublistName });
            for (var i = 0; i < lineCount; i++) {
                rec.selectLine({ sublistId: sublistName, line: i });
                rec.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custpage_sublist_item_select',
                    value: false
                });
                rec.commitLine({ sublistId: sublistName });
            }
        }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
        markAll : markAll,
        unmarkAll : unmarkAll,
        searchFilter : searchFilter
    };
}); 