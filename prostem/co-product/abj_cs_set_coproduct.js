/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/search', 'N/log'], (search, log) => {

    const pageInit = (context) => {
        try {
            console.log('mode', context.mode)
            if (context.mode == 'copy' || context.mode == 'create') {
                const currentRecord = context.currentRecord;
                const itemId = currentRecord.getValue({ fieldId: 'item' });
                console.log('itemId', itemId)
                if (!itemId) {
                    return;
                }
                const coProductSearchObj = search.create({
                    type: 'customrecord_abj_pdt_config_co_product',
                    filters: [
                        ['custrecord_abj_pdt_assembly_item_link', 'anyof', itemId]
                    ],
                    columns: [
                        search.createColumn({ name: 'custrecord_abj_pdt_co_product', label: 'Co-Product' }),
                        search.createColumn({ name: 'custrecord_abj_qty_result', label: 'qty result' })
                        
                    ]
                });

                const sublistId = 'recmachcustrecord_pdt_link_wo_completion';
                coProductSearchObj.run().each((result) => {
                    let coProductValue = result.getValue({ name: 'custrecord_abj_pdt_co_product' });
                    let qtyResult = result.getValue({ name: 'custrecord_abj_qty_result' });
                    console.log('coProductValue', coProductValue)
                    if (coProductValue) {
                        currentRecord.selectNewLine({ sublistId: sublistId });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_pdt_item_result',
                            value: coProductValue
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_abj_est_qty_result_on_entry',
                            value: qtyResult
                        });
                        
                        currentRecord.commitLine({ sublistId: sublistId });
                    }
                    
                    return true; 
                });
            }

            

        } catch (error) {
            log.error({
                title: 'Error in pageInit - Auto Populate Co-Product',
                details: error.message
            });
        }
    };

    return {
        pageInit: pageInit
    };
});