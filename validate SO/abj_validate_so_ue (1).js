/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/format", "N/workflow", "N/ui/serverWidget"], function (
    record,
    search,
    format,
    workflow,
    serverWidget
) {

    function beforeLoad(context) {

        try {
            if (context.type == context.UserEventType.VIEW) {

                var form = context.form;
                var currentRecord = context.newRecord;

                var idSO = []
                // var searchId = 'customsearch1174' //sandbox
                var searchId = 'customsearch1209' //prod pending approval
                var searchId2 = 'customsearch1212' //prod pending fulfillment

                var soSearch = search.load(searchId)
                soSearch.run().each(function (result) {
                    idSO.push(Number(result.id))
                    return true
                })

                var soSearch2 = search.load(searchId2)
                soSearch2.run().each(function (result2) {
                    idSO.push(Number(result2.id))
                    return true
                })

                // log.debug('idSO',idSO)
                // log.debug('currentRecid', currentRecord.id)

                if (idSO.includes(currentRecord.id)) {
                    log.debug('add', 'button Re-Validate added')
                    form.addButton({
                        id: 'custpage_revalidate_button',
                        label: 'Re-Validate',
                        functionName: `onValidateClick(${currentRecord.id})`
                    });
                    form.clientScriptModulePath = "SuiteScripts/abj_re-validate_so_cs.js"

                } else {
                    log.debug('add', 'no button added')
                }

            }
        } catch (e) {
            log.debug('error', e)
        }
    }

    return {
        beforeLoad: beforeLoad,
    };
});