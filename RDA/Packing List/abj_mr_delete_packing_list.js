/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/runtime'], (log, record, runtime) => {

    function getInputData(context) {
        try {
            const scriptObj = runtime.getCurrentScript();

            const recordId = scriptObj.getParameter({ name: 'custscript_id_item_fulfill_mr' });
            const eventTrigger = scriptObj.getParameter({ name: 'custscript_even_trigger_mr' });
            const allIdFulFill = scriptObj.getParameter({ name: 'custscript_all_id_fulfill_mr' });

            log.debug('recordId', recordId);
            log.debug('eventTrigger', eventTrigger);
            log.debug('allIdFulFill', allIdFulFill);

            if (eventTrigger === 'create') {
                const dataRec = record.load({
                    type: 'customtransaction_rda_packing_list',
                    id: recordId
                });

                const nopol = dataRec.getValue('custbody_rda_packlist_nopol');
                const allIdFul = dataRec.getValue('custbody_rda_packlist_do_number');

                return allIdFul.map(id => ({
                    id,
                    isCentang: true,
                    nopol,
                    recordId
                }));
            } else {
                const parsedIds = JSON.parse(allIdFulFill || '[]');
                return parsedIds.map(id => ({
                    id,
                    isCentang: false,
                    nopol: '',
                    recordId: ''
                }));
            }
        } catch (e) {
            log.error('getInputData Error', e);
            return [];
        }
    };

    function map(context) {
        try {
            const value = JSON.parse(context.value);
            log.debug('Processing ID', value.id);

            record.submitFields({
                type: 'itemfulfillment',
                id: value.id,
                values: {
                    custbody_rda_flag_centangpackinglist: value.isCentang,
                    custbody_rda_nopol: value.nopol,
                    custbody_rda_packing_list_number: value.isCentang ? value.recordId : ''
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });

        } catch (e) {
            log.error('map error', e);
        }
    };

     return {
        getInputData: getInputData,
        map: map
    };
});
