/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime"], function(
    record,
    search,
    serverWidget,
    runtime
    ) {
  function beforeLoad(context) {
        if(context.type == context.UserEventType.VIEW){
            try {
                var form = context.form;
                const rec = context.newRecord;
                var cekSof = rec.getValue('cseg_stc_sof');
                log.debug('cekSof', cekSof)
                if(cekSof){
                    log.debug('adaSOF');
                }else{
                    form.addButton({
                    id: 'custpage_btn_transform',
                    label: "Create SOF",
                    functionName: "createSof()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_transform_go_to_sof.js"
                }
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    return{
        beforeLoad : beforeLoad
    }
});