/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log", "N/search", "N/runtime", 'N/ui/message'],
    function(error,dialog,url,record,currentRecord,log, search, runtime, message) {
        function pageInit(){
            console.log("masuk client");
        }
        function onPrintClick(){
            const rec = currentRecord.get();
            const rfqId = rec.getValue('custpage_rfq_select');

            if (!rfqId) {
                alert('Please Select RFQ Number');
                return;
            }

            var createPDFURL = url.resolveScript({
                scriptId: 'customscript_abj_sl_print_rfq',
                deploymentId: 'customdeploy_abj_sl_print_rfq',
                returnExternalUrl: false
            })
            console.log("id",rfqId);
            console.log("urlpdf", createPDFURL);
            createPDFURL += '&id=' +  rfqId;
            if (createPDFURL) {
                newWindow = window.open(createPDFURL);
            }
        }

    return {
        pageInit: pageInit,
        onPrintClick : onPrintClick
    };
}); 