/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log"],
function(error,dialog,url,record,currentRecord,log) {
    function pageInit(context) {
        console.log("masuk client");
    }
    
   

    function printPDF(context) {
        var allData = []
        
        var vrecord = currentRecord.get();
        let lineTotal = vrecord.getLineCount({
            sublistId: "custpage_sublist_item",
        });

        for (let i = 0; i < lineTotal; i++) {
            var checkBoxValue = vrecord.getSublistValue({
                sublistId: "custpage_sublist_item",
                fieldId: 'custpage_sublist_check_bin',
                line: i,
            });
            
            if (checkBoxValue == true) {
                var nomor = vrecord.getSublistValue({
                    sublistId: "custpage_sublist_item",
                    fieldId: 'custpage_sublist_alt_ass_number',
                    line: i
                });
                var subsidiary = vrecord.getSublistValue({
                    sublistId: "custpage_sublist_item",
                    fieldId: 'custpage_sublist_subsidiary',
                    line: i
                });
                allData.push({
                    nomor: nomor,
                    subsidiary: subsidiary
                });
            }
        }
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_print_out_barcode_as',
            deploymentId: 'customdeploy_abj_sl_print_out_barcode_as',
            returnExternalUrl: false
        });
        console.log('allData', allData);
        console.log("urlpdf", createPDFURL);

        if (allData.length > 0) {
            if (createPDFURL) {
                newWindow = window.open(createPDFURL + '&allData=' + encodeURIComponent(JSON.stringify(allData)));
            }
        } else {
            alert('Please select by checkbox.');
        }
    }

    return {
        pageInit: pageInit,
        printPDF : printPDF
    };
}); 
 