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
    function fieldChanged(context) {
        
        var sublistFieldName = context.fieldId;
        var sublistName = context.sublistId;
        if(sublistName == 'recmachcustrecord_remunerasi'){
            if(sublistFieldName == 'custrecord_id_pendapatan'){
                var vrecord = context.currentRecord;
                var kompPend = vrecord.getCurrentSublistValue({
                    sublistId : "recmachcustrecord_remunerasi",
                    fieldId : "custrecord_id_pendapatan"
                });
                console.log('kompPned', kompPend)
                if(kompPend){
                    var recPend = record.load({
                        type: "customrecord_msa_komponen_pendapatan",
                        id : kompPend
                    });
                    var cekType = recPend.getValue("custrecord_msa_type_salary")
                    console.log('cekType', cekType);
                    if(cekType == '4'){
                        var formula = recPend.getValue("custrecord_list_overtime");
                        var formulaText = recPend.getText("custrecord_list_overtime")
                        console.log('formula', formula)
                        var toSet;
                        if(formula == '3'){
                            var nominal = recPend.getValue("custrecord_jumlah_rupiah");
                            toSet = formulaText + ' ' + nominal
                            alert('formula lembur adalah' + toSet)
                            vrecord.setCurrentSublistValue({
                                sublistId : "recmachcustrecord_remunerasi",
                                fieldId : "custrecord_jumlah_pendapatan",
                                value : nominal
                            })
                        }else{
                            toSet = formulaText
                            alert('formula lembur adalah' + formulaText)
                            vrecord.setCurrentSublistValue({
                                sublistId : "recmachcustrecord_remunerasi",
                                fieldId : "custrecord_jumlah_pendapatan",
                                value : 0
                            })
                        }
                        
                    }
                }
            }
        }
    }
    return{
        pageInit : pageInit,
        fieldChanged : fieldChanged,
    }
});