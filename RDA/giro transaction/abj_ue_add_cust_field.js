/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/log', 'N/ui/serverWidget', 'N/record', 'N/search'], (log, serverWidget, record, search) => {
    function setInv(custId){
        var allInv = []
        if(custId){
            var invoiceSearchObj = search.create({
                    type: "invoice",
                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                    filters:
                    [
                        ["type","anyof","CustInvc"], 
                        "AND", 
                        ["status","anyof","CustInvc:A"], 
                        "AND", 
                        ["customer.internalid","anyof",custId], 
                        "AND", 
                        ["mainline","is","T"]
                    ],
                    columns:
                    [
                        search.createColumn({name: "tranid", label: "Document Number"}),
                        search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
                log.debug("invoiceSearchObj result count",searchResultCount);
                invoiceSearchObj.run().each(function(result){
                    var idInv = result.getValue({
                        name: "internalid"
                    });
                    var docNumb = result.getValue({
                        name: "tranid"
                    })
                    if(idInv){
                        allInv.push({
                            idInv : idInv,
                            docNumb : docNumb
                        })
                    }
                    return true;
                });
        }
        return allInv
    }
    const beforeLoad = (context) => {
   
            const form = context.form;

            try {
                if(context.type === context.UserEventType.CREATE){
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
    
                        var amountField = sublist.addField({
                            id: 'custpage_rda_amount',
                            type: serverWidget.FieldType.CURRENCY,
                            label: 'RDA - Amount',
                        });
                        amountField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        log.debug('Fields Added Successfully', 'Custom fields added to the sublist');
                    } else {
                        log.error('Sublist Not Found', 'The specified sublist does not exist');
                    }
                }
                
                if (context.type === context.UserEventType.EDIT) {
                    const rec = context.newRecord;
                    const recId = rec.id;
                    const cekCust = rec.getValue('custbody_rda_giro_customer');
                    log.debug('cekCust', cekCust);
                
                    const sublist = form.getSublist({
                        id: 'recmachcustrecord_rda_giro_id',
                    });
                
                    let invField; 
                
                    if (sublist) {
                        log.debug('Sublist Found', 'Adding custom fields');
                
                        sublist.addField({
                            id: 'custpage_rda_invoice_number',
                            type: serverWidget.FieldType.SELECT,
                            label: 'RDA - Invoice Number',
                        });
                
                        invField = sublist.addField({
                            id: 'custpage_rda_amount',
                            type: serverWidget.FieldType.CURRENCY,
                            label: 'RDA - Amount',
                        });
                        invField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        const allInv = setInv(cekCust);
                        log.debug('allInv', allInv);
            
                        allInv.forEach(function (inv) {
                            const idInv = inv.idInv;
                            const docNumb = inv.docNumb;
                            sublist.getField({
                                id: 'custpage_rda_invoice_number',
                            }).addSelectOption({
                                value: idInv,
                                text: docNumb,
                            });
                        });
                        log.debug('Fields Added Successfully', 'Custom fields added to the sublist');
                    } else {
                        log.error('Sublist Not Found', 'The specified sublist does not exist');
                    }
                
                    const cekLineCount = rec.getLineCount({
                        sublistId: 'recmachcustrecord_rda_giro_id',
                    });
                    log.debug('cekLineCount', cekLineCount);
                
                    if (cekLineCount > 0 && invField) {
                        for (let i = 0; i < cekLineCount; i++) {
                            const invoiceNumber = rec.getSublistValue({
                                sublistId: 'recmachcustrecord_rda_giro_id',
                                fieldId: 'custrecord_rda_giro_invoicenum',
                                line: i,
                            });
                            log.debug('invoiceNumber', invoiceNumber);
                
                           
                
                            rec.setSublistValue({
                                sublistId: 'recmachcustrecord_rda_giro_id',
                                fieldId: 'custpage_rda_invoice_number',
                                line: i,
                                value: invoiceNumber,
                            });
                
                            const amount = rec.getSublistValue({
                                sublistId: 'recmachcustrecord_rda_giro_id',
                                fieldId: 'custrecord_rda_giro_amountinvoice',
                                line: i,
                            });
                            log.debug('amount', amount);
                
                            rec.setSublistValue({
                                sublistId: 'recmachcustrecord_rda_giro_id',
                                fieldId: 'custpage_rda_amount',
                                line: i,
                                value: amount,
                            });
                        }
                    }
                }
                
            } catch (error) {
                log.error('Error Adding Fields', error.message);
            }

    };

    return {
        beforeLoad,
    };
});
