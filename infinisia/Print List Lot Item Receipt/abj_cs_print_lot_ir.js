/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log"],
function(error,dialog,url,record,currentRecord,log) {
    var allIdIr = []
    var records = currentRecord.get();
    function pageInit(context) {
        console.log("masuk client");
    }
    function fieldChanged(context) {
        allIdIr = []
        if(context.fieldId == 'custpage_sublist_check_bin'){
            var vrecord = context.currentRecord;
            console.log('change');
            let lineTotal = vrecord.getLineCount({
                sublistId: "custpage_sublist_item",
            });
            console.log('lineTotal', lineTotal);
            for (let i = 0; i < lineTotal; i++) {
                var checkBoxValue = vrecord.getSublistValue({
                    sublistId : "custpage_sublist_item",
                    fieldId : 'custpage_sublist_check_bin',
                    line : i,
                });
                console.log('cekValue',checkBoxValue);
                if(checkBoxValue == true){
                    console.log('checkboxnyatrue')
                    var idIr = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_ir',
                        line : i
                    });
                    allIdIr.push(idIr);
                }
            }
            
        }
        console.log('bin process', allIdIr);
        
    }
    function printSPPB() {
        console.log('allIdIr', allIdIr);
        console.log("test in function");
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_print_lot_ir',
            deploymentId: 'customdeployabj_sl_print_lot_ir',
            returnExternalUrl: false
        })
        console.log("urlpdf", createPDFURL);
        createPDFURL;
        if(allIdIr.length > 0){
            if (createPDFURL) {
                newWindow = window.open(createPDFURL + '&allIdIr=' + encodeURIComponent(JSON.stringify(allIdIr)));
            }
        }else{
            alert('PLeas Select By CheckBox')
        }
        
    } 
    function printChecklist() {
        console.log('allIdIr', allIdIr);
        console.log("test in function");
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_print_checklist',
            deploymentId: 'customdeploy_abj_sl_print_checklist',
            returnExternalUrl: false
        })
        console.log("urlpdf", createPDFURL);
        createPDFURL;
        if(allIdIr.length > 0){
            if (createPDFURL) {
                newWindow = window.open(createPDFURL + '&allIdIr=' + encodeURIComponent(JSON.stringify(allIdIr)));
            }
        }else{
            alert('PLeas Select By CheckBox')
        }
        
    } 
    return {
        pageInit: pageInit,
        printSPPB : printSPPB,
        fieldChanged : fieldChanged,
        printChecklist : printChecklist
    };
}); 
 