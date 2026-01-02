/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/log'], function (record, log) {

    const msgGlobal = `
        <div style="color: red;
                    font-size: 12px;
                    font-weight: bold;
                    text-align: center;">
            WARNING <br> One or more line transaction is exceeded Budget
        </div>
    `;

    function beforeSubmit(context) {
        const newRec = context.newRecord;
        const type = context.type;

        if (type !== context.UserEventType.CREATE &&
            type !== context.UserEventType.EDIT &&
            type !== context.UserEventType.COPY) {
            return;
        }

        log.debug("UE Triggered", "Type: " + type);

        // =============================
        // CHECK EXPENSE SUBLIST
        // =============================
        const lineExp = newRec.getLineCount({ sublistId: 'expense' });

        for (let i = 0; i < lineExp; i++) {

            let budget = newRec.getSublistValue({
                sublistId: 'expense',
                fieldId: 'custcol_stc_budget_amount',
                line: i
            });

            let consumed = newRec.getSublistValue({
                sublistId: 'expense',
                fieldId: 'custcol_stc_budget_consumed',
                line: i
            });
            log.debug('compare amount', {
                budget : budget, consumed : consumed
            })
            if (budget && consumed) {
                if (Number(consumed) > Number(budget)) {
                    newRec.setValue({
                        fieldId: 'custbody_stc_budget_allert',
                        value: msgGlobal
                    });
                    return;
                }
            }
        }

        // =============================
        // CHECK ITEM SUBLIST
        // =============================
        const lineItem = newRec.getLineCount({ sublistId: 'item' });

        for (let j = 0; j < lineItem; j++) {

            let budget = newRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_stc_budget_amount',
                line: j
            });

            let consumed = newRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_stc_budget_consumed',
                line: j
            });
            log.debug('compare amount item', {
                budget : budget,
                consumed : consumed
            })
            if (budget && consumed) {
                if (Number(consumed) > Number(budget)) {
                    log.debug('msgGlobal', msgGlobal)
                    newRec.setValue({
                        fieldId: 'custbody_stc_budget_allert',
                        value: msgGlobal
                    });
                    return;
                }
            }
        }

        // =============================
        // JIKA TIDAK ADA YANG EXCEED
        // =============================
        newRec.setValue({
            fieldId: 'custbody_stc_budget_allert',
            value: ''
        });
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
