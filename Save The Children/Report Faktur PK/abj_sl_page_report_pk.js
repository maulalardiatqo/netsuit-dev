/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message', 'N/runtime', 'N/redirect', 'N/config'], function (serverWidget, task, search, log, record, message, runtime, redirect, config) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'FAKTUR PK'
            });

            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            var dateFrom = form.addField({
                id: 'custpage_date_from', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Date From'
            });
            dateFrom.isMandatory = true
            var dateTo = form.addField({
                id: 'custpage_date_to', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Date To'
            });
            dateTo.isMandatory = true
            var jobActionField = form.addField({
                id: 'custpage_job_action',
                type: serverWidget.FieldType.TEXT,
                label: 'Job Action'
            });
            jobActionField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            form.addButton({
                id: 'custpage_custom_submit_xml',
                label: 'Export To XML',
                functionName: 'submitWithLoadingXML'
            });
            form.addButton({
                id: 'custpage_custom_submit_excel',
                label: 'Export To EXCEL',
                functionName: 'submitWithLoadingExcel'
            });

            form.clientScriptModulePath = "SuiteScripts/abj_cs_faktur_pk.js";
            context.response.writePage(form);
        }else{
            const req = context.request;
            const companyInfo = config.load({
                type: config.Type.COMPANY_INFORMATION
            });

            const employerId = companyInfo.getValue({
                fieldId: 'employerid'
            });
            var dateFromPar = req.parameters.custpage_date_from;
            var dateToPar = req.parameters.custpage_date_to;
            var npwpPar = employerId;
            var jobAction = req.parameters.custpage_job_action

                var fakturRecord = record.create({
                type: 'customrecord_id_for_faktur_pajak',
                isDynamic: true
            });

            fakturRecord.setValue({
                fieldId: 'custrecord_date', 
                value: new Date()
            });
            var newRecordId = fakturRecord.save();
            log.debug('Created Faktur Pajak Record ID', newRecordId);
                redirect.toSuitelet({
                    scriptId: 'customscript_abj_sl_download_faktur_pk',
                    deploymentId: 'customdeploy_abj_sl_download_faktur_pk',
                    parameters: {
                        dateFromPar : dateFromPar,
                        dateToPar : dateToPar,
                        npwpPar : npwpPar,
                        action : 'start',
                        idRecord : newRecordId,
                        jobAction : jobAction
                    }
                });
            }
            
        
    }
     return {
        onRequest: onRequest
    };
});
