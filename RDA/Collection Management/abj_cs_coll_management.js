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
        function getAllChildSubsidiariesWithNames(allSubs, subsidiaryId) {
            let result = [];
        
            subsidiaryId = String(subsidiaryId);
        
            function findChildren(parentId) {
                console.log('Checking children of', parentId);
                let children = allSubs.filter(sub => sub.parent === parentId);
                console.log('Found children:', children);
        
                children.forEach(child => {
                    result.push({
                        internalId: child.internalId,
                        nameSubs: child.nameSubs
                    });
                    findChildren(child.internalId); 
                });
            }
        
            let initialSubsidiary = allSubs.find(sub => sub.internalId === subsidiaryId);
            if (initialSubsidiary) {
                result.push({
                    internalId: initialSubsidiary.internalId,
                    nameSubs: initialSubsidiary.nameSubs
                });
                findChildren(subsidiaryId); 
            } else {
                console.log('Initial subsidiary not found', subsidiaryId);
            }
        
            return result;
        }
        function pageInit(context) {
            var vrecord = context.currentRecord;
            let currentUser = runtime.getCurrentUser();
            let subsidiaryId = currentUser.subsidiary;
            log.debug('subsidiaryId',subsidiaryId)
            if (subsidiaryId) {
                var subsidiaryFIeld = vrecord.getField({ fieldId: 'custpage_subsidiary' });
                var kolektorField = vrecord.getField({ fieldId: 'custpage_kolektor' });
                var allSubs = []
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters:
                    [
                    ],
                    columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "name", label: "Name"}),
                        search.createColumn({name: "parent", label: "Parent Subsidiary"})
                    ]
                });
                var searchResultCount = subsidiarySearchObj.runPaged().count;
                console.log("subsidiarySearchObj result count",searchResultCount);
                subsidiarySearchObj.run().each(function(result){
                    var internalId = result.getValue({name: "internalid"});
                    var parent = result.getValue({name: "parent"});
                    var nameSubs = result.getValue({name: "name"});
                    allSubs.push({
                        internalId : internalId,
                        parent : parent,
                        nameSubs : nameSubs
                    })
                    return true;
                });
                console.log('allSubs', allSubs)
                var childSubs = getAllChildSubsidiariesWithNames(allSubs, subsidiaryId);
                console.log('childSubs', childSubs)
                if(childSubs){
                    childSubs.forEach(function(subsidiary) {
                        // Mengambil internalId dan nameSubs dari tiap subsidiary
                        var internalId = subsidiary.internalId;
                        var nameSubs = subsidiary.nameSubs;
                        subsidiaryFIeld.insertSelectOption({
                            value: internalId,
                            text: nameSubs
                        });
                    })
                }
                var allSales = []
                var employeeSearchObj = search.create({
                    type: "employee",
                    filters:
                    [
                        ["salesrep","is","T"], 
                        "AND", 
                        ["subsidiary","anyof",subsidiaryId]
                    ],
                    columns:
                    [
                        search.createColumn({name: "entityid", label: "ID"}),
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "firstname", label: "First Name"}),
                        search.createColumn({name: "middlename", label: "Middle Name"}),
                        search.createColumn({name: "lastname", label: "Last Name"}),
                        search.createColumn({name: "subsidiary", label: "Subsidiary"})
                    ]
                    });
                    var searchResultCount = employeeSearchObj.runPaged().count;
                    log.debug("employeeSearchObj result count",searchResultCount);
                    employeeSearchObj.run().each(function(empData){
                        var idEmp = empData.getValue({
                            name: "internalid"
                        })
                        var fName = empData.getValue({
                            name: "firstname"
                        })
                        var mName = empData.getValue({
                            name: "middlename"
                        })
                        var lName = empData.getValue({
                            name: "lastname"
                        })
                        var empName = fName + ' ' + mName + ' ' + lName
                        kolektorField.insertSelectOption({
                            value : idEmp,
                            text : empName
                        })
                        return true;
                    });
            }
            console.log("masuk client");
        }
        window.onCustomButtonClick = function(context) {
            searchFilter(context)
        }
        function fieldChanged(context) {
            if(context.fieldId == 'custpage_subsidiary'){
                var cekSub = records.getValue('custpage_subsidiary');
                if(cekSub){
                    var kolektorField = records.getField({ fieldId: 'custpage_kolektor' })
                    var kolektorFieldCount = kolektorField.getSelectOptions().length;
                    for (var i = kolektorFieldCount - 1; i >= 0; i--) {
                        kolektorField.removeSelectOption({
                            value: kolektorField.getSelectOptions()[i].value
                        });
                    }
                    var employeeSearchObj = search.create({
                        type: "employee",
                        filters:
                        [
                            ["salesrep","is","T"], 
                            "AND", 
                            ["subsidiary","anyof",cekSub]
                        ],
                        columns:
                        [
                            search.createColumn({name: "entityid", label: "ID"}),
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "firstname", label: "First Name"}),
                            search.createColumn({name: "middlename", label: "Middle Name"}),
                            search.createColumn({name: "lastname", label: "Last Name"}),
                            search.createColumn({name: "subsidiary", label: "Subsidiary"})
                        ]
                        });
                        var searchResultCount = employeeSearchObj.runPaged().count;
                        log.debug("employeeSearchObj result count",searchResultCount);
                        employeeSearchObj.run().each(function(empData){
                            var idEmp = empData.getValue({
                                name: "internalid"
                            })
                            var fName = empData.getValue({
                                name: "firstname"
                            })
                            var mName = empData.getValue({
                                name: "middlename"
                            })
                            var lName = empData.getValue({
                                name: "lastname"
                            })
                            var empName = fName + ' ' + mName + ' ' + lName
                            kolektorField.insertSelectOption({
                                value : idEmp,
                                text : empName
                            })
                            return true;
                        });
                }

            }
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
            var subsidiary = records.getValue('custpage_subsidiary');
          
            var dateTo = records.getValue('custpage_date_to');
            var sales = records.getValue('custpage_sales');

            if(subsidiary){
                
                    var dataSearch = search.load({
                        id: "customsearch_rda_collection_management",
                    });
                    var cekDateFrom = "1/1/1999"
                   
                    
                    var cekDateTo
                    if(dateTo){
                        cekDateTo = convertDate(dateTo)
                    } 
                    if (cekDateFrom && cekDateTo) {
                        console.log('cekDateFrom', cekDateFrom)
                        dataSearch.filters.push(
                            search.createFilter({
                                name: "duedate",
                                operator: search.Operator.WITHIN,
                                values: [cekDateFrom, cekDateTo]
                            })
                        );
                    }
                    
                    
                    if(subsidiary){
                        dataSearch.filters.push(
                            search.createFilter({
                            name: "subsidiary",
                            operator: search.Operator.ANYOF,
                            values: subsidiary,
                            })
                        );
                    }
                    if(sales){
                        dataSearch.filters.push(
                            search.createFilter({
                            name: "salesrep",
                            operator: search.Operator.ANYOF,
                            values: sales,
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
                            var customerId = dataSearch[i].getValue({
                                name: dateSearchSet.columns[1],
                            });
                            var customerText = dataSearch[i].getText({
                                name: dateSearchSet.columns[1],
                            });
                            var dueDate = dataSearch[i].getValue({
                                name: dateSearchSet.columns[2],
                            });
                            var invAmt = dataSearch[i].getValue({
                                name: dateSearchSet.columns[3],
                            });
                            var amtDue = dataSearch[i].getValue({
                                name: dateSearchSet.columns[4],
                            });
                            var salesRepId = dataSearch[i].getValue({
                                name: dateSearchSet.columns[5],
                            });
                            var salesRepText = dataSearch[i].getText({
                                name: dateSearchSet.columns[5],
                            });
                            var subsidiaryId = dataSearch[i].getValue({
                                name: dateSearchSet.columns[6],
                            });
                            var subsidiaryText = dataSearch[i].getText({
                                name: dateSearchSet.columns[6],
                            });
                            var aplyingTrans = dataSearch[i].getValue({
                                name: dateSearchSet.columns[7],
                            });
                            var aplyingLinkAmt = dataSearch[i].getValue({
                                name: dateSearchSet.columns[8],
                            });
                            var currency = dataSearch[i].getText({
                                name: dateSearchSet.columns[9],
                            });
                            var currencyId = dataSearch[i].getValue({
                                name: dateSearchSet.columns[9],
                            });
                            var excRate = dataSearch[i].getValue({
                                name: dateSearchSet.columns[10],
                            });
                            var division = dataSearch[i].getValue({
                                name: dateSearchSet.columns[11],
                            });
                            var idInv = dataSearch[i].getValue({
                                name: dateSearchSet.columns[12],
                            });
                            var reason = dataSearch[i].getValue({
                                name: dateSearchSet.columns[13],
                            });
                            var actionPlan = dataSearch[i].getValue({
                                name: dateSearchSet.columns[14],
                            })
                            allData.push({
                                doNumber : doNumber,
                                customerId : customerId,
                                customerText : customerText,
                                dueDate : dueDate,
                                invAmt : invAmt,
                                amtDue : amtDue,
                                salesRepId : salesRepId,
                                salesRepText : salesRepText,
                                subsidiaryId : subsidiaryId,
                                subsidiaryText : subsidiaryText,
                                aplyingTrans : aplyingTrans,
                                aplyingLinkAmt : aplyingLinkAmt,
                                currency : currency,
                                excRate : excRate,
                                division : division,
                                idInv : idInv,
                                currencyId : currencyId,
                                reason : reason,
                                actionPlan : actionPlan
                            })
                        }
                        console.log('allData', allData)
                        allData.forEach(function(data) {
                            var doNumber = data.doNumber
                            var customerText = data.customerText
                            var customerId = data.customerId
                            var dueDate = data.dueDate
                            var invAmt = data.invAmt
                            var amtDue = data.amtDue
                            var salesRepId = data.salesRepId
                            var salesRepText = data.salesRepText
                            var subsidiaryId = data.subsidiaryId
                            var subsidiaryText = data.subsidiaryText
                            var aplyingTrans = data.aplyingTrans
                            var aplyingLinkAmt = data.aplyingLinkAmt
                            var currency = data.currency
                            var excRate = data.excRate
                            var idInv = data.idInv
                            var division = data.division
                            var currencyId = data.currencyId
                            var reason = data.reason
                            var actionPlan = data.actionPlan
                        
                            records.selectNewLine({ sublistId: 'custpage_sublist' });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_item_select',
                                value: false
                            })
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_date',
                                value: dueDate
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_type',
                                value: 'Invoice'
                            });
                            console.log('customerText', customerText)
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_vendor',
                                value: customerText
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_vendor_id',
                                value: customerId
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_refno',
                                value: ''
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_currency',
                                value: currency
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_currency_id',
                                value: currencyId
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_exc_rate',
                                value: excRate
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_org_amt',
                                value: invAmt
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_amt_due',
                                value: amtDue
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_retur',
                                value: ''
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_sales',
                                value: salesRepText || ''
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_sales_id',
                                value: salesRepId || ''
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_subsidiary',
                                value: subsidiaryText
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_subsidiary_id',
                                value: subsidiaryId
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_id_inv',
                                value: idInv
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_refno',
                                value: doNumber
                            });
                            records.setCurrentSublistValue({
                                sublistId: 'custpage_sublist', 
                                fieldId: 'custpage_sublist_division',
                                value: division
                            });
                            if(reason){
                                records.setCurrentSublistValue({
                                    sublistId: 'custpage_sublist', 
                                    fieldId: 'custpage_sublist_reason',
                                    value: reason
                                });
                            }
                            if(actionPlan && actionPlan != "- None -"){
                                console.log('actionPlan',actionPlan)
                                records.setCurrentSublistValue({
                                    sublistId: 'custpage_sublist', 
                                    fieldId: 'custpage_sublist_action',
                                    value: actionPlan
                                });
                            }
                            records.commitLine({ sublistId: 'custpage_sublist' });
    
                            
                        });
                    }else{
                        alert("No Data Found!")
                        
                    }   
                
               
            }else{
                alert("Please fill in Subsidiary fields");
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
            markAll : markAll,
            unmarkAll : unmarkAll,
            searchFilter : searchFilter,
            fieldChanged : fieldChanged
        };
    }
); 
