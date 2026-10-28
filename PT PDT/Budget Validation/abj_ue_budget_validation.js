/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/query', 'N/format', 'N/runtime'], 
function(record, search, query, format, runtime) {

    const transactionConfig = {
        'purchaserequisition': [
            { sublistId: 'item', amountField: 'estimatedamount', accountSource: 'item', accountField: 'item', periodSource: 'trandate' }
        ],
        'purchaseorder': [
            { sublistId: 'item', amountField: 'grossamt', accountSource: 'item', accountField: 'item', periodSource: 'trandate' }
        ],
        'vendorbill': [
            { sublistId: 'item', amountField: 'grossamt', accountSource: 'item', accountField: 'item', periodSource: 'postingperiod' },
            { sublistId: 'expense', amountField: 'grossamt', accountSource: 'line', accountField: 'account', periodSource: 'postingperiod' }
        ],
        'expensereport': [
            { sublistId: 'expense', amountField: 'amount', accountSource: 'line', accountField: 'expenseaccount', periodSource: 'postingperiod' }
        ],
        'check': [
            { sublistId: 'item', amountField: 'grossamt', accountSource: 'item', accountField: 'item', periodSource: 'postingperiod' },
            { sublistId: 'expense', amountField: 'grossamt', accountSource: 'line', accountField: 'account', periodSource: 'postingperiod' }
        ]
    };

    function afterSubmit(context) {
        const allowedContexts = [
            context.UserEventType.CREATE,
            context.UserEventType.EDIT,
            context.UserEventType.COPY,
            context.UserEventType.PAYBILLS // vendorbill specific
        ];

        if (!allowedContexts.includes(context.type)) return;

        try {
            const currentRecord = context.newRecord;
            const recType = currentRecord.type;
            const configRules = transactionConfig[recType];

            if (!configRules) return;

            log.debug('Starting Validation', `Type: ${recType}, ID: ${currentRecord.id}`);

            // 1. Get Control Record Messages
            const controlRec = record.load({ type: 'customrecord_bm_budget_control', id: 1 });
            const warnLineMsg = controlRec.getValue('custrecord_bm_warn_line');
            const warnHeadMsg = controlRec.getValue('custrecord_bm_budget_head_msg');

            // 2. Load Transaction Record
            const rec = record.load({ type: recType, id: currentRecord.id, isDynamic: false });
            const subsidiaryId = rec.getValue('subsidiary');
            const headerPeriod = rec.getValue('postingperiod');
            const tranDate = rec.getValue('trandate');
            let trandatePeriod = null;

            // 3. Pre-fetch Accounts for Items (Bulk Search to save Governance)
            let itemIds = [];
            configRules.forEach(rule => {
                if (rule.accountSource === 'item') {
                    const lineCount = rec.getLineCount({ sublistId: rule.sublistId });
                    for (let i = 0; i < lineCount; i++) {
                        const itemId = rec.getSublistValue({ sublistId: rule.sublistId, fieldId: rule.accountField, line: i });
                        if (itemId && !itemIds.includes(itemId)) itemIds.push(itemId);
                    }
                }
                if (rule.periodSource === 'trandate' && !trandatePeriod) {
                    trandatePeriod = getPeriodByDate(tranDate);
                }
            });

            const itemAccountMap = itemIds.length > 0 ? getBulkItemAccounts(itemIds) : {};
            let hasWarning = false;

            // 4. Process Lines
            configRules.forEach(rule => {
                const lineCount = rec.getLineCount({ sublistId: rule.sublistId });

                for (let i = 0; i < lineCount; i++) {
                    let amountCompare = parseFloat(rec.getSublistValue({ sublistId: rule.sublistId, fieldId: rule.amountField, line: i })) || 0;
                    
                    // Fallback jika grossamt tidak ada di sublist tertentu
                    if (amountCompare === 0 && rule.amountField === 'grossamt') {
                        amountCompare = parseFloat(rec.getSublistValue({ sublistId: rule.sublistId, fieldId: 'amount', line: i })) || 0;
                    }

                    const accountId = rule.accountSource === 'item' 
                        ? itemAccountMap[rec.getSublistValue({ sublistId: rule.sublistId, fieldId: rule.accountField, line: i })]
                        : rec.getSublistValue({ sublistId: rule.sublistId, fieldId: rule.accountField, line: i });

                    const periodId = rule.periodSource === 'trandate' ? trandatePeriod : headerPeriod;
                    const departmentId = rec.getSublistValue({ sublistId: rule.sublistId, fieldId: 'department', line: i });
                    const classId = rec.getSublistValue({ sublistId: rule.sublistId, fieldId: 'class', line: i });

                    if (!accountId || !periodId || !subsidiaryId) {
                        log.debug('Skip Line', `Line ${i} missing parameter. Acc: ${accountId}, Per: ${periodId}, Sub: ${subsidiaryId}`);
                        continue;
                    }

                    const budgetData = getBudgetConsumption({
                        postingPeriod: periodId,
                        subsidiary: subsidiaryId,
                        account: accountId,
                        department: departmentId,
                        classId: classId
                    });

                    rec.setSublistValue({ sublistId: rule.sublistId, fieldId: 'custcol_abj_consume_amount', line: i, value: budgetData.consumeAmount });
                    rec.setSublistValue({ sublistId: rule.sublistId, fieldId: 'custcol_abj_remaining_amount', line: i, value: budgetData.remainingAmount });
                    rec.setSublistValue({ sublistId: rule.sublistId, fieldId: 'custcol_abj_budget_amount', line: i, value: budgetData.budgetAmount });

                    if (amountCompare > budgetData.remainingAmount) {
                        rec.setSublistValue({ sublistId: rule.sublistId, fieldId: 'custcol_abj_budget_warning', line: i, value: warnLineMsg });
                        hasWarning = true;
                    } else {
                        rec.setSublistValue({ sublistId: rule.sublistId, fieldId: 'custcol_abj_budget_warning', line: i, value: '' });
                    }
                }
            });

            // 5. Update Header Warning
            var dateCek = new Date();
            log.debug('dateCek', dateCek)
            rec.setValue({ fieldId: 'custbody_abj_budget_warning_header', value: hasWarning ? warnHeadMsg : '' });
            rec.setValue({ fieldId: 'custbody_abj_last_budget_check', value : new Date()})
            // 6. Save Record
            rec.save({ enableSourcing: false, ignoreMandatoryFields: true });
            log.debug('Process Complete', `Record saved with warning state: ${hasWarning}`);

        } catch (e) {
            log.debug('Error in afterSubmit', e.message);
        }
    }

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    function getBulkItemAccounts(itemIds) {
        const accountMap = {};
        const itemSearch = search.create({
            type: search.Type.ITEM,
            filters: [['internalid', 'anyof', itemIds]],
            columns: [
                'type',
                search.createColumn({
                    name: "formulatext",
                    formula: "CASE WHEN {type} = 'Inventory Item' THEN {assetaccount.id} ELSE {expenseaccount.id} END"
                })
            ]
        });

        itemSearch.run().each(res => {
            const accId = res.getValue(itemSearch.columns[1]);
            if (accId) accountMap[res.id] = accId;
            return true;
        });

        return accountMap;
    }

    function getPeriodByDate(dateObj) {
        if (!dateObj) return null;
        
        const dateStr = format.format({ value: dateObj, type: format.Type.DATE });
        const periodSearch = search.create({
            type: search.Type.ACCOUNTING_PERIOD,
            filters: [
                ['startdate', 'onorbefore', dateStr], 'AND',
                ['enddate', 'onorafter', dateStr], 'AND',
                ['isadjust', 'is', 'F'], 'AND',
                ['isquarter', 'is', 'F'], 'AND',
                ['isyear', 'is', 'F']
            ],
            columns: ['internalid']
        });

        let periodId = null;
        periodSearch.run().each(res => { 
            periodId = res.id; 
            return false; 
        });

        return periodId;
    }

    function getBudgetConsumption(options) {
        const { postingPeriod, subsidiary, account, department, classId } = options;

        let amtPO = 0, amtActual = 0, amtPR = 0, budgetAmount = 0;

        // 1. GET TRANSACTION AMOUNT (PO & ACTUAL)
        let trxFilters = [
            ["status", "noneof", "PurchOrd:A", "PurchReq:A", "PurchOrd:C", "PurchReq:C", "PurchReq:E", "PurchOrd:H", "PurchOrd:P", "PurchReq:H", "PurchReq:R"],
            "AND", ["mainline", "is", "F"],
            "AND", ["postingperiod", "anyof", postingPeriod],
            "AND", ["subsidiary", "anyof", subsidiary],
            "AND", ["account", "anyof", account]
        ];
        
        if (department) trxFilters.push("AND", ["department", "anyof", department]);
        if (classId) trxFilters.push("AND", ["class", "anyof", classId]);

        const trxSearch = search.create({
            type: "transaction",
            filters: trxFilters,
            columns: [
                search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "CASE WHEN {recordType}='purchaseorder' THEN {amount} ELSE 0 END" }),
                search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "CASE WHEN {posting} = 'T' THEN {amount} ELSE 0 END" })
            ]
        });
        
        trxSearch.run().each(result => {
            amtPO = parseFloat(result.getValue(trxSearch.columns[0])) || 0;
            amtActual = parseFloat(result.getValue(trxSearch.columns[1])) || 0;
            return true;
        });

        // 2. GET PR AMOUNT
        let prFilters = [
            ["status", "noneof", "PurchReq:A", "PurchReq:C", "PurchReq:E", "PurchReq:H", "PurchReq:R"],
            "AND", ["mainline", "is", "F"],
            "AND", ["postingperiod", "anyof", postingPeriod],
            "AND", ["subsidiary", "anyof", subsidiary],
            "AND", ["account", "anyof", account]
        ];

        if (department) prFilters.push("AND", ["department", "anyof", department]);
        if (classId) prFilters.push("AND", ["class", "anyof", classId]);

        const prSearch = search.create({
            type: "purchaserequisition",
            filters: prFilters,
            columns: [
                search.createColumn({ name: "amount", join: "applyingTransaction", summary: "SUM" }),
                search.createColumn({ name: "estimatedamount", summary: "MAX" })
            ]
        });

        prSearch.run().each(result => {
            const amtPOinPR = parseFloat(result.getValue(prSearch.columns[0])) || 0;
            const estAmt = parseFloat(result.getValue(prSearch.columns[1])) || 0;
            amtPR += (estAmt - amtPOinPR);
            return true;
        });

        // 3. GET BUDGET AMOUNT (SUITEQL)
        const periodLookup = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: postingPeriod,
            columns: ['periodname']
        });
        
        if (periodLookup && periodLookup.periodname) {
            const periodName = periodLookup.periodname; 
            const monthArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthText = periodName.split(' ')[0];
            const yearText = periodName.split(' ')[1];
            const monthIdx = monthArr.indexOf(monthText) + 1; 
            
            let yearId = null;
            search.create({
                type: search.Type.ACCOUNTING_PERIOD,
                filters: [
                    ["isyear", "is", "T"], "AND",
                    ["periodname", "is", "FY " + yearText]
                ],
                columns: ['internalid']
            }).run().each(res => { yearId = res.id; return false; });

            if (yearId) {
                let sql = `SELECT periodamount${monthIdx} as budgamt FROM budgetimport WHERE account = ${account} AND subsidiary = ${subsidiary} AND year = ${yearId}`;
                sql += department ? ` AND department = ${department}` : ` AND department IS NULL`;
                sql += classId ? ` AND class = ${classId}` : ` AND class IS NULL`;

                const queryResults = query.runSuiteQL({ query: sql }).asMappedResults();
                if (queryResults && queryResults.length > 0) {
                    budgetAmount = parseFloat(queryResults[0].budgamt) || 0;
                }
            }
        }

        // 4. KALKULASI FINAL
        const consumeAmount = amtPR + amtPO + amtActual;
        const remainingAmount = budgetAmount - consumeAmount;

        return { budgetAmount, consumeAmount, remainingAmount };
    }

    return { afterSubmit: afterSubmit };
});