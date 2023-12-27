 /**
     * @NApiVersion 2.1
     * @NScriptType UserEventScript
     * @NModuleScope SameAccount
     */
define(['N/ui/serverWidget', 'N/record', 'N/error', 'N/ui/message', 'N/search'], function(ui, record, error, message, search) {

    function beforeLoad(context) {
        if(context.type === context.UserEventType.VIEW){
            try{
                var form = context.form;
                var currentRecord = context.newRecord;
                var idRec = currentRecord.id;
                var cekBin = currentRecord.getValue("custbody_ajb_bin_transfer_no");
                var countItem = currentRecord.getLineCount({
                    sublistId : 'item'
                });
                var isBinnumber = [];
                var isusebins = false;
                if(countItem > 0){
                    for(var i = 0; i < countItem; i++){
                        var itemId = currentRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'item',
                            line : i
                        })
                        log.debug('itemid', itemId);
                        if(itemId){
                            var itemSearchObj = search.create({
                                type: "item",
                                filters:
                                [
                                    ["internalid","anyof",itemId]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "binnumber", label: "Bin Number"}),
                                    search.createColumn({name: "usebins", label: "Use Bins"})
                                ]
                            });
                            var searchResultCount = itemSearchObj.runPaged().count;
                            log.debug("itemSearchObj result count",searchResultCount);
                            itemSearchObj.run().each(function(result){
                                var binNumber = result.getValue({
                                    name : 'binnumber'
                                });
                                var usebins = result.getValue({
                                    name : 'usebins'
                                });
                                if(usebins == true){
                                    isusebins = usebins
                                }
                                log.debug('usebins', usebins);
                                if(binNumber || binNumber != ''){
                                    isBinnumber.push(binNumber);
                                }
                                return true;
                            });
                        }
                    }
                }
                log.debug('isusebins', isusebins);
                if(isusebins == true){
                    if(cekBin == ''){
                        form.addButton({
                            id: 'custpage_generatebin',
                            label: 'Bin Transfer',
                            functionName: 'onButtonClick('+ idRec + ')',
                        });
                    }
                }
                
                
                context.form.clientScriptModulePath = 'SuiteScripts/abj_cs_autogeneratebin.js';
            }catch (error) {
                log.error({
                    title: 'custpage_change_print_title',
                    details: error.message
                });
            }
        }
    } 
    return {
        beforeLoad: beforeLoad,
    }
    });
