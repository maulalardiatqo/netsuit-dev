/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/ui/serverWidget'], (serverWidget) => {
    const beforeLoad = (context) => {
        if (context.type === context.UserEventType.CREATE ||
            context.type === context.UserEventType.EDIT ||
            context.type === context.UserEventType.VIEW) {

            // Form utama
            const form = context.form;

            const sublist = form.getSublist({
                id: 'recmachcustrecord_rda_giro_id',
            });

            sublist.addField({
                id: 'custpage_sublist_list_field',
                type: serverWidget.FieldType.SELECT,
                label: 'RDA - Invoice Number',
            });
            sublist.addField({
                id: 'custpage_sublist_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'RDA - Amount',
            });
            
        }
    };

    return {
        beforeLoad,
    };
});
