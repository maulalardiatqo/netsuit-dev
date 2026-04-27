/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/format'], (record, search, format) => {

    const getSubtitue = (empId) => {
        if (!empId) return null;
        
        const empLook = search.lookupFields({
            type: "employee",
            id: empId,
            columns: ["custentity_stc_subtitute_apprvl", "custentity_stc_delgtion_date_from", "custentity_stc_delegation_date_to"],
        });

        const substituteArr = empLook.custentity_stc_subtitute_apprvl;
        const fromStr = empLook.custentity_stc_delgtion_date_from;
        const toStr = empLook.custentity_stc_delegation_date_to;

        if (substituteArr && substituteArr.length > 0 && fromStr && toStr) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dFrom = format.parse({ value: fromStr, type: format.Type.DATE });
            const dTo = format.parse({ value: toStr, type: format.Type.DATE });

            if (today >= dFrom && today <= dTo) {
                return substituteArr[0].value; 
            }
        }
        return null;
    };

    const afterSubmit = (context) => {
        if (context.type !== context.UserEventType.EDIT) return;

        try {
            const newRec = context.newRecord;
            const oldRec = context.oldRecord;
            var recType = newRec.type;
            log.debug('recType', recType)
            var nextAppField
            if(recType == 'customrecord_tor'){
                nextAppField = 'custrecord_tor_next_approver'
            }else if(recType == 'customrecord_ter'){
                nextAppField = 'custrecord_ter_next_approver'
            }else if(recType == 'customrecord_tar'){
                nextAppField = 'custrecord_tar_next_approver'
            }

            const newNextApprover = newRec.getValue(nextAppField);
            const oldNextApprover = oldRec ? oldRec.getValue(nextAppField) : null;
            log.debug('cek approver', {
                newNextApprover : newNextApprover,
                oldNextApprover : oldNextApprover
            })
            if (newNextApprover && newNextApprover !== oldNextApprover) {
                log.debug('masuk kondisi sini')
                const substituteId = getSubtitue(newNextApprover);
                log.debug('substituteId', substituteId)
                if (substituteId && substituteId != newNextApprover) {
                    
                    log.debug('Action', 'Updating to Substitute ID: ' + substituteId);

                    record.submitFields({
                        type: newRec.type,
                        id: newRec.id,
                        values: {
                            [nextAppField]: substituteId
                        },
                        options: {
                            ignoreMandatoryFields: true,
                            enforceConfigCustomCode: false 
                        }
                    });
                }
            }
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    };

    return { afterSubmit: afterSubmit };
});