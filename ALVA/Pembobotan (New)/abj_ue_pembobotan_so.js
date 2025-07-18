/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
  ) {
    function beforeLoad(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var cekCustomform = rec.getValue('customform')
                log.debug('cekCustomform', cekCustomform);
                var createdFrom = rec.getValue('createdfrom');
                log.debug('createdFrom', createdFrom);
                if(cekCustomform == 134){
                    if(createdFrom){
                        var recQuot = record.load({
                            type: 'estimate',
                            id : createdFrom,
                            isDynamic : true
                        });
                        var lineCOunt = recQuot.getLineCount({
                            sublistId : "recmachcustrecord_transaction_id"
                        })
                        log.debug('linePembobotanCount', lineCOunt)
                        if(lineCOunt > 0){
                            var allDataToset = []
                             for(var i = 0; i < lineCOunt; i++){
                                var lineId = recQuot.getSublistValue({
                                    sublistId: 'recmachcustrecord_transaction_id',
                                    fieldId: 'custrecord_id_line',
                                    line: i
                                });
                                var position = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_position',
                                    line : i
                                });
                                var descPembobotan = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_desc_pembobotan',
                                    line : i
                                });
                                 var ratePembobotan = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_rate_pembobotan',
                                    line : i
                                });
                                var hour = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_hour_pembobotan',
                                    line : i
                                });
                                var amountPembobotan = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_amount_pembobotan',
                                    line : i
                                });
                                var categorySOW = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_category_sow',
                                    line : i
                                });
                                 var department = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_department_pembobotan',
                                    line : i
                                });
                                 var asf = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_asf_pembobotan',
                                    line : i
                                });
                                 var asfPros = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_asf_prosent',
                                    line : i
                                });
                                var itemPembobotan = recQuot.getSublistValue({
                                    sublistId : 'recmachcustrecord_transaction_id',
                                    fieldId : 'custrecord_item_pembobotan',
                                    line : i
                                });
                                allDataToset.push({
                                    lineId : lineId,
                                    position : position,
                                    descPembobotan : descPembobotan,
                                    ratePembobotan : ratePembobotan,
                                    hour : hour,
                                    amountPembobotan : amountPembobotan,
                                    categorySOW : categorySOW,
                                    department : department,
                                    asf : asf,
                                    asfPros : asfPros,
                                    itemPembobotan : itemPembobotan
                                })
                                
                            }
                            log.debug('allDataToset', allDataToset)
                            for (var j = 0; j < allDataToset.length; j++) {
                                rec.selectNewLine({ sublistId: 'recmachcustrecord_transaction_id' });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_id_line', value: allDataToset[j].lineId });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_position', value: allDataToset[j].position });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_desc_pembobotan', value: allDataToset[j].descPembobotan });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_rate_pembobotan', value: allDataToset[j].ratePembobotan });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_hour_pembobotan', value: allDataToset[j].hour });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_amount_pembobotan', value: allDataToset[j].amountPembobotan });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_category_sow', value: allDataToset[j].categorySOW });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_department_pembobotan', value: allDataToset[j].department });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_asf_pembobotan', value: allDataToset[j].asf });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_asf_prosent', value: allDataToset[j].asfPros });
                                rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_transaction_id', fieldId: 'custrecord_item_pembobotan', value: allDataToset[j].itemPembobotan });
                                rec.commitLine({ sublistId: 'recmachcustrecord_transaction_id' });
                            }
                        }
                    }
                }
            }
        }catch(e){
            log.debug('error', e);
        }
    }
    return{
        beforeLoad : beforeLoad
    }
});