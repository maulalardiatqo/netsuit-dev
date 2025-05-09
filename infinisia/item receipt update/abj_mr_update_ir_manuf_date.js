/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log'], function (search, record, log) {
    function convertToDateObject(dateStr) {
        // Misal dateStr = '31/8/2024'
        let parts = dateStr.split('/');
        if (parts.length !== 3) {
            throw new Error('Invalid date format. Expected DD/MM/YYYY');
        }
    
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
    
        return new Date(year, month, day);
    }
    function getInputData() {
        return search.load({ id: 'customsearch1203' });
    }

    function map(context) {
        let result = JSON.parse(context.value);
        log.debug('result', result);
    
        let irId = result.values["internalid.inventoryNumber"].value;
        let trandate = result.values["trandate.transaction"];
    
        context.write({
            key: irId,
            value: trandate
        });
    }
    
    /**
     * REDUCE Function
     */
    function reduce(context) {
        let irId = context.key;
        let trandates = context.values;
        log.debug('Processing irId', irId);

        var trandate = trandates[0];
        log.debug('trandate', trandate)
        var dateConvert = convertToDateObject(trandate)
        log.debug('dateConvert', dateConvert)
        try{
            var recInvNumb = record.load({
                type: "inventorynumber",
                id: irId,
                isDynamic: true,
            });
            var cekInvNumb = recInvNumb.getValue('inventorynumber');
            log.debug('cekInvNumb', cekInvNumb)
            if (dateConvert) {
                log.debug('masuk proses')
                recInvNumb.setValue({
                    fieldId: "custitemnumber_abj_manufacturing_date",
                    value: dateConvert,
                    ignoreFieldChange: true,
                });
                var saverec = recInvNumb.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                });
        
                log.debug('Inventory Number updated', saverec);
            }
        }catch(e){
            log.debug('error', e)
        }
        
    }

    // function summarize(summary) {
    //     log.audit('Process Summary', `Total Processed: ${summary.inputSummary.recordCount}`);
        
    //     summary.reduceSummary.errors.iterator().each(function (key, error) {
    //         log.error(`Error processing Record ID ${key}`, error);
    //         return true;
    //     });
    // }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        // summarize: summarize
    };
});
