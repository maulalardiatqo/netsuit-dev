/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log"],
function(error,dialog,url,record,currentRecord,log) {
var records = currentRecord.get();
    function pageInit(context) {
        console.log("masuk client");
    }
    
    function prosesGaji(allIdSlip) {
        console.log('allIdSLip', allIdSlip);
    console.log("test in function");
    var createPDFURL = url.resolveScript({
        scriptId: 'customscript_abj_sl_method_transfer',
        deploymentId: 'customdeploy_abj_sl_method_transfer',
        returnExternalUrl: false
    })
    console.log("urlpdf", createPDFURL);
    createPDFURL;
        if (createPDFURL) {
            newWindow = window.open(createPDFURL + '&allIdSlip=' + encodeURIComponent(JSON.stringify(allIdSlip)));
        }
    } 
    return {
        pageInit: pageInit,
        prosesGaji : prosesGaji,
    };
}); 
 