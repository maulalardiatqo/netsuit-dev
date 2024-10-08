/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime'], function(record, runtime) {

    function getInputData() {
        var amortizationScheduleId = runtime.getCurrentScript().getParameter({
            name: 'custscript_amortization_id'
        });

        return {
            type: 'amortizationschedule',
            id: amortizationScheduleId
        };
    }

    function map(context) {
        var result = JSON.parse(context.value);
        var amortizationScheduleId = result.id;

        var recAmount = runtime.getCurrentScript().getParameter({
            name: 'custscript_recamount'
        });
        var postingPeriod = runtime.getCurrentScript().getParameter({
            name: 'custscript_postingperiod'
        });

        try {
            var amortizationScheduleRec = record.load({
                type: 'amortizationschedule',
                id: amortizationScheduleId,
                isDynamic: true
            });

            var lineCount = amortizationScheduleRec.getLineCount({ sublistId: 'recurrence' });

            for (var i = 0; i < lineCount; i++) {
                amortizationScheduleRec.selectLine({
                    sublistId: 'recurrence',
                    line: i
                });

                amortizationScheduleRec.setCurrentSublistValue({
                    sublistId: 'recurrence',
                    fieldId: 'recamount',
                    value: recAmount
                });

                amortizationScheduleRec.setCurrentSublistValue({
                    sublistId: 'recurrence',
                    fieldId: 'postingperiod',
                    value: postingPeriod
                });

                amortizationScheduleRec.commitLine({ sublistId: 'recurrence' });
            }

            amortizationScheduleRec.save();

        } catch (e) {
            log.error({
                title: 'Error processing record ' + amortizationScheduleId,
                details: e
            });
        }
    }

    function summarize(summary) {
        summary.mapSummary.errors.iterator().each(function(key, error, executionNo) {
            log.error({
                title: 'Error with key: ' + key + ', execution number: ' + executionNo,
                details: error
            });
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});
