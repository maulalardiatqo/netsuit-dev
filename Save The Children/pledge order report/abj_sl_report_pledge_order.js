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
            sublist.addField({ id: 'col_po', type: serverWidget.FieldType.TEXT, label: 'Pledge Order' });
            sublist.addField({ id: 'col_amt_po', type: serverWidget.FieldType.CURRENCY, label: 'Amount Pledge Order' });
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

            // 5. Isi Data ke Sublist
            pagedData.forEach((row, index) => {
                sublist.setSublistValue({ id: 'col_sof', line: index, value: row.sof || ' ' });
                sublist.setSublistValue({ id: 'col_po', line: index, value: row.po || ' ' });
                sublist.setSublistValue({ id: 'col_amt_po', line: index, value: row.amtPo.toString() });
                sublist.setSublistValue({ id: 'col_invoice', line: index, value: row.invoice.toString() });
                sublist.setSublistValue({ id: 'col_receipt', line: index, value: row.receipt.toString() });
                sublist.setSublistValue({ id: 'col_spending', line: index, value: row.spending.toString() });
                sublist.setSublistValue({ id: 'col_percent', line: index, value: row.percent || '0%' });
            });

            response.writePage(form);
        }
    };

    /**
     * Fungsi untuk menggabungkan data dari berbagai Saved Search
     */
    const fetchDataFromSearches = () => {
        let combinedResults = [];

        for (let i = 1; i <= 120; i++) {
            combinedResults.push({
                sof: 'Sof' + i,
                po: 'PO-322' + i,
                amtPo: 100000,
                invoice: 100000,
                receipt: 50000,
                spending: 50000,
                percent: '100%'
            });
        }

        return combinedResults;
    };

    return { onRequest };
});