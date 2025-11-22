/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function(ui) {

    function beforeLoad(context) {

        if (context.type !== context.UserEventType.VIEW && context.type !== context.UserEventType.EDIT && context.type !== context.UserEventType.CREATE) {
            return;
        }

        var form = context.form;

        var f = form.addField({
            id: 'custpage_nama_objek_pajak',
            label: 'Nama Objek Pajak',
            type: ui.FieldType.SELECT,
            container: 'custom247' 
        });

        f.addSelectOption({ value: '', text: '-- loading --' });

        form.insertField({
            field: f,
            nextfield: 'custbody_kode_objek_pajak'
        });

        form.clientScriptModulePath = 'SuiteScripts/abj_cs_hide_tab_tax.js';
    }

    return { beforeLoad: beforeLoad };
});
