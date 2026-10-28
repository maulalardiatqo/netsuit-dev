/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/runtime', 'N/task', 'N/log'], (runtime, task, log) => {
    const PARAMETER_ID = 'custscript_stc_alloc_schedule_ids';

    const execute = () => {
        const scheduleIds = getScheduleIds();
        log.debug('scheduleIds', scheduleIds)
        if (!scheduleIds.length) {
            log.audit({
                title: 'Allocation Schedule Runner',
                details: 'No allocation schedule IDs were supplied.'
            });
            return;
        }

        const results = scheduleIds.map(scheduleId => submitAllocationSchedule(scheduleId));
        log.debug('results', results)
        log.audit({
            title: 'Allocation Schedule Runner Results',
            details: JSON.stringify(results)
        });
    };

    const getScheduleIds = () => {
        const rawValue = runtime.getCurrentScript().getParameter({
            name: PARAMETER_ID
        });

        if (!rawValue) {
            return [];
        }

        try {
            const parsedValue = JSON.parse(String(rawValue));

            if (!Array.isArray(parsedValue)) {
                return [];
            }

            return parsedValue.filter(value => /^\d+$/.test(String(value)));
        } catch (parsingError) {
            log.error({
                title: 'Invalid Allocation Schedule Parameter',
                details: parsingError
            });
            return [];
        }
    };

    const submitAllocationSchedule = scheduleId => {
        try {
            const recordActionTask = task.create({
                taskType: task.TaskType.RECORD_ACTION,
                recordType: 'allocationschedule',
                action: 'run',
                condition: task.ActionCondition.ALL_QUALIFIED_INSTANCES,
                params: [
                    {
                        recordId: Number(scheduleId)
                    }
                ]
            });
            log.debug('recordActionTask', recordActionTask)
            return {
                scheduleId: String(scheduleId),
                success: true,
                taskId: recordActionTask.submit()
            };
        } catch (executionError) {
            return {
                scheduleId: String(scheduleId),
                success: false,
                message: executionError.message || String(executionError)
            };
        }
    };

    return {
        execute
    };
});
