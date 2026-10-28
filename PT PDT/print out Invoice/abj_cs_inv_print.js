/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log"],
function(error,dialog,url,record,currentRecord,log) {
    var records = currentRecord.get();
    
    function pageInit(context) {
        console.log("test in");
    }
    
    function printPDFexp() {
        console.log("test in function");
        var id = records.id;

        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_print_inv_expor',
            deploymentId: 'customdeploy_abj_sl_print_inv_expor',
            returnExternalUrl: false
        });
        
        console.log("id", id);
        console.log("urlpdf", createPDFURL);
        
        createPDFURL += '&recId=' + id; 
        
        if (createPDFURL) {
            newWindow = window.open(createPDFURL);
        }
    } 
    function printPDFLocal(){
        console.log("test in function");
        var id = records.id;

        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_print_inv_local',
            deploymentId: 'customdeploy_abj_sl_print_inv_local',
            returnExternalUrl: false
        });
        
        console.log("id", id);
        console.log("urlpdf", createPDFURL);
        
        createPDFURL += '&recId=' + id; 
        
        if (createPDFURL) {
            newWindow = window.open(createPDFURL);
        }
    }
    return {
        pageInit: pageInit,
        printPDFexp : printPDFexp,
        printPDFLocal : printPDFLocal
    };
});