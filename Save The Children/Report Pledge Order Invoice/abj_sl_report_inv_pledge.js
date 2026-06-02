/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/url', 'N/log', 'N/record'], (serverWidget, search, url, log, record) => {

    const PAGE_SIZE = 10; 

    const onRequest = (scriptContext) => {
        const { request, response } = scriptContext;
        let pageId = parseInt(request.parameters.page) || 0;

        if (request.method === 'GET') {
            const form = serverWidget.createForm({ title: 'Report Applying Invoice' });
            
            const sublist = form.addSublist({
                id: 'custpage_report_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Data Pledge Orders'
            });

            sublist.addField({ id: 'col_grant', type: serverWidget.FieldType.TEXT, label: 'Grant' });
            sublist.addField({ id: 'col_pledge_order', type: serverWidget.FieldType.TEXT, label: 'Pledge Order' }); 
            sublist.addField({ id: 'col_payment_sche', type: serverWidget.FieldType.TEXT, label: 'Billing Schedule' });
            sublist.addField({ id: 'col_total_amount', type: serverWidget.FieldType.CURRENCY, label: 'Total Amount' });
            
            for (let i = 1; i <= 4; i++) {
                sublist.addField({ id: `col_inv_${i}`, type: serverWidget.FieldType.CURRENCY, label: `Inv Amount ${i}` });
            }

            const soSearch = search.create({
                type: "salesorder",
                filters: [
                    ["type", "anyof", "SalesOrd"],
                    "AND", 
                    ["mainline", "is", "T"] 
                ],
                columns: [
                    search.createColumn({name: "internalid", summary: "GROUP"}),
                    search.createColumn({name: "tranid", summary: "GROUP"}),
                    search.createColumn({name: "altname", join: "jobMain", summary: "GROUP"}),
                    search.createColumn({name: "billingschedule", summary: "GROUP"}),
                    search.createColumn({name: "fxamount", summary: "GROUP"})
                ]
            });

            const pagedData = soSearch.runPaged({ pageSize: PAGE_SIZE });
            log.debug('pagedData', pagedData)
            const pageCount = pagedData.pageRanges.length;
            log.debug('pageCount', pageCount)

            if (pageId < 0) pageId = 0;
            else if (pageId >= pageCount && pageCount > 0) pageId = pageCount - 1;

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

            if (pageCount > 0) {
                const currentPage = pagedData.fetch({ index: pageId });
                
                let lineNum = 0;

                currentPage.data.forEach((result) => {
                    let id = result.getValue({name: "internalid", summary: "GROUP"});
                    let tranid = result.getValue({name: "tranid", summary: "GROUP"});
                    let grantRaw = result.getValue({name: "altname", join: "jobMain", summary: "GROUP"}) || "";
                    let billingSchText = result.getText({name: "billingschedule", summary: "GROUP"}) || " ";
                    let fxAmount = result.getValue({name: "fxamount", summary: "GROUP"}) || "0";

                    let grant = grantRaw.indexOf(':') !== -1 ? grantRaw.split(':').pop().trim() : grantRaw;
                    
                    sublist.setSublistValue({ id: 'col_grant', line: lineNum, value: grant || " " });
                    sublist.setSublistValue({ id: 'col_pledge_order', line: lineNum, value: tranid });
                    sublist.setSublistValue({ id: 'col_payment_sche', line: lineNum, value: billingSchText });
                    sublist.setSublistValue({ id: 'col_total_amount', line: lineNum, value: fxAmount });

                    try {
                        let recSo = record.load({
                            type: record.Type.SALES_ORDER,
                            id: id
                        });

                        let count = recSo.getLineCount({ sublistId: 'billingschedule' });
                        for (let i = 0; i < count; i++) {
                            let colIndex = i + 1;
                            if (colIndex > 4) break; 

                            let amt = recSo.getSublistValue({
                                sublistId: 'billingschedule',
                                fieldId: 'billamount',
                                line: i
                            });
                            
                            if (amt) {
                                sublist.setSublistValue({ 
                                    id: `col_inv_${colIndex}`, 
                                    line: lineNum, 
                                    value: amt.toString() 
                                });
                            }
                        }
                    } catch (e) {
                        log.error(`Error loading SO ID ${id}`, e.message);
                    }
                    
                    lineNum++; 
                });
            }

            response.writePage(form);
        }
    };

    return { onRequest };
});