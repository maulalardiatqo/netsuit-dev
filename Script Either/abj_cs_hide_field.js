/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define([], function () {
    function pageInit(context) {
        
        var countryField = context.currentRecord.getField({
            fieldId: 'country'
        });
        console.log('country', countryField);
    }

    return {
        pageInit: pageInit
    };
});
