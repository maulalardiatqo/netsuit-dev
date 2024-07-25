/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/search', 'N/task', 'N/runtime', 'N/log'], function(record, search, task, runtime, log) {

    function execute(context) {
        try {
            var script = runtime.getCurrentScript();
            var start = script.getParameter({ name: 'custscript_start' }) || 0;
            var batchSize = 1000;
            var hasMoreResults = true;

            // Membuat pencarian item yang memiliki lastpurchaseprice
            var itemSearch = search.create({
                type: "item",
                filters: [
                ],
                columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "lastpurchaseprice", label: "Last Purchase Price"})
                ]
            });

            while (hasMoreResults && !runtime.getCurrentScript().getRemainingUsage() < 200) {
                var searchResult = itemSearch.run().getRange({
                    start: start,
                    end: start + batchSize
                });
                log.debug({
                    title: 'Batch Info',
                    details: 'Processing batch starting at ' + start + ' with ' + searchResult.length + ' items'
                });
                if (searchResult.length > 0) {
                    for (var i = 0; i < searchResult.length; i++) {
                        var itemId = searchResult[i].getValue({ name: 'internalid' });
                        var lastPurchasePrice = searchResult[i].getValue({ name: 'lastpurchaseprice' });
                    }
                    start += batchSize; 
                } else {
                    log.debug('masuk else')
                    hasMoreResults = false;
                }

                if (runtime.getCurrentScript().getRemainingUsage() < 200) {
                    rescheduleScript(start);
                    return;
                }
            }
        } catch (e) {
            log.error({
                title: 'Error Updating UPC Code',
                details: e.toString()
            });
        }
    }

    function rescheduleScript(start) {
        var scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT
        });
        scriptTask.scriptId = runtime.getCurrentScript().id;
        scriptTask.deploymentId = runtime.getCurrentScript().deploymentId;
        scriptTask.params = { custscript_start: start };
        scriptTask.submit();
    }

    return {
        execute: execute
    };
});
