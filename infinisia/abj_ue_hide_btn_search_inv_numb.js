/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/runtime'], (serverWidget, runtime) => {
    const beforeLoad = (context) => {
        const form = context.form;
        const currentRecord = context.newRecord;
        const type = context.type;


        if (type !== context.UserEventType.VIEW) return;
        log.debug('triggered')
        // Ambil status record
        // const status = currentRecord.getValue({ fieldId: 'approvalstatus' });

        // // Ambil role user yang login
        const userRole = runtime.getCurrentUser().role;

        // // Kalau status Shipped dan role bukan 3, maka hide tombol Edit
        // log.debug('status', status);
        log.debug('userRole', userRole)
        if ( userRole !== 3) {
            log.debug('masuk kondisi')
            form.removeButton({ id: 'searchtransactions' });
        }
    };

    return { beforeLoad };
});
