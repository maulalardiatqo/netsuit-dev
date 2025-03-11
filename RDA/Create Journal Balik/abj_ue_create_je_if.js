/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/config", ], function (record, search, config) {
    function afterSubmit(context){
        log.debug('triggerred')
        log.debug('context.type', context.type)
        if(context.type == 'ship'){
            try{
                var dataRec = context.newRecord;
                var cekStatus = dataRec.getValue("status");
                var cekLinkJournal = dataRec.getValue("custbody_rda_journal_free_goods");
                log.debug('cekStatus', cekStatus);
                log.debug('cekLinkJournal', cekLinkJournal);
                var idRec = dataRec.id 
                if(cekStatus == "Shipped" && cekLinkJournal == ""){
                    var companyConfig = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    var freeGoodsAccount = companyConfig.getValue({
                        fieldId: 'custrecord_rda_free_goods_account'
                    });
                    log.debug('freeGoodsAccount', freeGoodsAccount)
                    var subsidiary = dataRec.getValue('subsidiary');
                    var tranDate = dataRec.getValue('trandate');
                    var allDataExecute = [];
                    var itemfulfillmentSearchObj = search.create({
                        type: "itemfulfillment",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                        filters:
                        [
                            ["type","anyof","ItemShip"], 
                            "AND", 
                            ["mainline","is","F"], 
                            "AND", 
                            ["internalid","anyof",idRec], 
                            "AND", 
                            ["custcol_rda_product_sales_type","is","F"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "item", label: "Item"}),
                            search.createColumn({name: "custcol_rda_product_sales_type", label: "RDA -Product Sales Type"}),
                            search.createColumn({name: "cogsamount", label: "COGS Amount"}),
                            search.createColumn({
                                name: "displayname",
                                join: "item",
                                label: "Display Name"
                            }),
                            search.createColumn({name: "department", label: "Department"}),
                            search.createColumn({name: "location", label: "Location"}),
                            search.createColumn({name: "class",}),
                            search.createColumn({
                                name: "expenseaccount",
                                join: "item",
                                label: "Expense/COGS Account"
                            })
                        ]
                    });
                    var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
                    log.debug("itemfulfillmentSearchObj result count",searchResultCount);
                    itemfulfillmentSearchObj.run().each(function(result){
                        var item = result.getValue({name: "item"});
                        var cogsamount = result.getValue({name: "cogsamount"});
                        var itemName = result.getValue({
                            name: "displayname",
                            join: "item",
                        });
                        var department = result.getValue({name: "department"});
                        var location = result.getValue({name : "location"});
                        var classId = result.getValue({name: "class",})
                        var accountItem = result.getValue({
                            name: "expenseaccount",
                            join: "item",
                        })
                        allDataExecute.push({
                            item: item,
                            cogsamount: cogsamount,
                            itemName : itemName,
                            department : department,
                            location : location,
                            classId : classId,
                            accountItem : accountItem
                        })
                        return true;
                    });
                    log.debug('allDataExecute.length', allDataExecute.length)
                    log.debug('allDataExecute', allDataExecute)
                    if(allDataExecute.length > 0){
                        log.debug('ada data')
                        var createJE = record.create({
                            type: "journalentry",
                            isDynamic: true
                        });
                        createJE.setValue({
                            fieldId: 'subsidiary',
                            value: subsidiary
                        });
                        createJE.setValue({
                            fieldId: 'memo',
                            value: 'Journal pembalik COGS'
                        });
                        createJE.setValue({
                            fieldId: 'trandate',
                            value: tranDate
                        });
                        createJE.setValue({
                            fieldId: 'custbody_rda_journal_free_goods',
                            value : idRec
                        })
                        allDataExecute.forEach(function(data) {
                            var item = data.item
                            var cogsamount = data.cogsamount
                            var displayname = data.itemName
                            log.debug('displayname', displayname)
                            var department = data.department
                            var classId = data.classId
                            var location = data.location
                            var accountItem = data.accountItem

                            createJE.selectNewLine({ sublistId: 'line' });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: freeGoodsAccount
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'debit',
                                value: cogsamount
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'memo',
                                value: displayname
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'class',
                                value: classId
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'department',
                                value: department
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'location',
                                value: location
                            });
                            createJE.commitLine({ sublistId: 'line' });

                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: accountItem
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                value: cogsamount
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'memo',
                                value: displayname
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'class',
                                value: classId
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'department',
                                value: department
                            });
                            createJE.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'location',
                                value: location
                            });
                            createJE.commitLine({ sublistId: 'line' });
                        })
                        var jeId = createJE.save();
                        log.debug('Journal Entry Created', 'ID: ' + jeId);
                        if(jeId){
                            record.submitFields({
                                type: "itemfulfillment",
                                id: idRec,
                                values: {
                                    custbody_rda_journal_free_goods: jeId
                                }
                            });
                        }
                        
                       
                    }
                }
                
            }catch(e){
                log.debug('error', e)
            }
            
        }
    }
    return {
        afterSubmit : afterSubmit
    };
});