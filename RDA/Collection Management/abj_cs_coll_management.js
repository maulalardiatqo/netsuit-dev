/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log", "N/search"],
    function(error,dialog,url,record,currentRecord,log, search) {
        var allIdIr = []
        var records = currentRecord.get();
        function convertDate(dateStr) {
            const date = new Date(dateStr);
        
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); 
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        
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
                    var idAsset = ''
                    var customrecord_ncfar_assetSearchObj = search.create({
                        type: "customrecord_ncfar_asset",
                        filters:
                        [
                            ["custrecord_rda_nopol_","is",noPol]
                        ],
                        columns:
                        [
                            search.createColumn({name: "altname", label: "Name"}),
                            search.createColumn({name: "internalid", label: "Name"})
                        ]
                    });
                    var searchResults = customrecord_ncfar_assetSearchObj.run().getRange({ start: 0, end: 1 });
            
                    if (searchResults.length > 0) {
                        var altName = searchResults[0].getValue({ name: 'altname' });
                        if(altName){
                            nameAsset = altName
                        }
                        var id = searchResults[0].getValue({ name: 'internalid' });
                        if(id){
                            idAsset = id
                        }
                    }
                    console.log('nameAsset', nameAsset)
                    if(nameAsset != '' ){
                        vrecord.setValue({
                            fieldId: 'custpage_armada',
                            value : nameAsset
                        });
                        vrecord.setValue({
                            fieldId: 'custpage_armada_id',
                            value : idAsset
                        });
                    }
                }else{
                    vrecord.setValue({
                        fieldId: 'custpage_armada',
                        value : ''
                    });
                }
                

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
            if(area && subsidiary){
                var dataSearch = search.load({
                    id: "customsearch_rda_collection_management",
                });
               
                var cekDate = convertDate(date)
                if(cekDate){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "trandate",
                        operator: search.Operator.ON,
                        values: cekDate,
                        })
                    );
                }
                if(subsId){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "subsidiary",
                        operator: search.Operator.ANYOF,
                        values: subsId,
                        })
                    );
                }
                var dateSearchSet = dataSearch.run();
                var dataSearch = dateSearchSet.getRange(0, 1000);

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
                        var memo = dataSearch[i].getValue({
                            name: dateSearchSet.columns[4],
                        });
                        var currency = dataSearch[i].getText({
                            name: dateSearchSet.columns[5],
                        });
                        var idSubs = dataSearch[i].getValue({
                            name: dateSearchSet.columns[6],
                        });
                        var idPer = dataSearch[i].getValue({
                            name: dateSearchSet.columns[7],
                        });
                        var idFul = dataSearch[i].getValue({
                            name: dateSearchSet.columns[8],
                        });
                        var area = dataSearch[i].getValue({
                            name: dateSearchSet.columns[9],
                        });
                        var Subarea = dataSearch[i].getValue({
                            name: dateSearchSet.columns[10],
                        });
                        allData.push({
                            doNumber : doNumber,
                            soNumber : soNumber,
                            doDate : doDate,
                            customer : customer,
                            memo : memo,
                            currency : currency,
                            idCus : idCus,
                            idSubs : idSubs,
                            idPer : idPer,
                            idFul : idFul,
                            area : area,
                            Subarea : Subarea
                        })
                    }
                    console.log('allData', allData)
                    allData.forEach(function(data) {
                        var doNumber = data.doNumber
                        var soNumber = data.soNumber
                        var doDate = data.doDate
                        var customer = data.customer
                        var memo = data.memo
                        var currency = data.currency
                        var idPer = data.idPer
                        var idFul = data.idFul
                        var area = data.area
                        var Subarea = data.Subarea
                    
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
                            fieldId: 'custpage_sublist_memo',
                            value: memo
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
                            fieldId: 'custpage_sublist_perid',
                            value: idPer
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_idfulfill',
                            value: idFul
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_area',
                            value: area
                        });
                        records.setCurrentSublistValue({
                            sublistId: 'custpage_sublist', 
                            fieldId: 'custpage_sublist_sub_area',
                            value: Subarea
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
 