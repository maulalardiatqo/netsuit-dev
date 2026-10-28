/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log"], (runtime, log) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            form.addButton({
                id: 'custpage_button_print_booking_note',
                label: "Print Booking Note",
                functionName: "printBookingNote()"
            });
            context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_booking_note.js"
            
        
        }
}
return {
    beforeLoad: beforeLoad,
};
});