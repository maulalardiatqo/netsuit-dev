/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log", "N/search", "N/runtime"],
    function(error,dialog,url,record,currentRecord,log, search, runtime) {
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
            var vrecord = context.currentRecord;
            let currentUser = runtime.getCurrentUser();
            let subsidiaryId = currentUser.subsidiary;
            console.log('subsidiaryId', subsidiaryId);
        
            if (subsidiaryId) {
                var customrecord_ncfar_assetSearchObj = search.create({
                    type: "customrecord_ncfar_asset",
                    filters: [
                        ["custrecord_assetsubsidiary", "anyof", subsidiaryId]
                    ],
                    columns: [
                        search.createColumn({ name: "custrecord_rda_nopol_", label: "NOPOL" }),
                        search.createColumn({ name: "altname", label: "Name" })
                    ]
                });
        
                var nopolField = vrecord.getField({ fieldId: 'custpage_nopol' });
        
                // Menambahkan opsi default "- Select -" di paling atas
                // nopolField.insertSelectOption({
                //     value: '',
                //     text: '- Select -'
                // });
        
                customrecord_ncfar_assetSearchObj.run().each(function(result) {
                    var nopol = result.getValue({
                        name: "custrecord_rda_nopol_"
                    });
                    
                    if (nopol) {
                        nopolField.insertSelectOption({
                            value: nopol,
                            text: nopol
                        });
                    }
        
                    return true;
                });
                var subsidiaryFIeld = vrecord.getField({ fieldId: 'custpage_subsidiary' });
            //     function getAllSubsidiaries(parentId) {
            //         var subsidiaries = [];
    
            //         var searchObj = search.create({
            //             type: "subsidiary",
            //             filters: [
            //                 ["parent", "anyof", parentId]
            //             ],
            //             columns: [
            //                 search.createColumn({name: "internalid", label: "ID"}),
            //                 search.createColumn({name: "name", label: "Name"})
            //             ]
            //         });
    
            //         searchObj.run().each(function(result) {
            //             let id = result.getValue({name: "internalid"});
            //             let name = result.getValue({name: "name"});
            //             subsidiaries.push({ id: id, name: name });
                        
            //             subsidiaries = subsidiaries.concat(getAllSubsidiaries(id));
            //             return true;
            //         });
    
            //         return subsidiaries;
            //     }
    
            //     let subsidiaries = getAllSubsidiaries(subsidiaryId);
            //    console.log('subsidiaries', subsidiaries)
    
                // subsidiaries.forEach(function(subsidiary) {
                //     subsidiaryFIeld.insertSelectOption({
                //         value: subsidiary.id,
                //         text: subsidiary.name
                //     });
                // });
            }
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
                    var spr = ''
                    var hlp = ''
                    var customrecord_ncfar_assetSearchObj = search.create({
                        type: "customrecord_ncfar_asset",
                        filters:
                        [
                            ["custrecord_rda_nopol_","is",noPol]
                        ],
                        columns:
                        [
                            search.createColumn({name: "altname", label: "Name"}),
                            search.createColumn({name: "internalid", label: "Name"}),
                            search.createColumn({name: "custrecord_rda_kend_sewa_supir", label: "Supir"}),
                            search.createColumn({name: "custrecord_rda_kend_sewa_helper", label: "Helper"})
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
                        var sprName = searchResults[0].getValue({ name: 'custrecord_rda_kend_sewa_supir' });
                        if(sprName){
                            spr = sprName
                        }
                        var hlpName = searchResults[0].getValue({ name: 'custrecord_rda_kend_sewa_helper' });
                        if(hlpName){
                            hlp = hlpName
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
                        vrecord.setValue({
                            fieldId: 'custpage_supir',
                            value : sprName
                        });
                        vrecord.setValue({
                            fieldId: 'custpage_helper',
                            value : hlpName
                        });
                    }
                }else{
                    vrecord.setValue({
                        fieldId: 'custpage_armada',
                        value : ''
                    });
                    vrecord.setValue({
                        fieldId: 'custpage_supir',
                        value : ''
                    });
                    vrecord.setValue({
                        fieldId: 'custpage_helper',
                        value : ''
                    });
                }
                

            }
            if (context.fieldId == 'custpage_area') {
                var vrecord = context.currentRecord;
                console.log('change');
                var area = vrecord.getValue('custpage_area');
                console.log('area', area);
                
                if (area) {
                    var customrecord_rda_sub_areaSearchObj = search.create({
                        type: "customrecord_rda_sub_area",
                        filters: [
                            ["custrecord_rda_subarea_area", "anyof", area]
                        ],
                        columns: [
                            search.createColumn({name: "name", label: "Name"}),
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                    });
                    
                    var subAreaField = vrecord.getField({ fieldId: 'custpage_sub_area' });
            
                    var subAreaCount = subAreaField.getSelectOptions().length;
                    for (var i = subAreaCount - 1; i >= 0; i--) {
                        subAreaField.removeSelectOption({
                            value: subAreaField.getSelectOptions()[i].value
                        });
                    }
            
                    customrecord_rda_sub_areaSearchObj.run().each(function(result) {
                        var subAreaName = result.getValue({ name: "name" });
                        var subAreaId = result.getValue({ name: "internalid" });
            
                        subAreaField.insertSelectOption({
                            value: subAreaId,
                            text: subAreaName
                        });
            
                        return true;
                    });
                }
            }
            if (context.fieldId == 'custpage_subsidiary') {
                var vrecord = context.currentRecord;
                var subsidiary = vrecord.getValue('custpage_subsidiary');
                console.log('subsidiary', subsidiary);
                
                if (subsidiary) {
                    var customrecord_ncfar_assetSearchObj = search.create({
                        type: "customrecord_ncfar_asset",
                        filters:
                        [
                            ["custrecord_assetsubsidiary","anyof",subsidiary]
                        ],
                        columns:
                        [
                            search.createColumn({name: "custrecord_rda_nopol_", label: "NOPOL"}),
                            search.createColumn({name: "altname", label: "Name"})
                        ]
                    });
                    var searchResultCount = customrecord_ncfar_assetSearchObj.runPaged().count;
                    
                    var nopolField = vrecord.getField({ fieldId: 'custpage_nopol' });
                    if(nopolField){
                        var nopolCount = nopolField.getSelectOptions().length;
                        console.log('nopolCount', nopolCount)
                        for (var i = nopolCount - 1; i >= 0; i--) {
                            nopolField.removeSelectOption({
                                value: nopolField.getSelectOptions()[i].value
                            });
                        }
                    }
                     // Menambahkan opsi default "- Select -" di paling atas
                    nopolField.insertSelectOption({
                        value: '',
                        text: '- Select -'
                    });
                    customrecord_ncfar_assetSearchObj.run().each(function(result){
                        var nopol = result.getValue({
                            name: "custrecord_rda_nopol_"
                        });
                        if(nopol){
                            nopolField.insertSelectOption({
                                value: nopol,
                                text: nopol
                            });
                        }
                        
                        return true;
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
            var area = records.getValue('custpage_area');
            var subsidiary = records.getValue('custpage_subsidiary');
            var noDo = records.getValue('custpage_order_number');
            var customerId = records.getValue('custpage_customer');
            var accPeriodid = records.getValue('custpage_accperiod');
            var date = records.getValue('custpage_date');
            var subsId = records.getValue('custpage_subsidiary');
            var salesId = records.getValue('custpage_sales');
            if(subsidiary){
                var dataSearch = search.load({
                    id: "customsearch_rda_packing_list_shipped",
                });
                if(customerId){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "entity",
                        operator: search.Operator.ANYOF,
                        values: customerId,
                        })
                    );
                }
                console.log('noDo', noDo)
                if(noDo){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "createdfrom",
                        operator: search.Operator.ANYOF,
                        values: noDo,
                        })
                    );
                }
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
                if(area){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "custbody_rda_area",
                        operator: search.Operator.ANYOF,
                        values: area,
                        })
                    );
                }
                if(salesId){
                    dataSearch.filters.push(
                        search.createFilter({
                        name: "salesrep",
                        operator: search.Operator.ANYOF,
                        values: salesId,
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