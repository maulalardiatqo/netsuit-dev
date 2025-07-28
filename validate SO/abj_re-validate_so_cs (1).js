/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/format", "N/currentRecord", "N/ui/dialog", "N/ui/message"], function (
    record,
    search,
    format,
    currentRecord,
    dialog,
    message
) {

    var records = currentRecord.get();

    function pageInit(context) {
            console.log('init')
        }
function onValidateClick(idSO) {
    // Tampilkan pesan loading
    let MsgProcess = message.create({
        title: 'Process',
        message: 'Please wait, checking inventory stock...',
        type: message.Type.INFORMATION
    });

    MsgProcess.show();

    setTimeout(function () {
        runValidation(idSO, MsgProcess);
    }, 300);
}

function runValidation(idSO, MsgProcess) {
    var soRec = record.load({
        type: 'salesorder',
        id: idSO
    });

    var validate = true;
    var orderStatus = soRec.getValue('orderstatus');
    var locationSo = soRec.getValue('location');

    var cekLineCount = soRec.getLineCount('item');

    var itemsNotEnough = [];
    var itemIds = [];

    for (var i = 0; i < cekLineCount; i++) {
        var item = soRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i
        });
        if (item && itemIds.indexOf(item) === -1) {
            itemIds.push(item);
        }
    }

    var itemQtyMap = {};
    if (itemIds.length > 0 && locationSo) {
        var itemSearchObj = search.create({
            type: "item",
            filters: [
                ["internalid", "anyof", itemIds],
                "AND",
                ["inventorylocation", "anyof", locationSo]
            ],
            columns: [
                search.createColumn({ name: "internalid" }),
                search.createColumn({ name: "locationquantityonhand" })
            ]
        });

        var searchResults = itemSearchObj.run().getRange({ start: 0, end: 1000 });
        searchResults.forEach(function (result) {
            var id = result.getValue({ name: "internalid" });
            var qty = result.getValue({ name: "locationquantityonhand" }) || 0;
            itemQtyMap[id] = parseFloat(qty);
        });
    }

    for (var i = 0; i < cekLineCount; i++) {
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
        var unitRate = parseFloat(soRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'unitconversionrate',
            line: i
        })) || 1;

        var qty = parseFloat(soRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: i
        })) || 0;

        var quantityOnHand = (itemQtyMap[item] || 0) * unitRate;


        if (qty > 0 && quantityOnHand > 0) {
            if (qty > quantityOnHand) {
                validate = false;
                itemsNotEnough.push(itemText);
            }
        } else {
            console.log('tidak perlu pengecekan');
        }
    }

    console.log('validate', validate);
    MsgProcess.hide();

    if (!validate) {
        dialog.alert({
            title: 'Warning',
            message: 'Stock is not enough in Good Stock. Please re-check your stock availability. The following items are not enough: ' + itemsNotEnough.join(', '),
        });
    } else {
        if (orderStatus === 'A') {
            console.log('status A');
            soRec.setValue({
                fieldId: 'orderstatus',
                value: 'B'
            });
            soRec.setValue({
                fieldId: 'custbody_rda_so_approved',
                value: true
            });
            soRec.save({
                enableSourcing: true,
            });
            alert('Update status to Pending Fulfillment');
            location.reload();
        }

        if (orderStatus === 'B') {
            console.log('status B');
            soRec.setValue({
                fieldId: 'custbody_rda_so_approved',
                value: true
            });
            soRec.save({
                enableSourcing: true,
            });
            location.reload();
        }
    }
}


    // function onValidateClick(idSO) {
    //     dialog.alert({
    //         title: 'Please Wait',
    //         message: 'Checking inventory stock, please wait...',
    //     });
    
    // }


    return {
        pageInit: pageInit,
        onValidateClick: onValidateClick
    };
});