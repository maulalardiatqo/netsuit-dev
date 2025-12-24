/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search'], function (record, search) {

    function afterSubmit(context) {
        try {
            if (
                context.type !== context.UserEventType.CREATE &&
                context.type !== context.UserEventType.EDIT
            ) {
                return;
            }

            var rec = context.newRecord;

            var recordLoad = record.load({
                type: rec.type,
                id: rec.id,
                isDynamic: true
            });

            var cekType = recordLoad.getValue('custbody_stc_expense_report_type');
            if (cekType !== '2' && cekType !== '3') return;

            var lineCount = recordLoad.getLineCount({
                sublistId: 'expense'
            });

            if (lineCount <= 0) return;

            for (var i = 0; i < lineCount; i++) {

                var categoryText = recordLoad.getSublistText({
                    sublistId: 'expense',
                    fieldId: 'category',
                    line: i
                }) || '';

                if (
                    categoryText.includes('WHT') ||
                    categoryText.includes('PPh')
                ) {

                    if (i === 0) continue;

                    var prevCategoryText = recordLoad.getSublistText({
                        sublistId: 'expense',
                        fieldId: 'category',
                        line: i - 1
                    }) || '';
                    log.debug('prevCategoryText', prevCategoryText)
                    if (
                        prevCategoryText.includes('WHT') ||
                        prevCategoryText.includes('PPh')
                    ) {
                        continue;
                    }

                    var amount = recordLoad.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amount',
                        line: i
                    });

                    amount = parseFloat(amount) || 0;
                    log.debug('amount', amount)
                    recordLoad.selectLine({
                        sublistId: 'expense',
                        line: i - 1
                    });

                    recordLoad.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol_stc_pph_amount',
                        value: Math.abs(amount),
                        ignoreFieldChange: true
                    });

                    recordLoad.commitLine({
                        sublistId: 'expense'
                    });
                }
            }

            recordLoad.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

        } catch (e) {
            log.error('afterSubmit error', e);
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
