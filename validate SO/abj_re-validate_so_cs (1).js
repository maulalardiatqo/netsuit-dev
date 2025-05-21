/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/format", "N/currentRecord", "N/ui/dialog"], function (
    record,
    search,
    format,
    currentRecord,
    dialog
) {

    var records = currentRecord.get();

    function pageInit(context) {
        console.log('init')
    }

    function onValidateClick(idSO) {
        var soRec = record.load({
            type: 'salesorder',
            id: idSO
        });
        var validate = true
        var orderStatus = soRec.getValue('orderstatus')
        var locationSo = soRec.getValue('location');
        console.log('locationSo', locationSo)
        console.log('orderStatus', orderStatus)
        var cekLineCount = soRec.getLineCount('item')
        console.log('cekLineCount', cekLineCount)
        var itemsNotEnough = [];
        if (cekLineCount > 0) {
            for (var i = 0; i < cekLineCount; i++) {
                console.log('i', i)
                var item = soRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                var itemText = soRec.getSublistText({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                var unitRate = soRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'unitconversionrate',
                    line: i
                });
                var itemSearchObj = search.create({
                type: "item",
                filters: [
                    ["internalid","anyof",item], 
                    "AND", 
                    ["inventorylocation","anyof",locationSo]
                ],
                columns: [
                    search.createColumn({name: "itemid", label: "Name"}),
                    search.createColumn({name: "displayname", label: "Display Name"}),
                    search.createColumn({name: "quantityonhand", label: "On Hand"}),
                    search.createColumn({name: "inventorylocation", label: "Inventory Location"}),
                    search.createColumn({name: "locationquantityonhand", label: "Location On Hand"})
                ]
                });
                
                var searchResults = itemSearchObj.run().getRange({ start: 0, end: 1 });
                
                var quantityOnHand = 0;
                if (searchResults.length > 0) {
                    quantityOnHand = searchResults[0].getValue({ name: "locationquantityonhand" }) * Number(unitRate);
                }
                var qty = soRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });
                console.log('data Banding', {quantityOnHand : quantityOnHand, qty :qty});
                if(Number(qty) > 0 && Number(quantityOnHand) > 0){
                    console.log('perlu pengecekan')
                    if(Number(qty) > Number(quantityOnHand)){
                        console.log('ada item dengan qty lebih besar');
                        validate = false;
                        itemsNotEnough.push(itemText)
                    }
                }else{
                    console.log('tidak perlu pengecekan')
                }
                
            }
        }
        console.log('validate', validate)
        if(!validate){
            dialog.alert({
                title: 'Warning',
                message: 'Stock is not enough in Good Stock. Please re-check your stock availability. The following items are not enough: ' + itemsNotEnough.join(', '),
            })
            
        }else{
            if(orderStatus === 'A'){
                console.log('status A')
                
                soRec.setValue({
                    fieldId: 'orderstatus',
                    value: 'B'
                })
                soRec.setValue({
                    fieldId: 'custbody_rda_so_approved',
                    value: true
                })
                
                
                soRec.save({
                    enableSourcing: true,
                })
                
                alert('Update status to Pending Fulfillment')
                location.reload()
            }
            if(orderStatus === 'B'){
                console.log('status B')
                soRec.setValue({
                    fieldId: 'custbody_rda_so_approved',
                    value: true
                })
                soRec.save({
                    enableSourcing: true,
                })
                // alert('Update inventory')
                location.reload()
            }
        }
        
        
        // var saveSO = soTest.save()
        // log.debug('saveSO', saveSO)
    }

    return {
        pageInit: pageInit,
        onValidateClick: onValidateClick
    };
});