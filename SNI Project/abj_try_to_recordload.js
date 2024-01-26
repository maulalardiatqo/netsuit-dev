/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/file', 'N/format'],
  function(search, record, email, runtime, file, format) {
    
    function execute(scriptContext) {
        try {
            var recLoad = record.load({
                type: 'vendorbill',
	            id: '6623838',
	            isDynamic: false
            })
            var recPO = recLoad.getLineCount({
                sublistId: 'purchaseorders'
            });
            log.debug('itemCount', recPO)
        }catch(e){
            log.debug('error', e)
        }
    }

    return {
        execute: execute
    };
});
