/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'], function(record) {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {
            var form = context.form;
            const formSublist = form.getSublist({
                id: "item"
            });
            if (formSublist) {
                const totalOrder = formSublist.getField({
                    id: "custcol_pr_total_order"
                });
                log.debug('totalOrder', totalOrder)
                totalOrder.isDisabled = false;
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
