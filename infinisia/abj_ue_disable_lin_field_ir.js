/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget"], (runtime, log, serverWidget) => {
    function beforeLoad(context) {
        var form = context.form;
        if ( context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {
            const formSublist = form.getSublist({
                id: "item"
            });
            if (formSublist) {
                const noSo = formSublist.getField({
                    id: "custcol_abj_no_so"
                });
                noSo.isDisabled = true;
                
                const saslesRep = formSublist.getField({
                    id: "custcol_abj_sales_rep_line"
                });
                saslesRep.isDisabled = true;
                const customer = formSublist.getField({
                    id: "custcol_abj_customer_line"
                });
                customer.isDisabled = true;
                
            }

        }
       
    }
return {
    beforeLoad: beforeLoad,
};
});