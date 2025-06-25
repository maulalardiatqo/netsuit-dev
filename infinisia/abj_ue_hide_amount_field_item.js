/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/ui/serverWidget"], (runtime, log, serverWidget) => {

    function beforeLoad(context) {
        var userObj = runtime.getCurrentUser();
        log.debug('Custom script ID of current user role: ' + userObj.role, userObj.role);
        var currentRole = userObj.role
        var form = context.form;
        var rec = context.newRecord;
        var recType = rec.type
        log.debug('recType', recType)
        if ( context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE || context.type === context.UserEventType.VIEW) {
            if(currentRole == 1010 || currentRole == 1012 || currentRole == 1063 || currentRole == 1048 || currentRole == 1066 || currentRole == 1028|| currentRole == 1055){
                    var avgCost = form.getField({
                        id: 'averagecost',
                    })
                    avgCost.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    var totalValue = form.getField({
                        id: 'totalvalue',
                    })
                    totalValue.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                     var cost = form.getField({
                        id: 'cost',
                    })
                    cost.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    var lastpurchaseprice = form.getField({
                        id: 'lastpurchaseprice',
                    })
                    lastpurchaseprice.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
        }
    }
    return {
    beforeLoad: beforeLoad,
};
});