/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log', 'N/task'], function (search, record, log, task) {
    function getInputData() {
        return search.load({
            id: 'customsearch1294' // Ganti dengan ID saved search kamu
        });
    }

    function map(context) {
        let result = JSON.parse(context.value);
        log.debug('MAP', result.values);
        const accountId = result.values.internalid.value;
        const subsidiary = result.values.subsidiarynohierarchy.value;
        const balance = parseFloat(result.values.balance || 0);
        const today = new Date();

        // Format tanggal untuk pencarian
        // const todayFormatted = format.format({
        //     value: today,
        //     type: format.Type.DATE
        // });

        // Cek apakah sudah ada data untuk account + tanggal hari ini
        var allId = [];
        const existingSearch = search.create({
            type: 'customtransaction_rda_cash_bank_summary',
            filters: [
                ['custbody_rda_cb_summary', 'anyof', accountId]
            ],
            columns: ['internalid','custbody_rda_eb_cb_summary','custbody_rda_date_cb_summary']
        });

        let existingId = null;
        var newEndingBalance = 0;
        var oldDate = null;
        existingSearch.run().each(function(res) {
            existingId = res.id;
            newEndingBalance = res.getValue({ name : 'custbody_rda_eb_cb_summary'});
            oldDate = res.getValue({ name : 'custbody_rda_date_cb_summary'});
            allId.push(res.id);
            return true;
        });
        allId.forEach(function (id) {
            log.debug('Processing ID:', id);
            
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_abj_mr_test', 
                deploymentId: 'customdeploy_abj_mr_test', 
                params: {
                    custscript_id_so_test: id
                }
            });
            var taskId = mrTask.submit();
            log.debug('Map/Reduce Task Submitted', { taskId: taskId });
        });
    }

    function reduce(context) {
    }

    function summarize(summary) {
        log.audit('Process Summary', `Total Processed: ${summary.inputSummary.recordCount}`);
        
        summary.reduceSummary.errors.iterator().each(function (key, error) {
            log.error(`Error Deleting Record ID ${key}`, error);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
