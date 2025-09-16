/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {

    const getInputData = () => {
        let deploymentSearch = search.create({
            type: 'scriptdeployment',
            filters: [
                ['script.scriptid', 'contains', 'abj']
            ],
            columns: [
                'script',
                'scriptid',
                'title',
                'status'
            ]
        });

        return deploymentSearch;
    };

    const map = (context) => {
        try {
            let result = JSON.parse(context.value);
            let deploymentId = result.id;

            log.debug('Deleting deployment', deploymentId);

            record.delete({
                type: record.Type.SCRIPT_DEPLOYMENT,
                id: deploymentId
            });

            context.write({
                key: deploymentId,
                value: 'Deleted'
            });
        } catch (e) {
            log.error('Error deleting deployment', e);
        }
    };

    const reduce = (context) => {
    };

    const summarize = (summary) => {
        summary.output.iterator().each((key, value) => {
            log.audit('Deployment deleted', `ID: ${key}, Status: ${value}`);
            return true;
        });

        if (summary.inputSummary.error) {
            log.error('Input Error', summary.inputSummary.error);
        }

        summary.mapSummary.errors.iterator().each((key, err) => {
            log.error(`Map error for key: ${key}`, err);
            return true;
        });
    };

    return { getInputData, map, reduce, summarize };
});
