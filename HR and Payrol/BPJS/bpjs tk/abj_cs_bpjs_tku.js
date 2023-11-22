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
        if(context.fieldId == 'custpage_sublist_checklist'){
            var vrecord = context.currentRecord;
            console.log('change');
            let lineTotal = vrecord.getLineCount({
                sublistId: "custpage_sublist_data",
            });
            console.log('lineTotal', lineTotal);
            for (let i = 0; i < lineTotal; i++) {
                var checkBoxValue = vrecord.getSublistValue({
                    sublistId : "custpage_sublist_data",
                    fieldId : 'custpage_sublist_checklist',
                    line : i,
                });
                console.log('cekValue',checkBoxValue);
                if(checkBoxValue == true){
                    console.log('checkboxnyatrue')
                    var idIr = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_data",
                        fieldId : 'custpage_sublist_internalid',
                        line : i
                    });
                    allIdIr.push(idIr);
                }
            }
            
        }
        console.log('bin process', allIdIr);
        
    }
    function downloadTtku() {
        console.log('allIdIr', allIdIr);
        console.log("test in function");
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_excel_tambah_tku',
            deploymentId: 'customdeployabj_sl_excel_tambah_tku',
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
    function loginSIPP() {
        var url = 'https://sipp.bpjsketenagakerjaan.go.id/';
        newWindow = window.open(url);
        
    } 
    return {
        pageInit: pageInit,
        downloadTtku : downloadTtku,
        fieldChanged : fieldChanged,
        loginSIPP : loginSIPP
    };
}); 
 