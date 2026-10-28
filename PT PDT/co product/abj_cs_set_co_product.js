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
                const createdFrom = currentRecord.getValue({fieldId : 'createdfrom'});
                console.log('createdFrom', createdFrom)
                var bom = "";
                if(createdFrom){
                    const workorderSearchObj = search.create({
                        type: "workorder",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters:
                        [
                            ["type","anyof","WorkOrd"], 
                            "AND", 
                            ["internalid","anyof",createdFrom], 
                            "AND", 
                            ["mainline","is","T"]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                join: "bomRevision",
                                label: "Internal ID"
                            })
                        ]
                        });
                        const searchResultCount = workorderSearchObj.runPaged().count;
                        log.debug("workorderSearchObj result count",searchResultCount);
                        workorderSearchObj.run().each(function(billMResult){
                            bom = billMResult.getValue({
                                name: "internalid",
                                join: "bomRevision",
                            })
                        return true;
                        });
                }
                console.log('itemId', itemId)
                console.log('bom', bom)
                if (!itemId) {
                    return;
                }
                console.log('masuk sebelum saved search')
                const coProductSearchObj = search.create({
                    type: 'customrecord_abj_pdt_config_co_product',
                    filters: [
                        ['custrecord_abj_pdt_assembly_item_link', 'anyof', itemId],
                        'AND', 
                        ['custrecord_abj_pdt_bom_revision_link','anyof',bom]
                    ],
                    columns: [
                        search.createColumn({ name: 'custrecord_abj_pdt_co_product', label: 'Co-Product' })
                    ]
                });

                const sublistId = 'recmachcustrecord_pdt_link_wo_completion';
                coProductSearchObj.run().each((result) => {
                    let coProductValue = result.getValue({ name: 'custrecord_abj_pdt_co_product' });
                    console.log('coProductValue', coProductValue)
                    if (coProductValue) {
                        currentRecord.selectNewLine({ sublistId: sublistId });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_pdt_item_result',
                            value: coProductValue
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