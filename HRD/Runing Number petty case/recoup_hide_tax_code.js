/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'],

function(record, log) {

    function disableField(context) {

        if (context.sublistId == 'expense') {

            var record = context.currentRecord;

            var itemCount = record.getLineCount('expense');

            log.debug('itemCount',itemCount);

            if (itemCount > 0) {

                var itemField = record.getSublistField('expense','taxcode',0);
                itemField.isDisabled = false;
               
            }
        }
    }

    return {
        lineInit: disableField,
        postSourcing: disableField,
    };
});