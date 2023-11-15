/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log"],
function(error,dialog,url,record,currentRecord,log) {
    var binNumbToProcess = [];
    function pageInit(context) {
        console.log("masuk client");
    }
    function fieldChanged(context) {
        binNumbToProcess = []
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
                    var binNumb = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_id_bin',
                        line : i
                    });
                    var copy = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_integer_input',
                        line : i
                    });
                    
                    binNumbToProcess.push({
                        binNumb : binNumb,
                        copy : copy
                    });
                }
            }
            
        }
        if(context.fieldId == 'custpage_sublist_integer_input'){
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
                    var binNumb = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_id_bin',
                        line : i
                    });
                    var copy = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_integer_input',
                        line : i
                    });
                    console.log('copy', copy);
                    binNumbToProcess.push({
                        binNumb : binNumb,
                        copy : copy
                    });
                }
            }

        }
        console.log('bin process', binNumbToProcess);
        
    }
    function printPDF() {
        console.log('checkedBins', binNumbToProcess);
        console.log("test in function");
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_print_label_bin',
            deploymentId: 'customdeploy_abj_sl_print_label_bin',
            returnExternalUrl: false
        })
        console.log("urlpdf", createPDFURL);
        createPDFURL;
        if(binNumbToProcess.length >0){
            if (createPDFURL) {
                newWindow = window.open(createPDFURL + '&allidBin=' + encodeURIComponent(JSON.stringify(binNumbToProcess)));
            }
        }else{
            alert('PLeas Select By CheckBox')
        }
        
    } 
    return {
        pageInit: pageInit,
        printPDF : printPDF,
        fieldChanged: fieldChanged
    };
}); 
 