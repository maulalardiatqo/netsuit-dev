/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/log', 'N/runtime'], (record, log, runtime) => {
    
    const execute = (context) => {
        try {
            const script = runtime.getCurrentScript();
            const accountingPeriodId = script.getParameter({ name: 'custscript_task_id' });

            if (!accountingPeriodId) {
                log.error('Parameter Missing', 'Accounting Period ID is not provided.');
                return;
            }

            log.debug('Accounting Period ID', accountingPeriodId);

            const accountingPeriodRecord = record.load({
                type: 'accountingperiod',
                id: accountingPeriodId,
                isDynamic: true
            });
            var getName = accountingPeriodRecord.getValue('periodname');
            log.debug('getName', getName);
            if(getName){
                var newName = getName + ' - (Test)' 
                accountingPeriodRecord.setValue({
                    fieldId: 'periodname',
                    value: newName
                });
            }
            
            const recordId = accountingPeriodRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            log.debug('Success', `Accounting Period record with ID ${recordId} updated successfully.`);
        } catch (error) {
            log.error('Error in Scheduled Script', error.message);
        }
    };

    return { execute };
});
