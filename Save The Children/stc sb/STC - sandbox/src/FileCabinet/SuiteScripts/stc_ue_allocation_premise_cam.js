/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {
    const TARGET_RECORD_TYPE = 'customrecord_allocation_premise_per_sof_';
    const TARGET_PERIOD_FIELD = 'custrecord_stc_period_to_allocate';
    const TARGET_CAM_FIELD = 'custrecord_stc_allocation_premise_cam';

    const CUSTOM_TRANSACTION_TYPE = 'customtransaction_abj_auto_cam_premise';
    const CUSTOM_TRANSACTION_FORM_ID = -10114;
    const IDR_CURRENCY_ID = 1;
    const DEFAULT_EXCHANGE_RATE = 1;

    const beforeSubmit = (context) => {
        if (
            context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT
        ) {
            return;
        }

        try {
            const currentRecord = context.newRecord;
            const postingPeriodId = currentRecord.getValue({
                fieldId: TARGET_PERIOD_FIELD
            });
            const allocationType = currentRecord.getValue({
                fieldId : "custrecord_stc_allocation_type_generate"
            })
            var costomForm
            if(allocationType == '1'){
                costomForm = 154
            }else{
                costomForm = 155
            }
            if (!postingPeriodId) {
                return;
            }
            log.debug('postingPeriodId', postingPeriodId)
            const existingTransactionId = findExistingTransaction(postingPeriodId, allocationType);
            log.debug('existingTransactionId', existingTransactionId)
            const allocationCamId = existingTransactionId || createCustomTransaction(postingPeriodId, allocationType, costomForm);
            log.debug('allocationCamId', allocationCamId)
            if (!allocationCamId) {
                log.debug('Warning', 'Gagal mendapatkan atau membuat ID transaksi CAM');
                return;
            }

            currentRecord.setValue({
                fieldId: TARGET_CAM_FIELD,
                value: allocationCamId
            });
            
        } catch (error) {
            log.error({
                title: 'Error in beforeSubmit',
                details: error.message
            });
        }
    };

    const findExistingTransaction = (postingPeriodId, allocationType) => {
        const transactionSearch = search.create({
            type: 'transaction',
            filters: [
                ['type', 'anyof', 'Custom116'],
                'AND',
                ['postingperiod', 'anyof', postingPeriodId],
                'AND',
                ['mainline', 'is', 'T'],
                "AND", 
                ["custbody_abj_allocation_type","anyof",allocationType]
            ],
            columns: [
                search.createColumn({
                    name: 'internalid',
                    label: 'Internal ID',
                    sort: search.Sort.ASC 
                })
            ]
        });

        const firstResult = transactionSearch.run().getRange({
            start: 0,
            end: 1
        });

        if (!firstResult || firstResult.length === 0) {
            return null;
        }

        return Number(firstResult[0].getValue({ name: 'internalid' }));
    };

    const createCustomTransaction = (postingPeriodId, allocationType, costomForm) => {
        log.debug('costomForm', costomForm)
        const transactionRecord = record.create({
            type: CUSTOM_TRANSACTION_TYPE,
            isDynamic: true, 
            defaultValues: {
                customform: costomForm
            }
        });

        transactionRecord.setValue({
            fieldId: 'postingperiod',
            value: postingPeriodId
        });
        
        transactionRecord.setValue({
            fieldId: 'currency',
            value: IDR_CURRENCY_ID
        });
        
        transactionRecord.setValue({
            fieldId: 'exchangerate',
            value: DEFAULT_EXCHANGE_RATE
        });
        
        transactionRecord.setValue({
            fieldId: 'trandate',
            value: new Date()
        });
        transactionRecord.setValue({
            fieldId: 'custbody_abj_allocation_type',
            value: allocationType
        });

        return transactionRecord.save({
            enableSourcing: true,
            ignoreMandatoryFields: false
        });
    };

    return {
        beforeSubmit
    };
});