/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/format', 'N/url', 'N/runtime', 'N/file', 'N/encode'], 
(serverWidget, search, log, format, url, runtime, file, encode) => {
    
    const fetchAllPagedResults = (searchObj, callback) => {
        const pagedData = searchObj.runPaged({ pageSize: 1000 });
        for (let i = 0; i < pagedData.pageRanges.length; i++) {
            const page = pagedData.fetch({ index: i });
            page.data.forEach((result) => {
                callback(result);
            });
        }
    };

    const onRequest = (context) => {
        const request = context.request;
        const response = context.response;

        const isExport = request.parameters.action === 'export';
        const isPost = request.method === 'POST';

        try {
            // 1. TANGKAP PARAMETER
            let isAllSof, sofValues, isAllStatus, statusValues, dateFrom, dateTo;

            if (isExport) {
                isAllSof = request.parameters.sofAll === 'T';
                let rawSof = request.parameters.sofMulti || '';
                sofValues = rawSof.split('|').filter(v => v.trim() !== '');

                isAllStatus = request.parameters.statusAll === 'T';
                let rawStatus = request.parameters.statusMulti || '';
                statusValues = rawStatus.split('|').filter(v => v.trim() !== '');

                dateFrom = request.parameters.dateFrom || null;
                dateTo = request.parameters.dateTo || null;
            } else {
                isAllSof = request.parameters.custpage_sof_all === 'T';
                let rawSof = request.parameters.custpage_sof_multi || '';
                sofValues = rawSof.split('\u0005').filter(v => v.trim() !== '');

                isAllStatus = request.parameters.custpage_status_all === 'T';
                let rawStatus = request.parameters.custpage_status_multi || '';
                statusValues = rawStatus.split('\u0005').filter(v => v.trim() !== '');

                dateFrom = request.parameters.custpage_date_from || null;
                dateTo = request.parameters.custpage_date_to || null;
            }

            // 2. AMBIL DATA
            let reportDataMap = {}; 
            
            if (isPost || isExport) {
                let tranDateFilter = [];
                let budgetDateFilter = [];

                if (dateFrom && dateTo) {
                    tranDateFilter = ["AND", ["trandate", "within", dateFrom, dateTo]];
                    budgetDateFilter = ["AND", ["amountdate", "within", dateFrom, dateTo]];
                } else if (dateFrom) {
                    tranDateFilter = ["AND", ["trandate", "onorafter", dateFrom]];
                    budgetDateFilter = ["AND", ["amountdate", "onorafter", dateFrom]];
                } else if (dateTo) {
                    tranDateFilter = ["AND", ["trandate", "onorbefore", dateTo]];
                    budgetDateFilter = ["AND", ["amountdate", "onorbefore", dateTo]];
                }

                let sofFilters = [];
                if (!isAllStatus && statusValues.length > 0) sofFilters.push(["custrecord7", "anyof", statusValues]);
                if (!isAllSof && sofValues.length > 0) {
                    if(sofFilters.length > 0) sofFilters.push("AND");
                    sofFilters.push(["internalid", "anyof", sofValues]);
                }

                const sofSearchObj = search.create({ type: "customrecord_cseg_stc_sof", filters: sofFilters.length > 0 ? sofFilters : [], columns: ["internalid", "name"] });
                fetchAllPagedResults(sofSearchObj, (result) => {
                    let sofId = result.getValue({ name: "internalid" });
                    reportDataMap[sofId] = { name: result.getValue({ name: "name" }), budgetEac: 0, actual: 0, revenue: 0, funding: 0 };
                });

                let budgetFilters = [["amounttype", "anyof", "Cost"], "AND", ["estimateatcompletion", "is", "T"]];
                if (budgetDateFilter.length > 0) budgetFilters = budgetFilters.concat(budgetDateFilter);
                const projectbudgetSearchObj = search.create({ type: "projectbudget", filters: budgetFilters, columns: [ search.createColumn({ name: "cseg_stc_sof", summary: "GROUP" }), search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "{eac}*{job.fxrate}" }) ] });
                fetchAllPagedResults(projectbudgetSearchObj, (result) => {
                    let sofId = result.getValue({ name: "cseg_stc_sof", summary: "GROUP" });
                    if (reportDataMap[sofId]) reportDataMap[sofId].budgetEac += parseFloat(result.getValue({ name: "formulacurrency", summary: "SUM" })) || 0;
                });

                let actualFilters = [ ["type", "noneof", "PurchOrd", "SalesOrd", "Custom113", "Opprtnty", "PurchReq", "Custom111"], "AND", ["taxline", "is", "F"], "AND", ["voided", "is", "F"], "AND", ["mainline", "any", ""], "AND", ["accounttype", "anyof", "OthExpense", "Expense"], "AND", ["posting", "is", "T"]];
                if (tranDateFilter.length > 0) actualFilters = actualFilters.concat(tranDateFilter);
                const actualSearchObj = search.create({ type: "transaction", filters: actualFilters, columns: [ search.createColumn({ name: "line.cseg_stc_sof", summary: "GROUP" }), search.createColumn({ name: "amount", summary: "SUM" }) ] });
                fetchAllPagedResults(actualSearchObj, (result) => {
                    let sofId = result.getValue({ name: "line.cseg_stc_sof", summary: "GROUP" });
                    if (reportDataMap[sofId]) reportDataMap[sofId].actual += parseFloat(result.getValue({ name: "amount", summary: "SUM" })) || 0;
                });

                let revenueFilters = [ ["mainline", "any", ""], "AND", ["type", "noneof", "PurchOrd", "SalesOrd", "Custom113", "Opprtnty", "PurchReq", "Custom111"], "AND", ["taxline", "is", "F"], "AND", ["voided", "is", "F"], "AND", ["line.cseg_stc_sof", "anyof", "@ALL@"], "AND", ["account", "anyof", "54", "285"] ];
                if (tranDateFilter.length > 0) revenueFilters = revenueFilters.concat(tranDateFilter);
                const revenueSearchObj = search.create({ type: "transaction", filters: revenueFilters, columns: [ search.createColumn({ name: "line.cseg_stc_sof", summary: "GROUP" }), search.createColumn({ name: "creditamount", summary: "SUM" }) ] });
                fetchAllPagedResults(revenueSearchObj, (result) => {
                    let sofId = result.getValue({ name: "line.cseg_stc_sof", summary: "GROUP" });
                    if (reportDataMap[sofId]) reportDataMap[sofId].revenue += parseFloat(result.getValue({ name: "creditamount", summary: "SUM" })) || 0;
                });

                let fundingFilters = [ ["mainline", "any", ""], "AND", ["type", "noneof", "PurchOrd", "SalesOrd", "Custom113", "Opprtnty", "PurchReq", "Custom111"], "AND", ["taxline", "is", "F"], "AND", ["voided", "is", "F"], "AND", ["line.cseg_stc_sof", "anyof", "@ALL@"], "AND", ["approvalstatus", "anyof", "2"], "AND", ["account", "anyof", "272", "709"] ];
                if (tranDateFilter.length > 0) fundingFilters = fundingFilters.concat(tranDateFilter);
                const fundingSearchObj = search.create({ type: "transaction", filters: fundingFilters, columns: [ search.createColumn({ name: "line.cseg_stc_sof", summary: "GROUP" }), search.createColumn({ name: "creditamount", summary: "SUM" }) ] });
                fetchAllPagedResults(fundingSearchObj, (result) => {
                    let sofId = result.getValue({ name: "line.cseg_stc_sof", summary: "GROUP" });
                    if (reportDataMap[sofId]) reportDataMap[sofId].funding += parseFloat(result.getValue({ name: "creditamount", summary: "SUM" })) || 0;
                });
            }

            // ==========================================
            // 3. LOGIKA EXPORT MENGGUNAKAN N/file NATIVE
            // ==========================================
            if (isExport) {
                // PERHATIKAN: mso-number-format ditambahkan di style CSS di bawah ini
                let excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        .title { font-size: 16pt; font-weight: bold; text-align: center; }
                        .header { font-weight: bold; font-size: 12pt; background-color: #f2f2f2; border: 1pt solid black; text-align: center; }
                        .cell { border: 1pt solid black; }
                        /* Format MSO ini mencegah angka besar menjadi scientific & memberikan separator titik/koma ribuan */
                        .cell-number { border: 1pt solid black; text-align: right; mso-number-format: "\\#\\,\\#\\#0\\.00"; }
                    </style>
                </head>
                <body>
                    <table>
                        <tr><td colspan="8" class="title">Report Summary BVA</td></tr>
                        <tr>
                            <td class="header">Award/SOF</td>
                            <td class="header">Budget EAC</td>
                            <td class="header">Actual</td>
                            <td class="header">Remaining Budget</td>
                            <td class="header">Revenue</td>
                            <td class="header">Remaining Revenue</td>
                            <td class="header">Funding</td>
                            <td class="header">Remaining Funding</td>
                        </tr>`;

                for (let sofId in reportDataMap) {
                    let data = reportDataMap[sofId];
                    let remBudget = data.budgetEac - data.actual;
                    let remRevenue = data.revenue - data.actual;
                    let remFunding = data.funding - data.actual;
                    
                    let safeName = data.name ? String(data.name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '-';

                    excelHtml += `<tr>
                        <td class="cell">${safeName}</td>
                        <td class="cell-number">${data.budgetEac}</td>
                        <td class="cell-number">${data.actual}</td>
                        <td class="cell-number">${remBudget}</td>
                        <td class="cell-number">${data.revenue}</td>
                        <td class="cell-number">${remRevenue}</td>
                        <td class="cell-number">${data.funding}</td>
                        <td class="cell-number">${remFunding}</td>
                    </tr>`;
                }
                excelHtml += `</table></body></html>`;

                let base64EncodedHtml = encode.convert({
                    string: excelHtml,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64
                });

                let xlsFile = file.create({
                    name: 'Report_Summary_BVA.xls',
                    fileType: file.Type.EXCEL,
                    contents: base64EncodedHtml
                });

                response.writeFile({
                    file: xlsFile,
                    isInline: false
                });

                return; 
            }

            // 4. RENDER UI PAGE
            const form = serverWidget.createForm({ title: 'Report Summary BVA' });
            form.clientScriptModulePath = 'SuiteScripts/abj_cs_report_summary_bva.js'; 

            const scriptObj = runtime.getCurrentScript();
            const baseUrl = url.resolveScript({
                scriptId: scriptObj.id,
                deploymentId: scriptObj.deploymentId,
                returnExternalUrl: false
            });
            const urlField = form.addField({ id: 'custpage_base_url', type: serverWidget.FieldType.TEXT, label: 'Base URL' });
            urlField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            urlField.defaultValue = baseUrl;

            form.addFieldGroup({ id: 'filtergroup', label: 'Report Filters' });
            
            let sofAllField = form.addField({ id: 'custpage_sof_all', type: serverWidget.FieldType.CHECKBOX, label: 'Select All SOF', container: 'filtergroup' });
            let sofMultiField = form.addField({ id: 'custpage_sof_multi', type: serverWidget.FieldType.MULTISELECT, label: 'SOF', source: 'customrecord_cseg_stc_sof', container: 'filtergroup' });
            
            let statusAllField = form.addField({ id: 'custpage_status_all', type: serverWidget.FieldType.CHECKBOX, label: 'Select All Status', container: 'filtergroup' });
            let statusMultiField = form.addField({ id: 'custpage_status_multi', type: serverWidget.FieldType.MULTISELECT, label: 'Status', source: 'customliststc_sof_status', container: 'filtergroup' });
            
            form.addField({ id: 'custpage_date_from', type: serverWidget.FieldType.DATE, label: 'Date From', container: 'filtergroup' });
            form.addField({ id: 'custpage_date_to', type: serverWidget.FieldType.DATE, label: 'Date To', container: 'filtergroup' });

            if (isPost) {
                sofAllField.defaultValue = isAllSof ? 'T' : 'F';
                sofMultiField.isDisabled = isAllSof;
                if (!isAllSof && request.parameters.custpage_sof_multi) sofMultiField.defaultValue = request.parameters.custpage_sof_multi;
                
                statusAllField.defaultValue = isAllStatus ? 'T' : 'F';
                statusMultiField.isDisabled = isAllStatus;
                if (!isAllStatus && request.parameters.custpage_status_multi) statusMultiField.defaultValue = request.parameters.custpage_status_multi;
                
                if (dateFrom) form.getField({id: 'custpage_date_from'}).defaultValue = dateFrom;
                if (dateTo) form.getField({id: 'custpage_date_to'}).defaultValue = dateTo;
            } else {
                sofAllField.defaultValue = 'F';
                statusAllField.defaultValue = 'F';
            }

            form.addSubmitButton({ label: 'Generate Report' });

            if (isPost) {
                form.addButton({
                    id: 'custpage_btn_export',
                    label: 'Download Excel',
                    functionName: 'downloadExcel'
                });

                const sublist = form.addSublist({ id: 'custpage_report_list', type: serverWidget.SublistType.LIST, label: 'Report Results' });
                sublist.addField({ id: 'col_sof', type: serverWidget.FieldType.TEXT, label: 'Award/SOF' });
                sublist.addField({ id: 'col_budget_eac', type: serverWidget.FieldType.CURRENCY, label: 'Budget EAC' });
                sublist.addField({ id: 'col_actual', type: serverWidget.FieldType.CURRENCY, label: 'Actual' });
                sublist.addField({ id: 'col_rem_budget', type: serverWidget.FieldType.CURRENCY, label: 'Remaining Budget' });
                sublist.addField({ id: 'col_revenue', type: serverWidget.FieldType.CURRENCY, label: 'Revenue' });
                sublist.addField({ id: 'col_rem_rev', type: serverWidget.FieldType.CURRENCY, label: 'Remaining Revenue' });
                sublist.addField({ id: 'col_funding', type: serverWidget.FieldType.CURRENCY, label: 'Funding' });
                sublist.addField({ id: 'col_rem_fund', type: serverWidget.FieldType.CURRENCY, label: 'Remaining Funding' });

                let lineNum = 0;
                for (let sofId in reportDataMap) {
                    let data = reportDataMap[sofId];
                    sublist.setSublistValue({ id: 'col_sof', line: lineNum, value: data.name || '-' });
                    sublist.setSublistValue({ id: 'col_budget_eac', line: lineNum, value: data.budgetEac });
                    sublist.setSublistValue({ id: 'col_actual', line: lineNum, value: data.actual });
                    sublist.setSublistValue({ id: 'col_rem_budget', line: lineNum, value: data.budgetEac - data.actual });
                    sublist.setSublistValue({ id: 'col_revenue', line: lineNum, value: data.revenue });
                    sublist.setSublistValue({ id: 'col_rem_rev', line: lineNum, value: data.revenue - data.actual });
                    sublist.setSublistValue({ id: 'col_funding', line: lineNum, value: data.funding });
                    sublist.setSublistValue({ id: 'col_rem_fund', line: lineNum, value: data.funding - data.actual });
                    lineNum++;
                }
            }

            response.writePage(form);
            
        } catch (e) {
            log.error('SUITELET_ERROR', e);
            response.write({ output: '<h3>Terjadi Kesalahan pada Script:</h3><p>' + e.message + '</p>' });
        }
    };

    return { onRequest };
});