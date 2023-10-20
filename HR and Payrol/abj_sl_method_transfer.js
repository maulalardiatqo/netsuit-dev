/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record'], function (serverWidget, search, record) {
    function onRequest(context) {
        var contextRequest = context.request;
        var form = serverWidget.createForm({
            title: 'Metode Transfer'
        });
        if (context.request.method === 'GET') {
            var allIdSlip = JSON.parse(context.request.parameters.allIdSlip);
            log.debug('allIdSlip', allIdSlip);
            var TransferBank = form.addField({
                id: 'custpage_bank',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Bank Transfer',
            });
            TransferBank.addSelectOption({
                value: '',
                text: ''
            });
            TransferBank.addSelectOption({
                value: '1',
                text: 'Mandiri'
            });
            TransferBank.addSelectOption({
                value: '2',
                text: 'BCA'
            });
            TransferBank.isMandatory = true;

            var allDataString = JSON.stringify(allIdSlip);
            var listData = form.addField({
                id: "custpage_list_data",
                label: "List Data",
                type: serverWidget.FieldType.TEXTAREA,
            });
            listData.defaultValue = allDataString;

            listData.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN, 
            });
            
            form.clientScriptModulePath = "SuiteScripts/abj_cs_download_rekap_gaji.js";
            form.addButton({
                id: "custpage_btn_download",
                label: "Download CSV Rekap Bank Transfer",
                functionName: "downloadCSV(" + TransferBank.id + ")",
            });
            form.addButton({
                id: "custpage_btn_download",
                label: "Download Excel Rekap Bank Transfer",
                functionName: "downloadExcel(" + TransferBank.id + ")",
            });
            form.addSubmitButton({
                label: 'Bayar Gaji'
            });
            context.response.writePage(form);
        } else if (context.request.method === 'POST'){
            try{
            }catch(e){
                log.debug('error', e)
            }
            
            
        }
       
    }
    return {
        onRequest: onRequest
    };
});
