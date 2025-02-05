/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/runtime'], function (serverWidget, runtime) {
    function beforeLoad(context) {
        try {
            log.debug('trigerred')
            if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY || context.type === context.UserEventType.XEDIT) {
                var userRole = runtime.getCurrentUser().role;
                log.debug('user role', userRole)
                var restrictedRoles = [1011, 1016, 1013, 3];

                if (restrictedRoles.includes(userRole)) {
                    log.debug('masuk restric')
                    
                }else{
                    log.debug('masuk else')
                    var form = context.form;
                    // var sublist1 = form.getSublist('price1');
                    // if(sublist1){
                    //     sublist1.displayType = serverWidget.SublistDisplayType.HIDDEN;
                    // }

                    var sublistIds = ['price1', 'price2', 'price3', 'price4', 'price5', 'price6'];

                    sublistIds.forEach(function (sublistId) {
                        var sublistToHide = form.getSublist({ id: sublistId });
                        log.debug('sublistTOHide', sublistToHide);
                        if(sublistToHide){
                            sublistToHide.displayType = serverWidget.SublistDisplayType.HIDDEN;
                        }
                    });
                    var pricingTab = form.getTab({id : 'pricing'});
                    log.debug('pricingTab', pricingTab)
                    if (pricingTab) {
                        pricingTab.displayType = serverWidget.TabDisplayType.HIDDEN;
                    }
                }   
            }
        } catch (e) {
            log.error('Error in beforeLoad', e.message);
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
