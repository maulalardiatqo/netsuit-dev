/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/task', 'N/search', 'N/log'], function(task, search, log) {
    
    function onRequest(context) {
        var request = context.request;
        var response = context.response;
        var params = request.parameters;
        
        log.debug('Params Received', params);
        
        var action = params.action;
        var responseObj = {};

        if (action === 'start') {
            try {
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_abj_mr_budget_pashing',
                    params: {
                        custscript_budget_pash_rec_id: params.recId,
                        custscript_bugget_pash_rec_type: params.recType,
                        custscript_budget_pash_token: params.fileToken,
                        custscript_budget_pash_startdate : params.startdate,
                        custscript_budget_pash_endDate : params.enddate
                    }
                });
                var taskId = mrTask.submit();
                responseObj = { status: 'QUEUED', taskId: taskId };
            } catch (e) {
                log.error('Error starting Map/Reduce', e);
                responseObj = { status: 'FAILED', message: e.message };
            }

        } else if (action === 'check') {
          var taskId = params.taskId;
            var fileToken = params.fileToken; // Contoh: "1_20260526_102617"
            
            // Ambil Record ID dari potongan awal token (karakter sebelum underscore pertama)
            var recordId = fileToken ? fileToken.split('_')[0] : '%'; 

            try {
                var taskStatus = task.checkStatus({ taskId: taskId });
                responseObj = { status: taskStatus.status };

                if (taskStatus.status === 'COMPLETE') {
                    // PERBAIKAN: Cari file yang namanya diawali dengan "Budget_Report_" + recordId
                    // Cara ini dijamin mendeteksi file apa pun yang digenerate oleh Task M/R tersebut
                    var fileSearch = search.create({
                        type: 'file',
                        filters: [
                            ['name', 'startswith', 'Budget_Report_' + recordId + '_']
                        ],
                        columns: ['url', 'created']
                    });
                    
                    // Sort berdasarkan tanggal dibuat paling baru agar tidak tertukar dengan download lama
                    fileSearch.columns.push(search.createColumn({
                        name: 'created',
                        sort: search.Sort.DESC
                    }));

                    var searchResult = fileSearch.run().getRange({ start: 0, end: 1 });

                    if (searchResult.length > 0) {
                        responseObj.fileUrl = searchResult[0].getValue({ name: 'url' });
                    } else {
                        responseObj.status = 'PROCESSING'; 
                    }
                }
            } catch (error) {
                log.error('Error Checking Status', error);
                responseObj = { status: 'FAILED', message: error.message };
            }
        }

        response.setHeader({
            name: 'Content-Type',
            value: 'application/json'
        });
        response.write(JSON.stringify(responseObj));
    }

    return {
        onRequest: onRequest
    };
});