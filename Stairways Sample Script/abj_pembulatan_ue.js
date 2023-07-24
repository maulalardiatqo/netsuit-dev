/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
  ) {
    function pembulatan(angka) {
        if (angka >= 0) {
            var bulat = Math.floor(angka);
            var desimal = angka - bulat;

            if (desimal >= 0.5) {
                return Math.ceil(angka);
            } else {
                return Math.floor(angka);
            }
        } else {
            return Math.ceil(angka);
        }
    }
    function pembulatanSeratus(angka) {
        var roundedValue = Math.ceil(angka / 100) * 100;
        return roundedValue;
    }
        function afterSubmit(context) {
        try {

            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) {
                var rec = context.newRecord;
                log.debug('itemRecid', rec.id)
                var itemrec = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true
                });
                var countLine = itemrec.getLineCount({ sublistId: 'price5' });
                log.debug('countLine', countLine);
                for (var i = 0; i < countLine; i++) {
                    log.debug('i', i)
                    var price_1 = itemrec.getSublistValue({ sublistId: 'price5', fieldId: 'price_1_', line: i });
                    var price_2 = itemrec.getSublistValue({ sublistId: 'price5', fieldId: 'price_2_', line: i });
                    var price_3 = itemrec.getSublistValue({ sublistId: 'price5', fieldId: 'price_3_', line: i });
                    var price_4 = itemrec.getSublistValue({ sublistId: 'price5', fieldId: 'price_4_', line: i });

                    var rounded1 = pembulatan(parseFloat(price_1));
                    var rounded2 = pembulatan(parseFloat(price_2));
                    var rounded3 = pembulatan(parseFloat(price_3));
                    var rounded4 = pembulatan(parseFloat(price_4));
            
                    var roundedPrice_1 = pembulatanSeratus(rounded1)
                    var roundedPrice_2 = pembulatanSeratus(rounded2)
                    var roundedPrice_3 = pembulatanSeratus(rounded3)
                    var roundedPrice_4 = pembulatanSeratus(rounded4)

                    log.debug('data',{i:i, roundedPrice_1:roundedPrice_1, roundedPrice_2:roundedPrice_2, roundedPrice_3:roundedPrice_3, roundedPrice_4:roundedPrice_4});

                    itemrec.setCurrentSublistValue({
                        sublistId: 'price5',
                        fieldId: 'price_1_', 
                        line: i,
                        value: roundedPrice_1,
                        ignoreFieldChange: true
                    });
                    itemrec.setCurrentSublistValue({
                        sublistId: 'price5',
                        fieldId: 'price_2_', 
                        line: i,
                        value: roundedPrice_2,
                        ignoreFieldChange: true
                    });
                    itemrec.setCurrentSublistValue({
                        sublistId: 'price5',
                        fieldId: 'price_3_', 
                        line: i,
                        value: roundedPrice_3,
                        ignoreFieldChange: true
                    });
                    itemrec.setCurrentSublistValue({
                        sublistId: 'price5',
                        fieldId: 'price_4_', 
                        line: i,
                        value: roundedPrice_4,
                        ignoreFieldChange: true
                    });
                    
                }
                var recordId = itemrec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('recordId', recordId);
            }
        }catch(e){
            log.error({
                title: 'Error Processing Record',
                details: e
            });
    }

}   
return {
     afterSubmit: afterSubmit,
    };
});