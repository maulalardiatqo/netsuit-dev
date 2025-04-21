/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(record, search) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.EDIT) {
                const newRec = context.newRecord;
                const recId = newRec.id;
                const recType = newRec.type;

                // Load record secara penuh agar bisa dimodifikasi
                const fullRecord = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: false
                });

                const sublistId = 'recmachcustrecord_transaction';
                const lineCount = fullRecord.getLineCount({ sublistId });

                let lineInvoiceNumbers = [];

                for (let i = 0; i < lineCount; i++) {
                    const invoiceNum = fullRecord.getSublistValue({
                        sublistId,
                        fieldId: 'custrecord_invoice_number',
                        line: i
                    });

                    if (invoiceNum) {
                        lineInvoiceNumbers.push(invoiceNum.toString().trim());
                    }
                }

                const uniqueLineInvoices = [...new Set(lineInvoiceNumbers)];
                log.debug('uniqueLineInvoices', uniqueLineInvoices)
                const updatedInvoiceString = uniqueLineInvoices.join(', ');

                log.debug('updatedInvoiceString (from lines only)', updatedInvoiceString);

                fullRecord.setValue({
                    fieldId: 'custbody_rda_invoice_number',
                    value: uniqueLineInvoices
                });

                // Save updated record
                fullRecord.save({ ignoreMandatoryFields: true });
                log.debug('fullRecord', fullRecord)
            }
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    }

    return {
        afterSubmit: afterSubmit,
    };
});
