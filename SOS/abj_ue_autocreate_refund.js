/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], (record, log) => {

    const afterSubmit = (context) => {
        // Script hanya berjalan pada saat EDIT
        if (context.type !== context.UserEventType.EDIT) {
            return;
        }

        const newRecord = context.newRecord;
        const oldRecord = context.oldRecord;

        // Mendapatkan nilai kondisi trigger
        const oldCancel = oldRecord.getValue('custbody_sos_cancel');
        const newCancel = newRecord.getValue('custbody_sos_cancel');
        const cancelDate = newRecord.getValue('custbody_abj_deposit_cancel_date');

        // Logic Trigger: old = false, new = true, dan cancel date tidak kosong
        if (oldCancel === false && newCancel === true && cancelDate) {
            try {
                const cdId = newRecord.id;
                const customerId = newRecord.getValue('customer');
                const paymentAmount = newRecord.getValue('payment');

                // 1. Inisialisasi record Customer Refund dengan mode Dynamic
                const refundRec = record.create({
                    type: record.Type.CUSTOMER_REFUND,
                    isDynamic: true
                }); 
                refundRec.setValue({ fieldId: 'customer', value: customerId });
                
                // 3. Mapping Body Fields lainnya
                const accountId = newRecord.getValue('account');
                if (accountId) refundRec.setValue({ fieldId: 'account', value: accountId });
                
                const currency = newRecord.getValue('currency');
                if (currency) refundRec.setValue({ fieldId: 'currency', value: currency });
                
                const exchangeRate = newRecord.getValue('exchangerate');
                if (exchangeRate) refundRec.setValue({ fieldId: 'exchangerate', value: exchangeRate });
                
                refundRec.setValue({ fieldId: 'trandate', value: cancelDate });
                
                const subsidiary = newRecord.getValue('subsidiary');
                if (subsidiary) refundRec.setValue({ fieldId: 'subsidiary', value: subsidiary });
                
                const department = newRecord.getValue('department');
                if (department) refundRec.setValue({ fieldId: 'department', value: department });
                
                const cls = newRecord.getValue('class');
                if (cls) refundRec.setValue({ fieldId: 'class', value: cls });
                
                const location = newRecord.getValue('location');
                if (location) refundRec.setValue({ fieldId: 'location', value: location });
                
                refundRec.setValue({ fieldId: 'custbody_sos_return_type', value: 4 });

                // 4. Mapping Line Apply (Mencari dan mencentang deposit di sublist 'deposit')
                const depositLineCount = refundRec.getLineCount({ sublistId: 'deposit' });
                let isApplied = false;

                // Loop sublist 'deposit' (bukan 'apply') untuk mencari Customer Deposit
                for (let i = 0; i < depositLineCount; i++) {
                    refundRec.selectLine({ sublistId: 'deposit', line: i });
                    
                    const docId = refundRec.getCurrentSublistValue({ sublistId: 'deposit', fieldId: 'doc' });
                    
                    if (docId == cdId) {
                        // Centang checkbox apply pada tab deposit
                        refundRec.setCurrentSublistValue({ sublistId: 'deposit', fieldId: 'apply', value: true });
                        
                        // Set amount yang direfund 
                        refundRec.setCurrentSublistValue({ sublistId: 'deposit', fieldId: 'amount', value: paymentAmount });
                        
                        refundRec.commitLine({ sublistId: 'deposit' });
                        isApplied = true;
                        break;
                    }
                }

                // 5. Save Record jika deposit berhasil di-apply
                if (isApplied) {
                    const refundId = refundRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('Refund Created Successfully', `Refund ID: ${refundId} for Deposit ID: ${cdId}`);
                } else {
                    log.error('Apply Failed', `Deposit ID ${cdId} tidak ditemukan di sublist 'deposit'.`);
                }

            } catch (e) {
                log.error({
                    title: 'Error Creating Customer Refund',
                    details: e.message
                });
            }
        }
    };

    return {
        afterSubmit: afterSubmit
    };
});