/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/runtime', 'N/task', 'N/log'], (runtime, task, log) => {
    const PARAMETER_ID = 'custscript_stc_alloc_schedule_ids';

    const execute = () => {
        const scheduleIds = getScheduleIds();

        log.debug({
            title: 'Allocation Schedule Runner Input',
            details: JSON.stringify({
                parameterId: PARAMETER_ID,
                scheduleIds
            })
        });

        if (!scheduleIds.length) {
            log.audit({
                title: 'Allocation Schedule Runner',
                details: 'No allocation schedule IDs were supplied.'
            });
            return;
        }

        const results = scheduleIds.map(scheduleId => submitAllocationSchedule(scheduleId));

        log.audit({
            title: 'Allocation Schedule Runner Results',
            details: JSON.stringify(results)
        });
    };

    const getScheduleIds = () => {
        const rawValue = runtime.getCurrentScript().getParameter({
            name: PARAMETER_ID
        });

        log.debug({
            title: 'Raw Allocation Schedule Parameter',
            details: JSON.stringify({
                parameterId: PARAMETER_ID,
                rawValue: rawValue || ''
            })
        });

        if (!rawValue) {
            return [];
        }

        try {
            const parsedValue = JSON.parse(String(rawValue));

            if (!Array.isArray(parsedValue)) {
                log.error({
                    title: 'Allocation Schedule Parameter Is Not Array',
                    details: JSON.stringify({
                        parameterId: PARAMETER_ID,
                        parsedValue
                    })
                });
                return [];
            }

            return parsedValue.filter(value => /^\d+$/.test(String(value)));
        } catch (parsingError) {
            log.error({
                title: 'Invalid Allocation Schedule Parameter',
                details: JSON.stringify(buildErrorDetails(parsingError))
            });
            return [];
        }
    };

    const submitAllocationSchedule = scheduleId => {
        const taskPayload = {
            taskType: task.TaskType.RECORD_ACTION,
            recordType: 'allocationschedule',
            action: 'run',
            params: [
                {
                    recordId: Number(scheduleId)
                }
            ]
        };

        try {
            log.debug({
                title: 'Submitting Allocation Schedule',
                details: JSON.stringify({
                    scheduleId: String(scheduleId),
                    taskPayload
                })
            });

            const recordActionTask = task.create(taskPayload);
            const taskId = recordActionTask.submit();

            log.debug({
                title: 'Allocation Schedule Submitted',
                details: JSON.stringify({
                    scheduleId: String(scheduleId),
                    taskId
                })
            });

            return {
                scheduleId: String(scheduleId),
                success: true,
                taskId
            };
        } catch (executionError) {
            const errorDetails = buildErrorDetails(executionError);

            log.error({
                title: `Allocation Schedule Submit Failed: ${scheduleId}`,
                details: JSON.stringify({
                    scheduleId: String(scheduleId),
                    taskPayload,
                    error: errorDetails
                })
            });

            return {
                scheduleId: String(scheduleId),
                success: false,
                message: executionError.message || String(executionError),
                errorName: executionError.name || '',
                stack: executionError.stack || ''
            };
        }
    };

    const buildErrorDetails = executionError => ({
        name: executionError && executionError.name ? executionError.name : '',
        message: executionError && executionError.message ? executionError.message : String(executionError || ''),
        stack: executionError && executionError.stack ? executionError.stack : ''
    });

    return {
        execute
    };
});
