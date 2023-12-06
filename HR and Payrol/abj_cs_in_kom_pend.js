/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error','N/ui/dialog', 'N/url',"N/record", "N/currentRecord","N/log"],
function(error,dialog,url,record,currentRecord,log) {
    function pageInit(context) {
        console.log("masuk client");
    }
    function fieldChanged(context) {
        var vrecord = context.currentRecord;
        if(context.fieldId == 'custrecord_msa_type_salary'){
            
            var type = vrecord.getValue("custrecord_msa_type_salary");
            console.log("type", type);
            if(type == '4'){
                console.log('uang lembur')
                var listFormula = vrecord.getField({
                    fieldId : "custrecord_list_overtime"
                });
                listFormula.isDisabled = false
            }
        }
        if(context.fieldId == 'custrecord_list_overtime'){
            var formula = vrecord.getValue("custrecord_list_overtime")
            console.log('formula', formula);
            if(formula == '3'){
                var nominal = vrecord.getField({
                    fieldId : 'custrecord_jumlah_rupiah'
                });
                nominal.isDisabled = false
            }
        }
    }
    return{
        pageInit : pageInit,
        fieldChanged : fieldChanged,
    }
});