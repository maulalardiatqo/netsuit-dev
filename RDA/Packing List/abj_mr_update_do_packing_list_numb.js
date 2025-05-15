/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log', 'N/runtime'], function (search, record, log, runtime) {
    function getInputData() {
        log.debug('masuk call')
        try {
            var currentScript = runtime.getCurrentScript();
            var searchId = currentScript.getParameter({
                name: "custscript_if_do"
            });

            log.debug({
                title: "Saved Search ID",
                details: searchId
            });
            return search.load({ id: searchId });
        } catch (e) {
            log.debug({
                title: "error",
                details: e.message
            });
        }
    }

    function map(context) {
        try{
            const result = JSON.parse(context.value);
            log.debug('result', result)
            const idTrans = result.id;
            const idIf = result.values["internalid.CUSTBODY_RDA_PACKLIST_DO_NUMBER"].value;
            // log.debug('data', {idTrans : idTrans, idIf : idIf})
            
            // log.debug('datamap', {idTrans : idTrans, idIf : idIf})
            context.write({
                key: idTrans,
                value: JSON.stringify({ idTrans, idIf })
            });

        }catch(e){
            log.debug('error', e)
        }
    }

    function reduce(context) {
        context.values.forEach(val => {
            try {
                const data = JSON.parse(val);
                // log.debug('data', data)
                if (data.idTrans && data.idIf) {
                    log.debug('data.idTrans ', data.idTrans )
                    log.debug('data.idIf', data.idIf )
                    record.submitFields({
                        type: "itemfulfillment",
                        id: data.idIf,
                        values: {
                            custbody_rda_packing_list_number : data.idTrans,
                            custbody_rda_flag_centangpackinglist: true,
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                } else {
                    log.error('Data tidak lengkap', data);
                }

            } catch (e) {
                log.error('Gagal menghapus record', e.message);
            }
        });
    }

    function summarize(summary) {
        // log.audit('Process Summary', `Total Processed: ${summary.inputSummary.recordCount}`);
        
        // summary.reduceSummary.errors.iterator().each(function (key, error) {
        //     log.error(`Error Deleting Record ID ${key}`, error);
        //     return true;
        // });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
