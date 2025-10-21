/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 */
define(['N/task', 'N/search', 'N/record', 'N/log', 'N/runtime'], function(task, search, record, log, runtime) {

    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        var subsId = request.parameters.subsId;
        var dateFrom = request.parameters.dateFromPar;
        var dateTo = request.parameters.dateToPar;
        var npwp = request.parameters.npwpPar;
        var idRecord = request.parameters.idRecord
        var jobAction = request.parameters.jobAction

        var pageContent = '';

        if (request.method === 'GET') {
            var script = '871';
            var deploy = '1'
            var action = request.parameters.action;
            var taskId = request.parameters.taskId || '';
            if (action === 'start') {
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_abj_mr_download_faktur_pk',
                    // deploymentId: 'customdeploy_abj_mr_export_xml_pph',
                    params: {
                        custscript_subs_id: subsId,
                        custscript_date_from_pk: dateFrom,
                        custscript_date_to_pk: dateTo,
                        custscript_npwp_pk: npwp,
                        custscript_id_cust_rec_pk : idRecord,
                        custscript_job_action_pk : jobAction
                    }
                });

                taskId = mrTask.submit();

                pageContent = '<p>Pleas Wait Process task is running...</p>' +
                '<p>Click the button below to check if the file is ready.</p>';

            }
            var contine_file = 'PK_' + idRecord
            if (action === 'status' && taskId) {
                var taskStatus = task.checkStatus({ taskId: taskId });
                log.debug('taskStatus', taskStatus)
                if (taskStatus.status === task.TaskStatus.COMPLETE) {
                    var fileUrl = '';
                    var fileSearch = search.create({
                        type: 'file',
                        filters: [['name', 'contains', contine_file]], 
                        columns: ['url']
                    });

                    fileSearch.run().each(function(result) {
                        fileUrl = result.getValue('url');
                        return false; 
                    });

                    if (fileUrl) {
                        pageContent = '<p>Processing Complete!</p>' +
                        '<p><a href="' + fileUrl + '" target="_blank">Download File</a></p>';
                    } else {
                        pageContent = 
                            '<p>Processing Complete, but file not found.</p>' +
                            '<p>Please try again later or contact administrator.</p>'
                        ;
                    }
                } else {
                    pageContent = 
                        '<p>Status: '+ taskStatus.status +'</p>' +
                        '<p>The file is still being processed. Please click below to refresh.</p>'
                    ;
                }
            }

            pageContent += "<button onclick='window.location.href=\"" 
            + request.url 
            + "?script=" + script 
            + "&deploy=" + deploy 
            + "&compid=" + runtime.accountId
            + "&subsId=" + encodeURIComponent(subsId)
            + "&dateFromPar=" + encodeURIComponent(dateFrom)
            + "&dateToPar=" + encodeURIComponent(dateTo)
            + "&npwpPar=" + encodeURIComponent(npwp)
            + "&idRecord=" + encodeURIComponent(idRecord)
            + "&action=status"
            + "&taskId=" + taskId
            + "&whence=\"'>Refresh Status</button>";



            response.write(pageContent);
        }
    }

    return {
        onRequest: onRequest
    };
});
