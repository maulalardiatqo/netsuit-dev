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
				let Itemsublistid = 'price5';	
                var countLine = itemrec.getLineCount({ sublistId: Itemsublistid });
                log.debug('countLine', countLine);
                for (var i = 0; i < countLine; i++) {
                    log.debug('i', i)
                    var price_1 = itemrec.getSublistValue({ sublistId: Itemsublistid, fieldId: 'price_1_', line: i });
                    var price_2 = itemrec.getSublistValue({ sublistId: Itemsublistid, fieldId: 'price_2_', line: i });
                    var price_3 = itemrec.getSublistValue({ sublistId: Itemsublistid, fieldId: 'price_3_', line: i });
                    var price_4 = itemrec.getSublistValue({ sublistId: Itemsublistid, fieldId: 'price_4_', line: i });

                    var rounded1 = pembulatan(parseFloat(price_1));
                    var rounded2 = pembulatan(parseFloat(price_2));
                    var rounded3 = pembulatan(parseFloat(price_3));
                    var rounded4 = pembulatan(parseFloat(price_4));
            
                    var roundedPrice_1 = pembulatanSeratus(rounded1)
                    var roundedPrice_2 = pembulatanSeratus(rounded2)
                    var roundedPrice_3 = pembulatanSeratus(rounded3)
                    var roundedPrice_4 = pembulatanSeratus(rounded4)

                    log.debug('data',{i:i, roundedPrice_1:roundedPrice_1, roundedPrice_2:roundedPrice_2, roundedPrice_3:roundedPrice_3, roundedPrice_4:roundedPrice_4});
                    log.debug('itemsublistid', Itemsublistid)
					itemrec.selectLine({
						sublistId: Itemsublistid,
						line: i
					});
                    itemrec.setCurrentSublistValue({
                        sublistId: Itemsublistid,
                        fieldId: 'price_1_', 
                        value: roundedPrice_1,
                        ignoreFieldChange: true,
                    });
                    var list1 = itemrec.setCurrentSublistValue({
                        sublistId: Itemsublistid,
                        fieldId: 'price_2_', 
                        value: roundedPrice_2,
                        ignoreFieldChange: true,
                    });
                    log.debug('list1', list1);
                    itemrec.setCurrentSublistValue({
                        sublistId: Itemsublistid,
                        fieldId: 'price_3_', 
                        value: roundedPrice_3,
                        ignoreFieldChange: true,
                    });
                    itemrec.setCurrentSublistValue({
                        sublistId: Itemsublistid,
                        fieldId: 'price_4_', 
                        value: roundedPrice_4,
                        ignoreFieldChange: true,
                    });
					itemrec.commitLine({
						sublistId: Itemsublistid
					});
                }
                var recordId = itemrec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
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