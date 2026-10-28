/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log'], (search, record, runtime, log) => {

    const getInputData = () => {
        const scriptObj = runtime.getCurrentScript();
        const approverId = scriptObj.getParameter({ name: 'custscript_data_id' });
        log.debug('approverId', approverId)
        const dateFrom = scriptObj.getParameter({ name: 'custscript_dal_date_from' });
        const dateTo = scriptObj.getParameter({ name: 'custscript_dal_date_to' });

        log.audit('Starting Map/Reduce Search', { approverId, dateFrom, dateTo });

        const results = [];

        // =====================================================================
        // 1. FUNGSI LAMA: Pencarian Transaksi & Custom Record untuk Line/Sublist
        // =====================================================================
       const transactionSearch = search.create({
            type: "transaction",
            filters: [
                ["type", "anyof", "ExpRept", "PurchOrd", "PurchReq", "VendBill"], 
                "AND", ["mainline", "is", "F"], 
                "AND", ["cogs", "is", "F"], 
                "AND", ["taxline", "is", "F"], 
                "AND", ["trandate", "within", dateFrom, dateTo],
                "AND", [
                    // Kondisi 1: Approver Line cocok DAN status Line adalah 1
                    [
                        ["custcol_stc_approver_linetrx", "anyof", approverId], 
                        "AND", 
                        ["custcol_stc_approval_status_line", "anyof", "1"]
                    ], 
                    "OR", 
                    // Kondisi 2: Approver FA cocok DAN status FA adalah 1
                    [
                        ["custcol_stc_approver_fa", "anyof", approverId], 
                        "AND", 
                        ["custcol_stc_apprvl_sts_fa", "anyof", "1"]
                    ]
                ]
            ],
            columns: [
                search.createColumn({ name: "internalid", summary: "GROUP" }),
                search.createColumn({ name: "type", summary: "GROUP" })
            ]
        });

        transactionSearch.run().each(res => {
            results.push({
                isCustomRecord: false,
                isHeaderUpdate: false, // Flag lama (line sublist)
                id: res.getValue({ name: "internalid", summary: "GROUP" }),
                type: res.getValue({ name: "type", summary: "GROUP" })
            });
            return true;
        });

        // =====================================================================
        // FUNGSI LAMA: Pencarian Custom Record untuk Line/Sublist
        // =====================================================================
        const addCustomRecordResults = (recType, dateField, fieldAppr, fieldApprFa, statusField, statusFieldFa) => {
            search.create({
                type: recType,
                filters: [
                    [dateField, "within", dateFrom, dateTo],
                    "AND", [
                        // Kondisi 1: Approver cocok DAN Status = 1
                        [
                            [fieldAppr, "anyof", approverId], 
                            "AND", 
                            [statusField, "anyof", "1"]
                        ], 
                        "OR", 
                        // Kondisi 2: Approver FA cocok DAN Status FA = 1
                        [
                            [fieldApprFa, "anyof", approverId], 
                            "AND", 
                            [statusFieldFa, "anyof", "1"]
                        ]
                    ]
                ],
                columns: ['internalid']
            }).run().each(res => {
                results.push({
                    isCustomRecord: true,
                    isHeaderUpdate: false,
                    id: res.id,
                    type: recType,
                    f1: fieldAppr,
                    f2: fieldApprFa
                });
                return true;
            });
        };

        // Pemanggilan fungsi dengan penambahan field status
        addCustomRecordResults(
            'customrecord_tor_items', 
            'custrecord_tori_id.custrecord_tor_date', 
            'custrecord_tori_approver', 
            'custrecord_tori_approver_fa', 
            'custrecord_tori_approval_status',      // Status Line
            'custrecord_tori_approval_status_fa'    // Status FA
        );

        addCustomRecordResults(
            'customrecord_tar_expenses', 
            'custrecord_tar_e_id.custrecord_tar_date', 
            'custrecord_tare_approver', 
            'custrecord_tar_approver_fa', 
            'custrecord_tare_approval_status',      // Status Line
            'custrecord_tar_apprvl_sts_fa'          // Status FA
        );

        addCustomRecordResults(
            'customrecord_ter_diem', 
            'custrecord_terd_id.custrecord_ter_date', 
            'custrecord_terd_approver', 
            'custrecord_ter_approver_fa', 
            'custrecord_terd_approval_status',      // Status Line
            'custrecord_ter_apprvl_sts_fa'          // Status FA
        );
        // =====================================================================
        // 2. FUNGSI BARU: Pencarian Transaksi untuk Update Header
        // =====================================================================
        
        const runHeaderSearch = (searchObj, actualRecordType, headerFieldId, isCustom = false) => {
            log.debug('isCustom', isCustom)
            log.debug('headerFieldId', headerFieldId)
            searchObj.run().each(res => {
                results.push({
                    isCustomRecord: isCustom,
                    isHeaderUpdate: true,        // Flag fungsi baru
                    id: res.id,
                    type: actualRecordType,      // Parameter Record ID sesungguhnya untuk map()
                    headerField: headerFieldId   // Field ID yang akan di update
                });
                return true;
            });
        };

        // --- Purchase Requisition ---
        runHeaderSearch(search.create({
            type: "purchaserequisition",
            filters: [
                ["type", "anyof", "PurchReq"], "AND", 
                ["nextapprover", "anyof", approverId], "AND", 
                ["mainline", "is", "T"], "AND",     
                ["custbody_stc_apprvd_byapproval","isempty",""],"AND", 
                ["trandate", "within", dateFrom, dateTo]
            ],
            columns: ["internalid"]
        }), 'purchaserequisition', 'nextapprover');

        
        runHeaderSearch(search.create({
            type: "purchaseorder",
            filters: [
                ["type", "anyof", "PurchOrd"], "AND", 
                ["custbody_stc_po_type", "anyof", "1"], "AND", 
                ["trandate", "within", dateFrom, dateTo], "AND",
                ["custbody_stc_last_approve_spc","isempty",""], "AND",
                ["nextapprover", "anyof", approverId], "AND", 
                ["mainline", "is", "T"]
            ],
            columns: ["internalid"]
        }), 'purchaseorder', 'nextapprover');
    
        runHeaderSearch(search.create({
            type: "purchaseorder",
            filters: [
                ["type", "anyof", "PurchOrd"], "AND", 
                ["custbody_stc_po_type", "anyof", "2"], "AND", 
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["nextapprover", "anyof", approverId], "AND", 
                ["custbody29","isempty",""], "AND",
                ["mainline", "is", "T"]
            ],
            columns: ["internalid"]
        }), 'purchaseorder', 'nextapprover');

        runHeaderSearch(search.create({
            type: "purchaseorder",
            filters: [
                ["type", "anyof", "PurchOrd"], "AND", 
                ["custbody_stc_po_type", "anyof", "4", "3"], "AND", 
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["mainline", "is", "T"], "AND", 
                ["custbody29","isempty",""], "AND",
                ["nextapprover", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'purchaseorder', 'nextapprover');
        

        // --- Purchase Order (Level 2 & Level 3 Penambahan Baru) ---
        
        // PO Type 2 - Level 2 (custbody_stc_apprvl_fince_rec_form)
        runHeaderSearch(search.create({
            type: "purchaseorder",
            filters: [
                ["type", "anyof", "PurchOrd"], "AND", 
                ["custbody_stc_po_type", "anyof", "2"], "AND", 
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["mainline", "is", "T"], "AND",
                ["custbody_stc_apprvd_byfinance","isempty",""], "AND",
                ["custbody_stc_apprvl_fince_rec_form", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'purchaseorder', 'custbody_stc_apprvl_fince_rec_form');

        // PO Type 2 - Level 3 (custbody_stc_apprvl_pod)
        runHeaderSearch(search.create({
            type: "purchaseorder",
            filters: [
                ["type", "anyof", "PurchOrd"], "AND", 
                ["custbody_stc_po_type", "anyof", "2"], "AND", 
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["mainline", "is", "T"], "AND",
                ["custbody_stc_apprvd_bypod","isempty",""], "AND",
                ["custbody_stc_apprvl_pod", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'purchaseorder', 'custbody_stc_apprvl_pod');

        // PO Type 4 - Level 3 (custbody_stc_apprvl_pod)
        runHeaderSearch(search.create({
            type: "purchaseorder",
            filters: [
                ["type", "anyof", "PurchOrd"], "AND", 
                ["custbody_stc_po_type", "anyof", "4"], "AND", 
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["mainline", "is", "T"], "AND",
                ["custbody_stc_apprvd_bypod","isempty",""], "AND",
                ["custbody_stc_apprvl_pod", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'purchaseorder', 'custbody_stc_apprvl_pod');


        // --- Vendor Bill ---
        runHeaderSearch(search.create({
            type: "vendorbill",
            filters: [
                ["type", "anyof", "VendBill"], "AND", 
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["mainline", "is", "T"], "AND", 
                ["custbody_stc_apprvd_byapproval","isempty",""], "AND",
                ["nextapprover", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'vendorbill', 'nextapprover');

        // --- Expense Report (3 Kondisi) ---
        runHeaderSearch(search.create({
            type: "expensereport",
            filters: [
                ["type", "anyof", "ExpRept"], "AND", 
                ["customform", "anyof", "100"], "AND", 
                ["custbody_stc_apprvd_byapproval","isempty",""], "AND",
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["nextapprover", "anyof", approverId], "AND", 
                ["mainline", "is", "T"]
            ],
            columns: ["internalid"]
        }), 'expensereport', 'nextapprover');

        runHeaderSearch(search.create({
            type: "expensereport",
            filters: [
                ["type", "anyof", "ExpRept"], "AND", 
                ["customform", "anyof", "100"], "AND", 
                ["custbody_stc_apprvd_byapproval","isempty",""], "AND",
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["mainline", "is", "T"], "AND", 
                ["custbody_stc_expense_report_type", "anyof", "1"], "AND", 
                ["nextapprover", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'expensereport', 'nextapprover');

        runHeaderSearch(search.create({
            type: "expensereport",
            filters: [
                ["type", "anyof", "ExpRept"], "AND", 
                ["customform", "anyof", "139"], "AND", 
                ["custbody_stc_apprvd_byapproval","isempty",""], "AND",
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["custbody_stc_expense_report_type", "anyof", "2", "3"], "AND", 
                ["mainline", "is", "T"], "AND", 
                ["nextapprover", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'expensereport', 'nextapprover');

        runHeaderSearch(search.create({
            type: "invoice",
            filters: [
                ["type", "anyof", "CustInvc"], "AND", 
                ["trandate", "within", dateFrom, dateTo], "AND", 
                ["nextapprover", "anyof", approverId], "AND",
                ["mainline", "is", "T"]
            ],
            columns: ["internalid"]
        }), 'invoice', 'nextapprover');
        

        // --- Time Bill ---
        runHeaderSearch(search.create({
            type: "timebill",
            filters: [
                ["date", "within", dateFrom, dateTo], "AND", 
                ["nextapprover", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'timebill', 'nextapprover');

        // --- Journal Entry (Kondisional - Ditambahkan 9) ---
        runHeaderSearch(search.create({
            type: "journalentry",
            filters: [
                ["type", "anyof", "Journal"], "AND", 
                ["mainline", "is", "T"], "AND", 
                ["nextapprover", "anyof", approverId], "AND",
                ["trandate", "within", dateFrom, dateTo]
            ],
            columns: ["internalid"]
        }), 'journalentry', 'nextapprover');
         runHeaderSearch(search.create({
                type: "vendorpayment",
                filters: [
                    ["type", "anyof", "VendPymt"], "AND",
                    ["trandate", "within", dateFrom, dateTo], "AND", 
                    ["nextapprover", "anyof", approverId], "AND",
                    ["mainline", "is", "T"]
                ],
                columns: ["internalid"]
            }), 'vendorpayment', 'nextapprover');
       

        // --- Custom Records (TOR, TER, TAR) ---
        runHeaderSearch(search.create({
            type: "customrecord_tor",
            filters: [
                ["custrecord_tor_date", "within", dateFrom, dateTo], "AND", 
                ["custrecord_tor_last_approve_line_mng","isempty",""], "AND",
                ["custrecord_tor_next_approver", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'customrecord_tor', 'custrecord_tor_next_approver', true);

        runHeaderSearch(search.create({
            type: "customrecord_ter",
            filters: [
                ["custrecord_ter_date", "within", dateFrom, dateTo], "AND", 
                ["custrecord_ter_last_apprv_mngr","isempty",""], "AND",
                ["custrecord_ter_next_approver", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'customrecord_ter', 'custrecord_ter_next_approver', true);

        runHeaderSearch(search.create({
            type: "customrecord_tar",
            filters: [
                ["custrecord_tar_date", "within", dateFrom, dateTo], "AND", 
                ["custrecord_tar_last_apprv_mngr","isempty",""], "AND",
                ["custrecord_tar_next_approver", "anyof", approverId]
            ],
            columns: ["internalid"]
        }), 'customrecord_tar', 'custrecord_tar_next_approver', true);

        return results;
    };

    const map = (context) => {
        const data = JSON.parse(context.value);
        log.debug('data', data)
        const scriptObj = runtime.getCurrentScript();
        const targetApproverId = scriptObj.getParameter({ name: 'custscript_data_id' });
        const delegationApproval = scriptObj.getParameter({ name: 'custscript_data_approval' });
        

        try {
            // =====================================================================
            // LOGIKA BARU: Update Field Level HEADER (nextapprover dsb)
            // =====================================================================
            if (data.isHeaderUpdate) {
                const rec = record.load({ type: data.type, id: data.id, isDynamic: true });
                rec.setValue({ fieldId: data.headerField, value: delegationApproval });
                rec.save();
                
                log.audit('Success Header Update', `Updated Header ${data.type} ID: ${data.id} - Field: ${data.headerField}`);
            
            // =====================================================================
            // LOGIKA LAMA: Update Field Level SUBLIST / Line
            // =====================================================================
            } else if (data.isCustomRecord) {
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
                log.debug('line execute', delegationApproval)
                if (!data.id || !transactionType) return;

                const rec = record.load({ type: transactionType, id: data.id, isDynamic: true });
                const sublists = ['item', 'expense'];
                let isChanged = false;
                
                sublists.forEach(sublistId => {
                    // Cek apakah record memiliki sublist ini (karena misal vendorbill punya keduanya, PR bisa cuma item)
                    const lineCount = rec.getLineCount({ sublistId });
                    if (lineCount > 0) {
                        for (let i = 0; i < lineCount; i++) {
                            let valLineTrx = rec.getSublistValue({ sublistId, fieldId: 'custcol_stc_approver_linetrx', line: i });
                            let valFA = rec.getSublistValue({ sublistId, fieldId: 'custcol_stc_approver_fa', line: i });
                            log.debug('valFA', valFA)
                            log.debug('targetApproverId', targetApproverId)
                            log.debug('delegationApproval', delegationApproval)
                            log.debug('valLineTrx', valLineTrx)
                            if (valLineTrx == targetApproverId || valFA == targetApproverId) {
                                log.debug('masuk kondisi')
                                rec.selectLine({ sublistId, line: i });
                                if (valLineTrx == targetApproverId) rec.setCurrentSublistValue({ sublistId, fieldId: 'custcol_stc_approver_linetrx', value: delegationApproval });
                                if (valFA == targetApproverId) rec.setCurrentSublistValue({ sublistId, fieldId: 'custcol_stc_approver_fa', value: delegationApproval });
                                rec.commitLine({ sublistId });
                                isChanged = true;
                            }
                        }
                    }
                });
                log.debug('isChanged', isChanged)
                if (isChanged) {
                    log.debug('masuk save')
                    rec.save();
                    log.debug('Success Transaction', `Updated Line ${transactionType} ID: ${data.id}`);
                }
            }
        } catch (e) {
            log.error('Error in Map Stage', `Type: ${data.type} ID: ${data.id} - Msg: ${e.message}`);
        }
    };

    const summarize = (summary) => {
        log.audit('Process Finished', `Total Records Mapped: ${summary.inputSummary.trandate}. Check execution logs for errors.`);
        
        // Log Error jika ada pada stage map
        summary.mapSummary.errors.iterator().each((key, error, executionNo) => {
            log.error(`Map Error for key: ${key}`, error);
            return true;
        });
    };

    return { getInputData, map, summarize };
});