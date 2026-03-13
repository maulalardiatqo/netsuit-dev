/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {

    const getInputData = () => {
        return search.create({
            type: search.Type.BUDGET,
            filters: [],
            columns: ['internalid']
        });
    };

    const map = (context) => {
        const searchResult = JSON.parse(context.value);
        const recordId = searchResult.id;

        try {
            const budgetRec = record.load({
                type: 'budget',
                id: recordId,
                isDynamic: true
            });

            budgetRec.setValue({ fieldId: 'class', value: '' });
            budgetRec.setValue({ fieldId: 'department', value: '' });
            budgetRec.setValue({ fieldId: 'location', value: '' });
            budgetRec.setValue({ fieldId: 'cseg_stc_sof', value: '' });
            budgetRec.setValue({ fieldId: 'cseg_stc_drc_segmen', value: '' });
            budgetRec.setValue({ fieldId: 'cseg_stc_segmentdea', value: '' });

            budgetRec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            log.debug('Success', 'Updated ID: ' + recordId);
        } catch (e) {
            log.error('Error ID: ' + recordId, e.message);
        }
    };

    const summarize = (summary) => {
        log.audit('Summary', 'Process Complete');
    };

    return {
        getInputData,
        map,
        summarize
    };
});