/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log'], (search, record, runtime, log) => {

    const getInputData = () => {
        const scriptObj = runtime.getCurrentScript();
        const approverId = scriptObj.getParameter({ name: 'custscript_data_id' });
        const dateFrom = scriptObj.getParameter({ name: 'custscript_dal_date_from' });
        const dateTo = scriptObj.getParameter({ name: 'custscript_dal_date_to' });

        log.audit('Starting Search Combined', { approverId, dateFrom, dateTo });

        const transactionSearch = search.create({
            type: "transaction",
            filters: [
                ["type", "anyof", "ExpRept", "PurchOrd", "PurchReq", "VendBill"], 
                "AND", ["mainline", "is", "F"], 
                "AND", ["cogs", "is", "F"], 
                "AND", ["taxline", "is", "F"], 
                "AND", ["datecreated", "within", dateFrom, dateTo],
                "AND", [
                    ["custcol_stc_approver_linetrx", "anyof", approverId], "OR", ["custcol_stc_approver_fa", "anyof", approverId]
                ]
            ],
            columns: [
                search.createColumn({ name: "internalid", summary: "GROUP" }),
                search.createColumn({ name: "type", summary: "GROUP" })
            ]
        });

        const results = [];

        transactionSearch.run().each(res => {
            results.push({
                isCustomRecord: false,
                id: res.getValue({ name: "internalid", summary: "GROUP" }),
                type: res.getValue({ name: "type", summary: "GROUP" })
            });
            return true;
        });

        const addCustomRecordResults = (recType, dateField, fieldAppr, fieldApprFa) => {
            const customSearch = search.create({
                type: recType,
                filters: [
                    [dateField, "within", dateFrom, dateTo],
                    "AND", [
                        [fieldAppr, "anyof", approverId], "OR", [fieldApprFa, "anyof", approverId]
                    ]
                ],
                columns: ['internalid']
            });
            customSearch.run().each(res => {
                results.push({
                    isCustomRecord: true,
                    id: res.id,
                    type: recType,
                    f1: fieldAppr,
                    f2: fieldApprFa
                });
                return true;
            });
        };

        addCustomRecordResults('customrecord_tor_items', 'custrecord_tori_id.created', 'custrecord_tori_approver', 'custrecord_tori_approver_fa');
        addCustomRecordResults('customrecord_tar_expenses', 'custrecord_tar_e_id.created', 'custrecord_tare_approver', 'custrecord_tar_approver_fa');
        addCustomRecordResults('customrecord_ter_diem', 'custrecord_terd_id.created', 'custrecord_terd_approver', 'custrecord_ter_approver_fa');

        return results;
    };

    const map = (context) => {
        const data = JSON.parse(context.value);
        const scriptObj = runtime.getCurrentScript();
        const targetApproverId = scriptObj.getParameter({ name: 'custscript_data_id' });
        const delegationApproval = scriptObj.getParameter({ name: 'custscript_data_approval' });

        try {
            if (data.isCustomRecord) {
                const rec = record.load({ type: data.type, id: data.id, isDynamic: true });
                let isChanged = false;

                if (rec.getValue(data.f1) == targetApproverId) {
                    rec.setValue(data.f1, delegationApproval);
                    isChanged = true;
                }
                if (rec.getValue(data.f2) == targetApproverId) {
                    rec.setValue(data.f2, delegationApproval);
                    isChanged = true;
                }

                if (isChanged) {
                    rec.save();
                    log.audit('Success Custom Rec', `Updated ${data.type} ID: ${data.id}`);
                }

            } else {
                const typeMap = { 'PurchOrd': 'purchaseorder', 'PurchReq': 'purchaserequisition', 'ExpRept': 'expensereport', 'VendBill': 'vendorbill' };
                const transactionType = typeMap[data.type];

                if (!data.id || !transactionType) return;

                const rec = record.load({ type: transactionType, id: data.id, isDynamic: true });
                const sublists = ['item', 'expense'];
                let isChanged = false;

                sublists.forEach(sublistId => {
                    const lineCount = rec.getLineCount({ sublistId });
                    for (let i = 0; i < lineCount; i++) {
                        let valLineTrx = rec.getSublistValue({ sublistId, fieldId: 'custcol_stc_approver_linetrx', line: i });
                        let valFA = rec.getSublistValue({ sublistId, fieldId: 'custcol_stc_approver_fa', line: i });

                        if (valLineTrx == targetApproverId || valFA == targetApproverId) {
                            rec.selectLine({ sublistId, line: i });
                            if (valLineTrx == targetApproverId) rec.setCurrentSublistValue({ sublistId, fieldId: 'custcol_stc_approver_linetrx', value: delegationApproval });
                            if (valFA == targetApproverId) rec.setCurrentSublistValue({ sublistId, fieldId: 'custcol_stc_approver_fa', value: delegationApproval });
                            rec.commitLine({ sublistId });
                            isChanged = true;
                        }
                    }
                });

                if (isChanged) {
                    rec.save();
                    log.audit('Success Transaction', `Updated ${transactionType} ID: ${data.id}`);
                }
            }
        } catch (e) {
            log.error('Error in Map Stage', `Type: ${data.type} ID: ${data.id} Error: ${e.message}`);
        }
    };

    const summarize = (summary) => {
        log.audit('Process Finished', 'Check execution logs for details');
    };

    return { getInputData, map, summarize };
});