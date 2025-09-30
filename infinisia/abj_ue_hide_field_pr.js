/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/runtime', 'N/ui/serverWidget', 'N/record'], (runtime, serverWidget, record) => {
    
    const beforeLoad = (context) => {
        try {
            if (context.type !== context.UserEventType.VIEW) return;

            const form = context.form;
            const rec = context.newRecord;
            const recId = rec.id;
            log.debug('recId', recId);

            const userRole = runtime.getCurrentUser().role;
            log.debug('userRole', userRole);
            if (userRole != 1019) return;
            // if (userRole != 3) return;

            let customForm;
            if (recId) {
                const recordLoad = record.load({
                    type : "purchaseorder",
                    id : recId,
                });
                customForm = recordLoad.getValue('customform');
                log.debug('customForm', customForm);
            }
            if (customForm != 138) return;

            const itemSublist = form.getSublist({ id: 'item' });
            if (itemSublist) {
                const fieldItemCustomer = itemSublist.getField({ id: 'custcol_abj_customer_line' });
                if (fieldItemCustomer) {
                    fieldItemCustomer.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
            }

            form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_field_pr.js';

            try {
                form.removeButton({ id: 'edit' });
            } catch (e) {
                log.debug('Remove button failed', e.message);
            }

        } catch (e) {
            log.error('Error in beforeLoad', e);
        }
    };

    return { beforeLoad };
});
