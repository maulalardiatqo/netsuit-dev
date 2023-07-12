/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/ui/message'], function(url, message) {
    function pageInit(context) {
    }

    function createJournal(internalIdBill, creditAccountParams, debitAccountParams) {
        var loadingMessage = message.create({
            title: 'Please wait...',
            message: 'Processing your request...',
            type: message.Type.CONFIRMATION
          });
          loadingMessage.show();
          setTimeout(function() {
        runSuiteletTask(internalIdBill, creditAccountParams, debitAccountParams).then(function() {
            loadingMessage.hide();
          });
        }, 1000); 
    }

    function runSuiteletTask(internalIdBill, creditAccountParams, debitAccountParams) {
        return new Promise(function(resolve, reject) {
            try{
                console.log('internalIdBill', internalIdBill);

                var suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_abj_billp_create_journal_sl',
                    deploymentId: 'customdeploy_abj_billp_create_journal_sl',
                    params: {
                        internalIdBill: internalIdBill,
                        creditAccountParams : creditAccountParams,
                        debitAccountParams : debitAccountParams
                    }
                });
                console.log('suiteUrl', suiteletUrl);
                window.location.href = suiteletUrl;
                resolve()
            }catch(e){
                reject()
            }
        });}

    return {
        pageInit: pageInit,
        createJournal: createJournal
    };
});
