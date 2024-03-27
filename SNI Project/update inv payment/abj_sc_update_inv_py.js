/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/file', 'N/format'],
  function(search, record, email, runtime, file, format) {
    
    function execute(scriptContext) {
        try {
            var fileId = '89564'
            var fileObj = file.load({ id: fileId });
            var fileContent = fileObj.getContents();

            var lines = fileContent.split('\n');
            var columnNames = lines[0].split(',');

            var data = [];
            for (var i = 1; i < lines.length; i++) {
                var rowData = lines[i].split(',');
                var rowObject = {};
                for (var j = 0; j < columnNames.length; j++) {
                    rowObject[columnNames[j]] = rowData[j]
                }
                data.push(rowObject);
            }
            for (var i = 0; i < data.length; i++) {
                var rowData = data[i];
                var invId = rowData.invid;
                var amount = rowData.debit;
                if (invId) {
                    var recInv = record.load({
                        type: 'invoice',
                        id: invId,
                        isDynamic: true
                    });
                    var discRate = recInv.getValue('discountrate');
                    if(discRate){
                        var discRateValue = parseFloat(discRate);
                        var absDiscRateValue = Math.abs(discRateValue);
                        var positiveDiscRate = absDiscRateValue;
                    }
                
                    amount = Number(amount).toFixed(2);
                    var totalAmount = recInv.getValue('total');
                    totalAmount = Number(totalAmount).toFixed(2)
                    var diff = Number(amount) - Number(totalAmount);
                    if(discRate){
                        var prosent = Number(diff) * Number(positiveDiscRate / 100)
                        var difSet = Number(diff) + Number(prosent)
                        diff = difSet.toFixed(2);
                    }else{
                        diff = diff.toFixed(2);
                    }
                    recInv.selectNewLine({
                        sublistId: "item",
                    });
                    recInv.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: 51857,
                    });
                    recInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        value: '-1'
                    });
                    recInv.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: 1,
                    });
                    recInv.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "taxcode",
                        value: 17920,
                    });
                    recInv.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "amount",
                        value: diff,
                    });
                    recInv.commitLine({ sublistId: 'item' });
                    var saveInv = recInv.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveInv', saveInv)
                }
                var pyId = rowData.pyid;
                if(pyId){
                    var recPy = record.load({
                        type: 'customerpayment',
                        id: pyId,
                        isDynamic : false
                    });
                    var pyAmount = recPy.getValue('payment');
                    var diffPyam = Number(amount) - Number(pyAmount)
                    var newPyAmt = Number(pyAmount) + Number(diffPyam);

                    recPy.setValue({
                        fieldId : 'payment',
                        value: newPyAmt,
                        ignoreFieldChange: true
                    });
                    recPy.setValue({
                        fieldId : 'origtotal',
                        value: newPyAmt,
                        ignoreFieldChange: false
                    });
                    var findLineInv = recPy.findSublistLineWithValue({
                        sublistId : 'apply',
                        fieldId : 'internalid',
                        value : invId
                    })
                    var amountPy = recPy.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'amount',
                        line: findLineInv
                    });
                    var diffPy = Number(amount) - Number(amountPy);
                    var newAmount = Number(amountPy) + Number(diffPy);

                    recPy.setSublistValue({
                        sublistId: 'apply',
                        fieldId: 'amount',
                        line: findLineInv,
                        value: newAmount,
                    });

                    var savePy = recPy.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('savePy', savePy)

                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        execute: execute
    };
});
