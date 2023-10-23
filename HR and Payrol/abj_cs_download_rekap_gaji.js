/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", 'N/ui/message'], function(
    runtime,
    log,
    url,
    currentRecord,
    currency,
    record,
    search,
    message
    ) {
        function pageInit(context) {
        }
        var bankId;
        function fieldChanged(context) {
            var currentRecordObj = currentRecord.get();
            var TransferBank = currentRecordObj.getField({
                fieldId : 'custpage_bank'
            });
            if(context.fieldId == 'custpage_bank'){
                console.log('change');
                var bankValue = currentRecordObj.getValue('custpage_bank');
               console.log('bankValue', bankValue);
               bankId = bankValue
            }
            
        }
        function downloadCSV(params){
            console.log('bankId', bankId)
            console.log('params', params)
            if(bankId){
                var allIdSlip = params;
                var downloadExcel = url.resolveScript({
                    scriptId: 'customscript_abj_sl_download_bank_csv',
                    deploymentId: 'customdeploy_abj_sl_download_bank_csv',
                    returnExternalUrl: false
                });
    
                console.log("urlpdf", downloadExcel);
    
                if (downloadExcel) {
                    newWindow = window.open(downloadExcel + '&allIdSlip=' + encodeURIComponent(JSON.stringify(allIdSlip)) + '&bankId=' + encodeURIComponent(bankId));
                }
            }else{
                alert("Please Select Bank.");
            }
           
        }
        function downloadExcel(params){
            console.log('bankId', bankId)
            console.log('params', params)
            if(bankId){
                var allIdSlip = params;
                var downloadExcel = url.resolveScript({
                    scriptId: 'customscript_abj_sl_downloadrekapexcel',
                    deploymentId: 'customdeploy_abj_sl_downloadrekapexcel',
                    returnExternalUrl: false
                });
    
                console.log("urlpdf", downloadExcel);
    
                if (downloadExcel) {
                    newWindow = window.open(downloadExcel + '&allIdSlip=' + encodeURIComponent(JSON.stringify(allIdSlip)) + '&bankId=' + encodeURIComponent(bankId));
                }
            }else{
                alert("Please Select Bank.");
            }
           
        }
        // function download(transferBankFieldId){
           
        //     var downloadExcel = url.resolveScript({
        //         scriptId: 'customscript_abj_sl_downloadrekapexcel',
        //         deploymentId: 'customdeploy_abj_sl_downloadrekapexcel',
        //         returnExternalUrl: false
        //     });

        //     console.log("urlpdf", downloadExcel);

        //     if (downloadExcel) {
        //         newWindow = window.open(downloadExcel);
        //     }
        // }
return{
    pageInit : pageInit,
    fieldChanged: fieldChanged,
    downloadCSV : downloadCSV,
    downloadExcel : downloadExcel
}

});