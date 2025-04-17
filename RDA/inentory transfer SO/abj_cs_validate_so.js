/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"],
    function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {

        function saveRecord(context) {
            try {
                const currentRec = context.currentRecord;
                const lineCount = currentRec.getLineCount({ sublistId: 'item' });

                for (let i = 0; i < lineCount; i++) {
                    const itemType = currentRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    });

                    const quantity = currentRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });
                    log.debug('quantity', quantity)
                    log.debug('itemType', itemType)
                    // Hanya cek quantity jika itemtype adalah Inventory atau Non-Inventory
                    if (
                        (itemType === 'InvtPart' || itemType === 'NonInvtPart') &&
                        (!quantity || parseFloat(quantity) === 0)
                    ) {
                        log.debug('quantity sama dengan 0')
                        dialog.alert({
                            title: 'Warning',
                            message: 'One or more lines have a quantity of 0'
                        });
                        return false;
                    }
                }

                return true;
            } catch (e) {
                log.error({
                    title: 'Validation Error',
                    details: e
                });

                dialog.alert({
                    title: 'Error',
                    message: 'An error occurred while validating quantity. Please try again.'
                });

                return false;
            }
        }

        return {
            saveRecord: saveRecord
        };
    });
