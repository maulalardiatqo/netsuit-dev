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

        log.audit('Starting Search', { approverId, dateFrom, dateTo });

        return search.create({
            type: "transaction",
            filters: [
                ["type", "anyof", "ExpRept", "PurchOrd", "PurchReq", "VendBill"], 
                "AND", ["mainline", "is", "F"], 
                "AND", ["cogs", "is", "F"], 
                "AND", ["taxline", "is", "F"], 
                "AND", ["datecreated", "within", dateFrom, dateTo],
                "AND", [
                    ["custcol_stc_approver_linetrx", "anyof", approverId], 
                    "OR", 
                    ["custcol_stc_approver_fa", "anyof", approverId]
                ]
            ],
            columns: [
                search.createColumn({ name: "internalid", summary: "GROUP" }),
                search.createColumn({ name: "type", summary: "GROUP" })
            ]
        });
    };

    const map = (context) => {
        const searchResult = JSON.parse(context.value);
        log.debug('searchResult', searchResult)
        const scriptObj = runtime.getCurrentScript();
        
        const targetApproverId = scriptObj.getParameter({ name: 'custscript_data_id' });
        const delegationApproval = scriptObj.getParameter({ name: 'custscript_data_approval' });

        try {
            const transactionId = searchResult.values["GROUP(internalid)"] ? 
            searchResult.values["GROUP(internalid)"].value : null;
            const typeCode = searchResult.values["GROUP(type)"] ? 
                            searchResult.values["GROUP(type)"].value : null;
            const typeMap = {
                'PurchOrd': 'purchaseorder',
                'PurchReq': 'purchaserequisition',
                'ExpRept': 'expensereport',
                'VendBill': 'vendorbill'
            };

            const transactionType = typeMap[typeCode];

            log.debug('Processing', `ID: ${transactionId} Type Code: ${typeCode} -> Final Type: ${transactionType}`);

            if (!transactionId || !transactionType) {
                log.error('Missing Data', `Skipping: ID ${transactionId} / Type ${transactionType}`);
                return;
            }

            const rec = record.load({
                type: transactionType,
                id: transactionId,
                isDynamic: true
            });

            const sublists = ['item', 'expense'];
            let isChanged = false;

            sublists.forEach(sublistId => {
                const lineCount = rec.getLineCount({ sublistId: sublistId });
                if (lineCount <= 0) return;

                for (let i = 0; i < lineCount; i++) {
                    let lineChanged = false;
                    let valLineTrx = rec.getSublistValue({ sublistId, fieldId: 'custcol_stc_approver_linetrx', line: i });
                    let valFA = rec.getSublistValue({ sublistId, fieldId: 'custcol_stc_approver_fa', line: i });

                    if (valLineTrx == targetApproverId || valFA == targetApproverId) {
                        rec.selectLine({ sublistId: sublistId, line: i });

                        if (valLineTrx == targetApproverId) {
                            rec.setCurrentSublistValue({ sublistId, fieldId: 'custcol_stc_approver_linetrx', value: delegationApproval });
                        }
                        if (valFA == targetApproverId) {
                            rec.setCurrentSublistValue({ sublistId, fieldId: 'custcol_stc_approver_fa', value: delegationApproval });
                        }

                        rec.commitLine({ sublistId: sublistId });
                        lineChanged = true;
                        isChanged = true;
                    }
                }
            });

            if (isChanged) {
                const idSaved = rec.save();
                log.audit('Success', `Updated Transaction ID: ${idSaved}`);
            }
            
        } catch (e) {
            log.error('Error in Map Stage', `ID: ${context.key} Error: ${e.message}`);
        }
    };

    const summarize = (summary) => {
        log.audit('Process Finished', 'Check execution logs for details');
        summary.mapSummary.errors.iterator().each((key, error) => {
            log.error(`Map Error for key: ${key}`, error);
            return true;
        });
    };

    return {
        getInputData,
        map,
        summarize
    };
});