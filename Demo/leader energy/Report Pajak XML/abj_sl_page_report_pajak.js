/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message', 'N/runtime', 'N/redirect'], function (serverWidget, task, search, log, record, message, runtime, redirect) {

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
            var jobActionField = form.addField({
                id: 'custpage_job_action',
                type: serverWidget.FieldType.TEXT,
                label: 'Job Action'
            });
            jobActionField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            // form.addSubmitButton({
            //     label: 'Export To XML'
            // });
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
            // form.addButton({
            //     id: 'custpage_custom_submit_sxd',
            //     label: 'Download SXD File',
            //     functionName: 'submitWithLoadingSxd'
            // });

            form.clientScriptModulePath = "SuiteScripts/abj_cs_report_pajak.js";
            context.response.writePage(form);
        }else{
            const req = context.request;
            var subsId = req.parameters.custpage_subsidiary;
            var dateFromPar = req.parameters.custpage_date_from;
            var dateToPar = req.parameters.custpage_date_to;
            var npwpPar = req.parameters.custpage_npwp;
            var jobAction = req.parameters.custpage_job_action
            if (jobAction === 'sxd') {
    var fileUrl = 'https://9484296.app.netsuite.com/core/media/media.nl?id=3619&c=9484296&h=vgN3oeGaPgAttC08CPQYldsQo96Xdfo5QDLf9GTB3UnBuLhB&_xt=.xsd';

    context.response.write(`
        <html>
            <head>
                <title>Download File</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                    #goBackBtn {
                        display: none;
                        margin-top: 20px;
                        padding: 10px 20px;
                        background-color: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                    #goBackBtn:hover {
                        background-color: #45a049;
                    }
                </style>
                <script>
                    window.onload = function() {
                        // Mulai download setelah halaman dimuat
                        window.location.href = "${fileUrl}";
                        
                        // Setelah 3 detik, tampilkan tombol "Go Back"
                        setTimeout(function() {
                            document.getElementById('goBackBtn').style.display = 'inline-block';
                        }, 3000);
                    };

                    function goBack() {
                        history.back();
                    }
                </script>
            </head>
            <body>
                <h3>File sedang didownload...</h3>
                <button id="goBackBtn" onclick="goBack()">Go Back</button>
            </body>
        </html>
    `);
    return;
}else{
                var fakturRecord = record.create({
                type: 'customrecord_id_for_faktur_pajak',
                isDynamic: true
            });

            fakturRecord.setValue({
                fieldId: 'custrecord_subsidiary', 
                value: subsId
            });

            fakturRecord.setValue({
                fieldId: 'custrecord_date', 
                value: new Date()
            });
            var newRecordId = fakturRecord.save();
            log.debug('Created Faktur Pajak Record ID', newRecordId);
            redirect.toSuitelet({
                scriptId: 'customscript_abj_sl_download_bppu',
                deploymentId: 'customdeploy_abj_sl_download_bppu',
                parameters: {
                    subsId : subsId,
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
    }
     return {
        onRequest: onRequest
    };
});
