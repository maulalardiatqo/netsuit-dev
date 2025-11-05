/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/runtime'], (ui, search, runtime) => {

    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            // === FORM SETUP ===
            const form = ui.createForm({ title: 'Print RFQ' });

            // Field Select
            const rfqField = form.addField({
                id: 'custpage_rfq_select',
                type: ui.FieldType.SELECT,
                label: 'Select RFQ Number'
            });
            rfqField.addSelectOption({ value: '', text: '' });

            // === AMBIL DATA DARI SAVED SEARCH ===
            const rfqSearch = search.load({ id: 'customsearch_rfq_list' });
            const results = rfqSearch.run().getRange({ start: 0, end: 1000 });

            results.forEach(result => {
                const internalId = result.getValue({ name: 'internalid' });
                const docNumber = result.getValue({ name: 'tranid' });
                rfqField.addSelectOption({
                    value: internalId,
                    text: docNumber
                });
            });

            // === TAMBAH BUTTON PRINT (CUSTOM BUTTON) ===
            form.addButton({
                id: 'custpage_btn_print',
                label: 'Print RFQ',
                functionName: 'onPrintClick'
            });

            // === SET CLIENT SCRIPT ===
            form.clientScriptModulePath = "SuiteScripts/abj_cs_rfq_print.js";

            context.response.writePage(form);
        }
    };

    return { onRequest };
});
