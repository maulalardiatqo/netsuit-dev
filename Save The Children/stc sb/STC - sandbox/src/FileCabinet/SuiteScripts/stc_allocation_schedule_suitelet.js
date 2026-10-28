/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/query', 'N/task', 'N/redirect', 'N/runtime'], (
    serverWidget,
    query,
    task,
    redirect,
    runtime
) => {
    const CONFIG = {
        title: 'Allocation Schedule Runner',
        sublistId: 'custpage_allocation_sublist',
        selectFieldId: 'custpage_select',
        idFieldId: 'custpage_schedule_id',
        nameFieldId: 'custpage_schedule_name',
        inactiveFieldId: 'custpage_isinactive',
        lastModifiedFieldId: 'custpage_lastmodified',
        messageFieldId: 'custpage_message',
        maxSelectableRows: 200,
        successStatus: 'CONFIRMATION',
        errorStatus: 'ERROR'
    };

    const onRequest = context => {
        if (context.request.method === 'GET') {
            handleGet(context);
            return;
        }

        handlePost(context);
    };

    const handleGet = context => {
        const form = buildForm();
        const schedules = getAllocationSchedules();

        populateSublist(form.getSublist({ id: CONFIG.sublistId }), schedules);
        setStatusMessage(
            form,
            context.request.parameters.status || '',
            context.request.parameters.message || '',
            context.request.parameters.submitted || '0'
        );

        context.response.writePage(form);
    };

    const handlePost = context => {
        const selectedScheduleIds = getSelectedScheduleIds(context.request);

        if (!selectedScheduleIds.length) {
            redirectToCurrentSuitelet({
                status: CONFIG.errorStatus,
                message: 'Pilih minimal satu allocation schedule untuk dijalankan.',
                submitted: '0'
            });
            return;
        }

        if (selectedScheduleIds.length > CONFIG.maxSelectableRows) {
            redirectToCurrentSuitelet({
                status: CONFIG.errorStatus,
                message: `Maksimal ${CONFIG.maxSelectableRows} schedule per eksekusi.`,
                submitted: String(selectedScheduleIds.length)
            });
            return;
        }

        const submissionTaskId = submitScheduledRunner(selectedScheduleIds);

        redirectToCurrentSuitelet({
            status: CONFIG.successStatus,
            message: `Scheduled Script berhasil disubmit. Task ID: ${submissionTaskId}`,
            submitted: String(selectedScheduleIds.length)
        });
    };

    const buildForm = () => {
        const form = serverWidget.createForm({
            title: CONFIG.title
        });

        const messageField = form.addField({
            id: CONFIG.messageFieldId,
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Message'
        });
        messageField.defaultValue = buildInfoMessage('Checklist allocation schedule lalu klik Run Schedule.');

        const sublist = form.addSublist({
            id: CONFIG.sublistId,
            type: serverWidget.SublistType.LIST,
            label: 'Allocation Schedules'
        });

        sublist.addMarkAllButtons();
        addSublistFields(sublist);

        form.addSubmitButton({
            label: 'Run Schedule'
        });

        return form;
    };

    const addSublistFields = sublist => {
        sublist.addField({
            id: CONFIG.selectFieldId,
            type: serverWidget.FieldType.CHECKBOX,
            label: 'Select'
        });

        sublist.addField({
            id: CONFIG.idFieldId,
            type: serverWidget.FieldType.TEXT,
            label: 'Internal ID'
        });

        sublist.addField({
            id: CONFIG.nameFieldId,
            type: serverWidget.FieldType.TEXT,
            label: 'Schedule Name'
        });

        sublist.addField({
            id: CONFIG.inactiveFieldId,
            type: serverWidget.FieldType.TEXT,
            label: 'Inactive'
        });

        sublist.addField({
            id: CONFIG.lastModifiedFieldId,

    const populateSublist = (sublist, schedules) => {
        schedules.forEach((schedule, line) => {
            sublist.setSublistValue({
                id: CONFIG.idFieldId,
                line,
                value: String(schedule.id || '')
            });

            sublist.setSublistValue({
                id: CONFIG.nameFieldId,
                line,
                value: String(schedule.name || '-')
            });

            sublist.setSublistValue({
                id: CONFIG.inactiveFieldId,
                line,
                value: schedule.isinactive === true || schedule.isinactive === 'T' ? 'Yes' : 'No'
            });

            sublist.setSublistValue({
                id: CONFIG.lastModifiedFieldId,
                line,
                value: String(schedule.lastmodifieddate || '-')
            });
        });
    };

    const getSelectedScheduleIds = request => {
        const lineCount = request.getLineCount({
            group: CONFIG.sublistId
        });
        const selectedScheduleIds = [];

        for (let line = 0; line < lineCount; line += 1) {
            const isSelected = request.getSublistValue({
                group: CONFIG.sublistId,
                name: CONFIG.selectFieldId,
                line
            });

            if (isSelected !== 'T') {
                continue;
            }

            const scheduleId = request.getSublistValue({
                group: CONFIG.sublistId,
                name: CONFIG.idFieldId,
                line
            });

            if (/^\d+$/.test(String(scheduleId || ''))) {
                selectedScheduleIds.push(String(scheduleId));
            }
        }

        return selectedScheduleIds;
    };

    const submitScheduledRunner = scheduleIds => {
        const scheduledScriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: 'customscript_stc_alloc_sched_runner',
            deploymentId: 'customdeploy_stc_alloc_sched_runner',
            params: {
                custscript_stc_alloc_schedule_ids: JSON.stringify(scheduleIds)
            }
        });

        return scheduledScriptTask.submit();
    };


    const redirectToCurrentSuitelet = parameters => {
        const currentScript = runtime.getCurrentScript();

        redirect.toSuitelet({
            scriptId: currentScript.id,
            deploymentId: currentScript.deploymentId,
            parameters
        });
    };

    const setStatusMessage = (form, status, message, submitted) => {
        const messageField = form.getField({
            id: CONFIG.messageFieldId
        });

        if (!message) {
            messageField.defaultValue = buildInfoMessage('Checklist allocation schedule lalu klik Run Schedule.');
            return;
        }

        if (status === CONFIG.successStatus) {
            messageField.defaultValue = buildSuccessMessage(message, submitted);
            return;
        }

        messageField.defaultValue = buildErrorMessage(message, submitted);
    };

    const buildInfoMessage = message => `
        <div style="padding:12px;border-radius:6px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;">
            <strong>Info</strong><br/>${escapeHtml(message)}
        </div>
    `;

    const buildSuccessMessage = (message, submitted) => `
        <div style="padding:12px;border-radius:6px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;">
            <strong>Success</strong><br/>
            Total selected: ${escapeHtml(submitted || '0')}<br/>
            ${formatDetails(message)}
        </div>
    `;

    const buildErrorMessage = (message, submitted) => `
        <div style="padding:12px;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;">
            <strong>Error</strong><br/>
            Total selected: ${escapeHtml(submitted || '0')}<br/>
            ${formatDetails(message)}
        </div>
    `;

    const formatDetails = message =>
        escapeHtml(message)
            .replace(/\|\|/g, '<br/><br/>')
            .replace(/\|/g, '<br/>');

    const escapeHtml = value =>
        String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    const getErrorMessage = executionError => {
        if (!executionError) {
            return 'Unknown error';
        }

        return executionError.message || String(executionError);
    };

    return {
        onRequest
    };
});

