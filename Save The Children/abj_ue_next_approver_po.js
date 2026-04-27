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

            const newNextApprover = newRec.getValue('nextapprover');
            const oldNextApprover = oldRec ? oldRec.getValue('nextapprover') : null;
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
                            'nextapprover': substituteId
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