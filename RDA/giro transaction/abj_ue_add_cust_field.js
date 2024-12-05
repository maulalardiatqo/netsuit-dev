/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/log', 'N/ui/serverWidget', 'N/record'], (log, serverWidget, record) => {
    const beforeLoad = (context) => {
        if (
            context.type === context.UserEventType.CREATE ||
            context.type === context.UserEventType.EDIT 
        ) {
            const form = context.form;

            try {
                const sublist = form.getSublist({
                    id: 'recmachcustrecord_rda_giro_id',
                });

                if (sublist) {
                    log.debug('Sublist Found', 'Adding custom fields');

                    sublist.addField({
                        id: 'custpage_rda_invoice_number',
                        type: serverWidget.FieldType.SELECT,
                        label: 'RDA - Invoice Number',
                    });

                    sublist.addField({
                        id: 'custpage_rda_amount',
                        type: serverWidget.FieldType.CURRENCY,
                        label: 'RDA - Amount',
                    });

                    log.debug('Fields Added Successfully', 'Custom fields added to the sublist');
                } else {
                    log.error('Sublist Not Found', 'The specified sublist does not exist');
                }
                if(context.type === context.UserEventType.EDIT){
                    var rec = context.newRecord;
                    var recId = rec.id;
                    var cekCust = rec.getValue('custbody_rda_giro_customer');
                    log.debug('cekCust', cekCust)
                    var cekLineCount = rec.getLineCount({
                        sublistId : 'recmachcustrecord_rda_giro_id'
                    });
                    log.debug('cekLineCount', cekLineCount)
                    if(cekLineCount > 0){
                        for(var i = 0; i < cekLineCount; i++){
                            var invoiceNumber = rec.getSublistValue({
                                sublistId : 'recmachcustrecord_rda_giro_id',
                                fieldId : 'custrecord_rda_giro_invoicenum',
                                line : i
                            })
                            log.debug('invoiceNumber', invoiceNumber)
                            rec.setSublistValue({
                                sublistId : 'recmachcustrecord_rda_giro_id',
                                fieldId : 'custpage_rda_invoice_number',
                                line : i,
                                value : invoiceNumber
                            })
                        }
                    }
                }
            } catch (error) {
                log.error('Error Adding Fields', error.message);
            }
        }
    };

    return {
        beforeLoad,
    };
});
