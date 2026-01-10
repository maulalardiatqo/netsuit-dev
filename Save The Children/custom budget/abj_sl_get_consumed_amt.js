/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/search"], (search) => {

    const getConsumedAmt = (account, department, estAmount, classId, sofId, periodId) => {
        var newAmount = 0
        var transactionSearchObj = search.create({
            type: "transaction",
            filters:
            [
                ["formulatext: {status}","doesnotcontain","reject"], 
                "AND", 
                ["accounttype","anyof","Expense","OthExpense","DeferExpense"],
                "AND", 
                ["status","noneof","PurchOrd:P","PurchOrd:A"], 
                "AND", 
                ["account","anyof", account], 
                "AND", 
                ["department","anyof",department], 
                "AND", 
                ["class","anyof",classId], 
                "AND", 
                ["line.cseg_stc_sof","anyof",sofId],
                "AND",
                ["postingperiod","abs",periodId]
            ],
            columns:
            [
                search.createColumn({
                    name: "account",
                    summary: "GROUP",
                    label: "Account"
                }),
                search.createColumn({
                    name: "department",
                    summary: "GROUP",
                    label: "Cost Center"
                }),
                search.createColumn({
                    name: "class",
                    summary: "GROUP",
                    label: "Project Code"
                }),
                search.createColumn({
                    name: "line.cseg_stc_sof",
                    summary: "GROUP",
                    label: "SOF"
                }),
                search.createColumn({
                    name: "custcol_stc_budget_amount",
                    summary: "MAX",
                    label: "STC - Budget Amount"
                }),
                search.createColumn({
                    name: "formulacurrency",
                    summary: "SUM",
                    formula: "((SUM(NVL(CASE WHEN {recordType}='purchaseorder' THEN {amount} END,0)) - SUM(NVL(CASE WHEN {recordType} = 'itemreceipt' THEN {amount} END,0)) - SUM(NVL(CASE WHEN {recordType}='purchaseorder' AND {status} = 'Closed' THEN {rate}*({quantity} - {quantitybilled}) END,0)))+(SUM(NVL(CASE WHEN {recordType}='purchaserequisition'  AND {status} NOT IN ('PurchReq:F', 'Fully Ordered')THEN {amount}     END, 0)))) + (SUM(NVL(CASE WHEN {posting} = 'T' THEN {amount} END,0)))",
                    label: "Formula (Currency)"
                })
            ]
            });
            var searchResults = transactionSearchObj.run().getRange({ start: 0, end: 1 });
            var amtFromSearch = 0
            log.debug('searchResults : '+searchResults.length, searchResults);
        if (searchResults.length > 0) {
            var amtSearch = searchResults[0].getValue({ 
                name: "formulacurrency",
                summary: "SUM",
                formula: "((SUM(NVL(CASE WHEN {recordType}='purchaseorder' THEN {amount} END,0)) - SUM(NVL(CASE WHEN {recordType} = 'itemreceipt' THEN {amount} END,0)) - SUM(NVL(CASE WHEN {recordType}='purchaseorder' AND {status} = 'Closed' THEN {rate}*({quantity} - {quantitybilled}) END,0)))+(SUM(NVL(CASE WHEN {recordType}='purchaserequisition'  AND {status} NOT IN ('PurchReq:F', 'Fully Ordered')THEN {amount}     END, 0)))) + (SUM(NVL(CASE WHEN {posting} = 'T' THEN {amount} END,0)))",
            });
            log.debug('amtSearch cek search', amtSearch)
            if(amtSearch){
                amtFromSearch = amtSearch
            }
        }
        newAmount = Number(amtFromSearch) + Number(estAmount)
        return newAmount;
    };

    const onRequest = (context) => {
        let params = context.request.parameters;
        var account = params.custscript_account_id;
        var department = params.custscript_department_id
        var classId = params.custscript_class_id
        var sofId = params.custscript_sof_id
        var periodId = params.custscript_period_id
        var estAmount = params.custscript_est_amt
        let newAmt = getConsumedAmt(account, department, estAmount, classId, sofId, periodId);
        log.debug('newAmt', newAmt);
        context.response.write(JSON.stringify({
            newAmt: newAmt || 0,
        }));
    };

    return { onRequest };
});
