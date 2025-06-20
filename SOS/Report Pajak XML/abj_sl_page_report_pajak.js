/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message', 'N/runtime'], function (serverWidget, task, search, log, record, message, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'BPPU Excel to XML PPh23'
            });

            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
             var subsidiaryField = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                source: 'subsidiary',
                container: "filteroption"
            });
            subsidiaryField.isMandatory = true
            var dateFrom = form.addField({
                id: 'custpage_date_from', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Date From'
            });
            dateFrom.isMandatory = true
             var npwpField = form.addField({
                id: 'custpage_npwp',
                type: serverWidget.FieldType.TEXT,
                label: 'NPWP',
                container: "filteroption"
            });
            var dateTo = form.addField({
                id: 'custpage_date_to', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Date To'
            });
            dateTo.isMandatory = true

            // form.addSubmitButton({
            //     label: 'Export To XML'
            // });
            form.addButton({
                id: 'custpage_custom_submit',
                label: 'Export To XML',
                functionName: 'submitWithLoading'
            });
             form.addButton({
                id: 'custpage_custom_submit',
                label: 'Export To EXCEL',
                functionName: 'submitWithLoading'
            });
            form.clientScriptModulePath = "SuiteScripts/abj_cs_report_pajak.js";
            context.response.writePage(form);
        }else{
            const req = context.request;
            log.debug('req', req)
            const mapReduceTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_abj_mr_export_xml_pph',
                deploymentId: 'customdeploy_abj_mr_export_xml_pph', 
                params: {
                    custscript_subsidiary: req.parameters.custpage_subsidiary,
                    custscript_date_from: req.parameters.custpage_date_from,
                    custscript_date_to: req.parameters.custpage_date_to,
                    custscript_npwp: req.parameters.custpage_npwp
                }
            });

            const taskId = mapReduceTask.submit();

            // Tampilkan message atau redirect ke status page
            const form = serverWidget.createForm({
                title: 'Processing Request'
            });

            form.addPageLink({
                type: serverWidget.FormPageLinkType.CROSSLINK,
                title: 'Check Task Status',
                url: `/app/common/scripting/mapreducescriptstatus.nl?whence=&id=${taskId}`
            });

            form.addField({
                id: 'custpage_info',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Info'
            }).defaultValue = `<div style="color:green;">Your request is being processed. You can check the status <a href="/app/common/scripting/mapreducescriptstatus.nl?whence=&id=${taskId}" target="_blank">here</a>.</div>`;

            context.response.writePage(form);
        }
    }
     return {
        onRequest: onRequest
    };
});
