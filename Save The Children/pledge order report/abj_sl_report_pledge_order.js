/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/url'], (serverWidget, search, url) => {

    const PAGE_SIZE = 50;

    const onRequest = (scriptContext) => {
        const { request, response } = scriptContext;
        
        let pageId = parseInt(request.parameters.page) || 0;

        if (request.method === 'GET') {
            const form = serverWidget.createForm({ title: 'Report Remaining Amount' });
            
            const sublist = form.addSublist({
                id: 'custpage_report_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Data Pledge Orders'
            });

            sublist.addField({ id: 'col_sof', type: serverWidget.FieldType.TEXT, label: 'SOF' });
            sublist.addField({ id: 'col_amt_po', type: serverWidget.FieldType.CURRENCY, label: 'Pledge Order' });
            sublist.addField({ id: 'col_invoice', type: serverWidget.FieldType.CURRENCY, label: 'Invoice' });
            sublist.addField({ id: 'col_receipt', type: serverWidget.FieldType.CURRENCY, label: 'Receipt Payment' });
            sublist.addField({ id: 'col_spending', type: serverWidget.FieldType.CURRENCY, label: 'Sepending Amount' });
            sublist.addField({ id: 'col_percent', type: serverWidget.FieldType.TEXT, label: 'Prosent' });

            let allData = fetchDataFromSearches();

            let totalRecords = allData.length;
            let pageCount = Math.ceil(totalRecords / PAGE_SIZE);
            let start = pageId * PAGE_SIZE;
            let end = start + PAGE_SIZE;
            let pagedData = allData.slice(start, end);

            if (pageCount > 1) {
                const selectPage = form.addField({
                    id: 'custpage_select_page',
                    label: 'Select Page',
                    type: serverWidget.FieldType.SELECT
                });
                for (let i = 0; i < pageCount; i++) {
                    selectPage.addSelectOption({
                        value: i,
                        text: `Page ${(i + 1)} of ${pageCount}`,
                        isSelected: pageId === i
                    });
                }
                form.clientScriptModulePath = 'SuiteScripts/abj_cs_pagination_po.js'; 
            }

            pagedData.forEach((row, index) => {
                sublist.setSublistValue({ id: 'col_sof', line: index, value: row.sof || ' ' });
                sublist.setSublistValue({ id: 'col_amt_po', line: index, value: row.amtPo.toString() });
                sublist.setSublistValue({ id: 'col_invoice', line: index, value: row.invoice.toString() });
                sublist.setSublistValue({ id: 'col_receipt', line: index, value: row.receipt.toString() });
                sublist.setSublistValue({ id: 'col_spending', line: index, value: row.spending.toString() });
                sublist.setSublistValue({ id: 'col_percent', line: index, value: row.percent || '0%' });
            });

            response.writePage(form);
        }
    };
    const fetchDataFromSearches = () => {
        let dataMap = {};

        const search1 = search.create({
            type: "transaction",
            filters: [["type","anyof","SalesOrd","CustInvc"], "AND", ["mainline","is","T"]],
            columns: [
                search.createColumn({ name: "altname", join: "jobMain", summary: "GROUP" }),
                search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "SUM(NVL(CASE WHEN {recordType} = 'salesorder' THEN {amount} END, 0))" }),
                search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "SUM(NVL(CASE WHEN {recordType} = 'invoice' THEN {amount} END, 0))" })
            ]
        });

        search1.run().each(function(res) {
            let jobName = res.getValue({ name: "altname", join: "jobMain", summary: "GROUP" });
            if (jobName) {
                dataMap[jobName] = {
                    sof: jobName,
                    amtPo: parseFloat(res.getValue(res.columns[1])) || 0,
                    invoice: parseFloat(res.getValue(res.columns[2])) || 0,
                    receipt: 0, 
                    spending: 0, 
                    debit: 0,    
                    percent: '0%'
                };
            }
            return true;
        });

        const search2 = search.create({
            type: "transaction",
            filters: [["type","anyof","ExpRept","VendBill"], "AND", ["mainline","is","F"]],
            columns: [
                search.createColumn({ name: "altname", join: "job", summary: "GROUP" }),
                search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "SUM(NVL(CASE WHEN {recordType} IN ('vendbill','expensereport') THEN {amount} END, 0))" })
            ]
        });

        search2.run().each(function(res) {
            let jobName = res.getValue({ name: "altname", join: "job", summary: "GROUP" });
            if (dataMap[jobName]) {
                dataMap[jobName].spending = parseFloat(res.getValue(res.columns[1])) || 0;
            }
            return true;
        });

        const search3 = search.create({
            type: "journalentry",
            filters: [["type","anyof","Journal"], "AND", ["debitamount","greaterthan","0.00"]],
            columns: [
                search.createColumn({ name: "altname", join: "job", summary: "GROUP" }),
                search.createColumn({ name: "debitamount", summary: "SUM" })
            ]
        });

        search3.run().each(function(res) {
            let jobName = res.getValue({ name: "altname", join: "job", summary: "GROUP" });
            let debitAmt = parseFloat(res.getValue(res.columns[1])) || 0;
            
            if (dataMap[jobName]) {
                dataMap[jobName].receipt = debitAmt; 
                
                if (debitAmt > 0) {
                    let calcPercent = (dataMap[jobName].spending / debitAmt) * 100;
                    dataMap[jobName].percent = calcPercent.toFixed(2) + '%';
                } else {
                    dataMap[jobName].percent = '0%';
                }
            }
            return true;
        });

        return Object.keys(dataMap).map(key => dataMap[key]);
    };

    return { onRequest };
});