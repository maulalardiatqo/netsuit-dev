/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/record', 'N/search', 'N/ui/message'], function(url, record, search, message) {
    function pageInit(context) {
    }
    function onButtonClick(idRec) {
        let MsgProcess = message.create({
            title: 'Process',
            message: 'Please wait, data will be loaded..',
            type: message.Type.INFORMATION
        });
    
        MsgProcess.show({
            duration: 5000
        });
    
        setTimeout(function () {
            processData(idRec);
        }, 100);
    }
    function processData(idRec){
        console.log('idRec', idRec);
        var recItem = record.load({
            type : 'itemreceipt',
            id : idRec,
            isDynamic: false, 
        });
        var location = recItem.getValue("location"); 
        var tranDate = recItem.getValue("trandate");
        var memo = recItem.getValue('memo');
        var recCreateBin = record.create({
            type: 'bintransfer',
            isDynamic: true
        });
        recCreateBin.setValue({
            fieldId: 'location',
            value: location, 
            ignoreFieldChange: true
        });
        recCreateBin.setValue({
            fieldId: 'trandate',
            value: tranDate, 
            ignoreFieldChange: true
        });
        recCreateBin.setValue({
            fieldId: 'memo',
            value: memo, 
            ignoreFieldChange: true
        });
        var itemCount = recItem.getLineCount({
            sublistId: 'item'
        });
        console.log('itemCount', itemCount);
        if(itemCount > 0){
            for (var index = 0; index < itemCount; index++){
                
                var item = recItem.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'item',
                    line : index
                });
                var bins = 0;
                // search master items
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                    [
                        ["internalid","anyof",item]
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
                    if(binNumber){
                        bins = binNumber
                    }
                    return true;
                });
                // end search master item
                var unit = recItem.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'units',
                    line : index
                })
                var qty = recItem.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : index
                })
                console.log('bins', bins);
                if(bins != 0){
                    recCreateBin.selectNewLine({
                        sublistId: "inventory",
                    });
                    recCreateBin.setCurrentSublistValue({
                        sublistId : 'inventory',
                        fieldId: 'item',
                        value: item,
                    });
                    console.log('rec1');
                    
                    recCreateBin.setCurrentSublistValue({
                        sublistId : 'inventory',
                        fieldId: 'units',
                        value: unit, 
                    });
                    recCreateBin.setCurrentSublistValue({
                        sublistId : 'inventory',
                        fieldId: 'quantity',
                        value: qty, 
                    });
    
                    var idInv = recItem.getSublistValue({
                        sublistId : 'item',
                        fieldId   : 'inventorydetail',
                        line: index
                    });
                    var inventorydetailSearchObj = search.create({
                        type: "inventorydetail",
                        filters:
                        [
                            ["internalid","anyof",idInv]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "inventorynumber",
                                sort: search.Sort.ASC,
                                label: " Number"
                            }),
                            search.createColumn({name: "binnumber", label: "Bin Number"}),
                            search.createColumn({name: "status", label: "Status"}),
                            search.createColumn({name: "quantity", label: "Quantity"}),
                            search.createColumn({name: "itemcount", label: "Item Count"}),
                            search.createColumn({name: "expirationdate", label: "Expiration Date"}),
                            search.createColumn({name: "item", label: "Item"}),
                        ]
                    });
                    var searchResultCount = inventorydetailSearchObj.runPaged().count;
                    log.debug("inventorydetailSearchObj result count",searchResultCount);
                    inventorydetailSearchObj.run().each(function(result){
                        var subrecInvtrDetailAdjst = recCreateBin.getCurrentSublistSubrecord({
                            sublistId: "inventory",
                            fieldId: "inventorydetail",
                        });
                        subrecInvtrDetailAdjst.selectNewLine({
                            sublistId: "inventoryassignment",
                        });
                        var lotNumber = result.getValue({
                            name : 'inventorynumber'
                        })
                        subrecInvtrDetailAdjst.setCurrentSublistValue({
                            sublistId : 'inventoryassignment',
                            fieldId: 'issueinventorynumber',
                            value: lotNumber, 
                        });
                        var itemBin = result.getValue({
                            name : 'item'
                        });
                        var tobins = "1"
                        console.log('itemBin', itemBin);
                        subrecInvtrDetailAdjst.setCurrentSublistValue({
                            sublistId : 'inventoryassignment',
                            fieldId: 'item',
                            value: itemBin, 
                        });
                        var binNumber = result.getValue({
                            name : 'binnumber'
                        });
                        console.log('binnumber', binNumber);
                        subrecInvtrDetailAdjst.setCurrentSublistValue({
                            sublistId : 'inventoryassignment',
                            fieldId: 'binnumber',
                            value: binNumber, 
                        });
                        
                        subrecInvtrDetailAdjst.setCurrentSublistValue({
                            sublistId : 'inventoryassignment',
                            fieldId: 'tobinnumber',
                            value: tobins, 
                        });                    
                        console.log('tobins', tobins);
                        var qtyBins = result.getValue({
                            name : 'quantity'
                        });
                        subrecInvtrDetailAdjst.setCurrentSublistValue({
                            sublistId : 'inventoryassignment',
                            fieldId: 'quantity',
                            value: qtyBins, 
                        });
                        console.log('qtyBins', qtyBins)
                        var statusInv = result.getValue({
                            name: "status"
                        })
                        subrecInvtrDetailAdjst.setCurrentSublistValue({
                            sublistId : 'inventoryassignment',
                            fieldId: 'inventorystatus',
                            value: statusInv, 
                        });
                        console.log('statusInv', statusInv)
                        subrecInvtrDetailAdjst.setCurrentSublistValue({
                            sublistId : 'inventoryassignment',
                            fieldId: 'toinventorystatus',
                            value: 1, 
                        });
                        subrecInvtrDetailAdjst.commitLine({
                            sublistId: "inventoryassignment",
                        });
                        return true;
                    });
                    recCreateBin.commitLine("inventory")
                }
                
            }
        }
        var saveBins = recCreateBin.save({
            enableSourcing: true,
            ignoreMandatoryFields: true,
        });
        console.log('savebins', saveBins);
        if(saveBins){
            recItem.setValue({
                fieldId : 'custbody_ajb_bin_transfer_no',
                value : saveBins,
                ignoreFieldChange : true
            })
            recItem.save();
            console.log('saveBins',saveBins)
            var suiteletUrl = 'https://9274135.app.netsuite.com/app/accounting/transactions/bintrnfr.nl?'
            console.log('suiteurl', suiteletUrl);
            window.location.href = suiteletUrl + "&id=" + saveBins+"&e=T";
        }
    }
    return {
    pageInit:pageInit,
    onButtonClick: onButtonClick,
    processData : processData
    };
});