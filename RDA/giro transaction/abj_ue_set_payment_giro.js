/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/query"], function (record, search, query) {

    function createnewRecord(linkGiro, amtpymt, idRec){
        var recGiro = record.load({
            type: 'customtransaction_rda_giro_trans',
            id: linkGiro,
            isDynamic: true,
        });
        var amountExist = recGiro.getValue('custbody_rda_amount_giro_outstanding');

        var newAMount = Number(amtpymt) + Number(amountExist);
        let existingValues = recGiro.getValue({ fieldId: 'custbody_rda_giro_cuspaynum' }) || [];

        if (!Array.isArray(existingValues)) {
            existingValues = [existingValues];
        }

        log.debug('Existing Values', existingValues);

        if (!existingValues.includes(idRec)) {
            existingValues.push(idRec);
            log.debug('Updated Values', existingValues);

            recGiro.setValue({
                fieldId: 'custbody_rda_giro_cuspaynum',
                value: existingValues,
                ignoreFieldChange: true,
            });
        } else {
            log.debug('Value already exists', idRec);
        }

        recGiro.setValue({
            fieldId : 'custbody_rda_amount_giro_outstanding',
            value : newAMount,
            ignoreFieldChange: true,
        });
        var savetrans = recGiro.save({
            enableSourcing: false,
            ignoreMandatoryFields: true,
        });
        log.debug("saveTrans", savetrans);
    }
    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE) {
            
            var rec = context.newRecord;
            var idRec = rec.id;
            var linkGiro = rec.getValue('custbody_rda_giro_numberlink');
            var amtpymt = rec.getValue('payment') || 0;
            log.debug('linkGiro', linkGiro);
            if(linkGiro){
                createnewRecord(linkGiro, amtpymt, idRec)
            }
        }
        if (context.type === context.UserEventType.EDIT){
            var oldRec = context.oldRecord;
            var newRec = context.newRecord
            var idRec = oldRec.id;
            var linkGiro = newRec.getValue('custbody_rda_giro_numberlink');
            var amtpymt = newRec.getValue('payment') || 0;
            var amtOld = oldRec.getValue('payment');
            log.debug('linkGiro', linkGiro);
            if(linkGiro){
                var recGiro = record.load({
                    type: 'customtransaction_rda_giro_trans',
                    id: linkGiro,
                    isDynamic: true,
                });
                var cekCp = recGiro.getValue('custbody_rda_giro_cuspaynum');
                var amountExist = recGiro.getValue('custbody_rda_amount_giro_outstanding');

                log.debug('cekCp', cekCp);
                if (Array.isArray(cekCp) && cekCp.includes(idRec.toString())) {
                    if(amtOld){
                        if(amtOld != amtpymt){
                            log.debug('amtOld', amtOld)
                            log.debug('amtpymt', amtpymt)
                            var removAmt = Number(amountExist) - Number(amtOld)
                            log.debug('removAmt', removAmt)
                            var newAmt = Number(removAmt) + Number(amtpymt);
                            log.debug('newAmt', newAmt)
                            recGiro.setValue({
                                fieldId : 'custbody_rda_amount_giro_outstanding',
                                value : newAmt,
                                ignoreFieldChange: true,
                            });
                            var savetrans = recGiro.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true,
                            });
                            log.debug("saveTrans", savetrans);
                        }else{
                            log.debug('amount sama')
                        }
                        
                    }
                    log.debug('ada data')
                } else {
                    createnewRecord(linkGiro, amtpymt, idRec)
                }
            }
        }
        if (context.type === context.UserEventType.DELETE){
            const deletedRecord = context.oldRecord;

                const giroNumberLink = deletedRecord.getValue('custbody_rda_giro_numberlink');
                log.debug('giroNumberLink', giroNumberLink)
                const paymentAmount = deletedRecord.getValue('payment');
                log.debug('paymentAmount', paymentAmount)

                if (giroNumberLink) {
                    const giroRecord = record.load({
                        type: 'customtransaction_rda_giro_trans',
                        id: giroNumberLink,
                        isDynamic: false,
                    });

                    let giroCusPayNum = giroRecord.getValue('custbody_rda_giro_cuspaynum') || [];
                    
                    const deletedRecordId = context.oldRecord.id;

                    giroCusPayNum = giroCusPayNum.filter((id) => id !== deletedRecordId);
                    log.debug('giroCusPayNum', giroCusPayNum)
                    giroRecord.setValue({
                        fieldId : 'custbody_rda_giro_cuspaynum', 
                        value : giroCusPayNum
                    });

                    const outstandingAmount = giroRecord.getValue('custbody_rda_amount_giro_outstanding') || 0;

                    const updatedOutstandingAmount = parseFloat(outstandingAmount) - parseFloat(paymentAmount);
                    log.debug('updatedOutstandingAmount', updatedOutstandingAmount)
                    giroRecord.setValue({
                        fieldId : 'custbody_rda_amount_giro_outstanding', 
                        value : updatedOutstandingAmount
                    });

                    var savetrans = giroRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    });
                    log.debug("saveTrans delete", savetrans);

                    
                }
        }
    }
    return {
        afterSubmit: afterSubmit,
      };
    });