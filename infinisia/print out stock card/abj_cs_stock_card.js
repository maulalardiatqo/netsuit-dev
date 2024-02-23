/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log"],
function(error,dialog,url,record,currentRecord,log) {
var records = currentRecord.get();
var allData = [];
    function pageInit(context) {
        console.log("test in");
    }
    function fieldChanged(context) {
        allData = []
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
                    var item = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_item',
                        line : i
                    });
                    var invNumber = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_invnumber',
                        line : i
                    });
                    var stockUnit = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_unit',
                        line : i
                    });
                    var location = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_location',
                        line : i
                    });
                    var binNumber = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_bin',
                        line : i
                    });
                    var expDate = vrecord.getSublistValue({
                        sublistId : "custpage_sublist_item",
                        fieldId : 'custpage_sublist_expdate',
                        line : i
                    });
                    allData.push({
                        item : item,
                        invNumber : invNumber,
                        location : location,
                        binNumber : binNumber,
                        expDate : expDate,
                        stockUnit : stockUnit
                    });
                }
            }
            
        }
        
        
    }
    function printStock() {
        console.log("test in function");
        console.log('ALL process', allData);
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_printout_stock_card',
            deploymentId: 'customdeploy_abj_sl_printout_stock_card',
            returnExternalUrl: false
        })
        console.log("urlpdf", createPDFURL);
        createPDFURL;
        if(allData.length > 0){
            if (createPDFURL) {
                newWindow = window.open(createPDFURL + '&allData=' + encodeURIComponent(JSON.stringify(allData)));
            }
        }else{
            alert('PLeas Select By CheckBox')
        }
    
    } 
    return {
        pageInit: pageInit,
        printStock : printStock,
        fieldChanged : fieldChanged
    };
}); 
 