/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log", "N/ui/message"],
 function(error,dialog,url,record,currentRecord,log, message) {
 var records = currentRecord.get();
    function pageInit(context) {
        console.log("test in");
    }
    function reopen(recId) {
        var processMsg = message.create({
            title: "Processing",
            message: "On Process. Please wait...",
            type: message.Type.INFORMATION
        });
        processMsg.show();

        setTimeout(function () {
            try {
                processTransaction(recId);
            } catch (e) {
                processMsg.hide(); 
                log.error("Error", e);
                dialog.alert({
                    title: "Error",
                    message: e.message
                });
            }
        }, 500); 
    }
    function processTransaction(recId) {
       try {
            var recSO = record.load({
                type: record.Type.SALES_ORDER,
                id: recId,
                isDynamic: true
            });

            var lineCount = recSO.getLineCount({ sublistId: 'item' });
            var status = recSO.getValue({ fieldId: 'status' });
            console.log('Current Status:', status);
            
            var allFulfillZero = true;
            var allFulfillEqualOrder = true;
            var allBilledZero = true;
            var allBilledPartial = false;
            var someFulfillPartial = false;

            for (var i = 0; i < lineCount; i++) {
                var qtyOrder = parseFloat(recSO.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })) || 0;
                var qtyFulfill = parseFloat(recSO.getSublistValue({ sublistId: 'item', fieldId: 'quantityfulfilled', line: i })) || 0;
                var qtyBilled = parseFloat(recSO.getSublistValue({ sublistId: 'item', fieldId: 'quantitybilled', line: i })) || 0;

                console.log(`Line ${i} - Order: ${qtyOrder}, Fulfilled: ${qtyFulfill}, Billed: ${qtyBilled}`);

                // Uncentang Closed field di line item
                recSO.selectLine({ sublistId: 'item', line: i });
                recSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed', value: false });
                recSO.commitLine({ sublistId: 'item' });

                // Cek kondisi
                if (qtyFulfill !== 0) allFulfillZero = false;
                if (qtyFulfill !== qtyOrder) allFulfillEqualOrder = false;
                if (qtyBilled !== 0) allBilledZero = false;
                if (qtyBilled > 0 && qtyBilled < qtyOrder) allBilledPartial = true;
                if (qtyFulfill > 0 && qtyFulfill < qtyOrder) someFulfillPartial = true;
            }
            var newStatus = 'Pending Fulfillment';

            if (allFulfillZero && allBilledZero) {
                newStatus = 'Pending Fulfillment';
            } 
            else if (someFulfillPartial && allBilledZero) {
                newStatus = 'Partially Fulfilled';
            } 
            else if (someFulfillPartial && allBilledPartial) {
                newStatus = 'Partially Fulfilled/Partially Billed';
            }
            else if (allFulfillEqualOrder && allBilledZero) {
                newStatus = 'Pending Billing';
            } 
            else if (allFulfillEqualOrder && allBilledPartial) {
                newStatus = 'Partially Billed';
            }

            // Update custom status field jika ada
            if (recSO.getField({ fieldId: 'status' })) {
                console.log('newStatus', newStatus)
                recSO.setValue({
                    fieldId: 'status',
                    value: newStatus
                });
            }
            var cekStatus = recSO.getValue({ fieldId: 'status' });
            recSO.save();

            dialog.alert({
                title: 'Reopen Success',
                message: 'Sales Order berhasil di-ReOpen ke status: ' + newStatus
            }).then(function() {
                location.reload();
            });

        } catch (e) {
            console.error(e);
            dialog.alert({
                title: 'Error',
                message: e.message
            }).then(function(){
                location.reload();
            })
        }
    } 
    return {
        pageInit : pageInit,
        reopen: reopen
    };
}); 
 