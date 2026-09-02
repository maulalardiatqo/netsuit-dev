/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function (serverWidget) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) return;

        var form = context.form;
        var sublist = form.getSublist({ id: 'item' });

        var proxyField = sublist.addField({
            id: 'custpage_activity_code_proxy',
            type: serverWidget.FieldType.SELECT,
            label: 'Activity Code'
        });
        proxyField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.NORMAL
        });
        proxyField.addSelectOption({ value: '', text: '' });

        var realField = sublist.getField({ id: 'custcol_activiti_code_custom' });
        if (realField) {
            realField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
        }
    }

    return { beforeLoad: beforeLoad };
});