
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log'], (log) => {

    function afterSubmit(context) {
        try {
            // Hanya berjalan saat record diedit
            if (context.type !== context.UserEventType.EDIT) {
                return;
            }

            const allocationId = context.newRecord.id;

            log.audit({
                title: 'Allocation Schedule Edited',
                details: {
                    allocationId: allocationId,
                    eventType: context.type
                }
            });

            // Uji pemanggilan fungsi bawaan browser.
            // Fungsi ini kemungkinan tidak tersedia di server.
            if (typeof allocation_createJournalEntries === 'function') {
                allocation_createJournalEntries(Number(allocationId));
            } else {
                log.error({
                    title: 'Allocation Function Not Available',
                    details: 'allocation_createJournalEntries tidak tersedia dalam konteks User Event server-side.'
                });
            }

        } catch (e) {
            log.error({
                title: 'Allocation User Event Error',
                details: e
            });
        }
    }

    return {
        afterSubmit
    };
});