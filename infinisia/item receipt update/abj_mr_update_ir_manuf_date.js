/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log'], function (search, record, log) {
    function getInputData() {
        return search.load({ id: 'customsearch_id_ir_update_manufacture' });
    }

    function map(context) {
        let result = JSON.parse(context.value);
        let irId = result.id;
        context.write({ key: irId, value: irId });
    }

    function reduce(context) {
        let irIds = context.values;
        log.debug('irIds', irIds)
        irIds.forEach(id => {
            var newRecord = record.load({
                type : "itemreceipt",
                id : id,
                isDynamic : false
            });
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
            
        });
    }

    function summarize(summary) {
        log.audit('Process Summary', `Total Processed: ${summary.inputSummary.recordCount}`);
        
        summary.reduceSummary.errors.iterator().each(function (key, error) {
            log.error(`Error Deleting Record ID ${key}`, error);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
