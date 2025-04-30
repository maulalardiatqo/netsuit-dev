/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                const newRecord = context.newRecord;
                const itemCount = newRecord.getLineCount({ sublistId: 'item' });
                var trandate = newRecord.getValue('trandate');
                log.debug('trandate', trandate)

                for (let i = 0; i < itemCount; i++) {
                    const itemId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    try {
                        const inventoryDetail = newRecord.getSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: i
                        });
                        log.debug('inventoryDetail', inventoryDetail)
                        if (inventoryDetail) {
                            const assignCount = inventoryDetail.getLineCount({
                                sublistId: 'inventoryassignment'
                            });

                            for (let j = 0; j < assignCount; j++) {
                                const numberedRecordId = inventoryDetail.getSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'numberedrecordid',
                                    line: j
                                  });
                    
                                  if (numberedRecordId) {
                                    log.debug('Dapat numberedrecordid', `Item Line: ${i}, Assignment Line: ${j}, numberedrecordid: ${numberedRecordId}`);
                                    var recInvNumb = record.load({
                                        type: "inventorynumber",
                                        id: numberedRecordId,
                                        isDynamic: true,
                                    });
                                    log.debug('recInvNumb', recInvNumb)
                                    var cekInvNumb = recInvNumb.getValue('inventorynumber')
                                    log.debug('cekInvNumb', cekInvNumb)
                                    if(trandate){
                                        recInvNumb.setValue({
                                            fieldId: "custitemnumber_abj_manufacturing_date",
                                            value: trandate,
                                            ignoreFieldChange: true,
                                        })
                                        recInvNumb.save({
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true,
                                        });
                                    }
                                  } else {
                                    log.debug('numberedrecordid kosong', `Item Line: ${i}, Assignment Line: ${j}`);
                                  }
                            }
                        }
                    } catch (e) {
                        log.debug('Tidak ada Inventory Detail', `Item Line: ${i}, Item ID: ${itemId}, Error: ${e.message}`);
                    }
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    
    return {
        afterSubmit: afterSubmit,
    };
});