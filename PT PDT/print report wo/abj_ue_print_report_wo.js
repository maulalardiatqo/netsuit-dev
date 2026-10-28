/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/search"], (runtime, log, search) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            var idRec = rec.id
            log.debug('idRec', idRec);
            var forLabel = '';
            var manufWoC = '';
            const manufacturingoperationtaskSearchObj = search.create({
            type: "manufacturingoperationtask",
            filters:
            [
                ["status","anyof","PROGRESS","NOTSTART"], 
                "AND", 
                ["workorder","anyof",idRec]
            ],
            columns:
            [
                search.createColumn({name: "internalid", label: "Internal ID"}),
                search.createColumn({name: "manufacturingworkcenter", label: "Manufacturing Work Center"})
            ]
            });
            const searchResultCount = manufacturingoperationtaskSearchObj.runPaged().count;
            log.debug("manufacturingoperationtaskSearchObj result count",searchResultCount);
            manufacturingoperationtaskSearchObj.run().each(function(result){
                manufWoC = result.getValue({
                    name : "manufacturingworkcenter"
                });
            return true;
            });
            if(manufWoC == 1503 || manufWoC == 2208){
                forLabel = 'Furnace'
            }else if( manufWoC == 2209){
                forLabel = 'CL'
            }else if(manufWoC == 2212 ){
                forLabel = 'Refining'
            }

            if(forLabel != ''){
                form.addButton({
                    id: 'custpage_button_print_spk',
                    label: "Print " + forLabel,
                    functionName: "printReportWO()"
                });
            
            
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_print_report_wo.js"
            }
            
            
        
        }
}
return {
    beforeLoad: beforeLoad,
};
});