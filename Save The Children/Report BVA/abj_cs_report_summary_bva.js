/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], (currentRecord) => {

    const pageInit = (context) => {
        const record = context.currentRecord;
        let isAllSof = record.getValue({ fieldId: 'custpage_sof_all' });
        if (isAllSof) record.getField({ fieldId: 'custpage_sof_multi' }).isDisabled = true;

        let isAllStatus = record.getValue({ fieldId: 'custpage_status_all' });
        if (isAllStatus) record.getField({ fieldId: 'custpage_status_multi' }).isDisabled = true;
    };

    const fieldChanged = (context) => {
        const record = context.currentRecord;
        const fieldId = context.fieldId;

        if (fieldId === 'custpage_sof_all') {
            let isAllSof = record.getValue({ fieldId: 'custpage_sof_all' });
            let sofField = record.getField({ fieldId: 'custpage_sof_multi' });
            sofField.isDisabled = isAllSof;
            if (isAllSof) record.setValue({ fieldId: 'custpage_sof_multi', value: [], ignoreFieldChange: true });
        }

        if (fieldId === 'custpage_status_all') {
            let isAllStatus = record.getValue({ fieldId: 'custpage_status_all' });
            let statusField = record.getField({ fieldId: 'custpage_status_multi' });
            statusField.isDisabled = isAllStatus;
            if (isAllStatus) record.setValue({ fieldId: 'custpage_status_multi', value: [], ignoreFieldChange: true });
        }
    };

    // FIX: kirim filter via POST (hidden form) alih-alih GET (window.open dengan query string panjang)
    // Ini menghindari batas panjang URL yang memicu "unexpected error" ketika banyak item dipilih.
    const downloadExcel = () => {
        const record = currentRecord.get();
        let baseUrl = record.getValue({ fieldId: 'custpage_base_url' });

        if (!baseUrl) {
            const urlParams = new URLSearchParams(window.location.search);
            const scriptId = urlParams.get('script');
            const deployId = urlParams.get('deploy');
            baseUrl = '/app/site/hosting/scriptlet.nl?script=' + scriptId + '&deploy=' + deployId;
        }

        // baseUrl sudah mengandung "?script=...&deploy=...", form action boleh tetap pakai ini,
        // parameter tambahan akan dikirim lewat body (POST), bukan lewat query string.
        let sofAll = record.getValue({ fieldId: 'custpage_sof_all' });
        let sofMulti = record.getValue({ fieldId: 'custpage_sof_multi' }) || [];
        let statusAll = record.getValue({ fieldId: 'custpage_status_all' });
        let statusMulti = record.getValue({ fieldId: 'custpage_status_multi' }) || [];
        let dateFrom = record.getText({ fieldId: 'custpage_date_from' });
        let dateTo = record.getText({ fieldId: 'custpage_date_to' });

        const formEl = document.createElement('form');
        formEl.method = 'POST';
        formEl.action = baseUrl;
        formEl.target = '_blank';
        formEl.style.display = 'none';

        const addInput = (name, value) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            formEl.appendChild(input);
        };

        addInput('action', 'export');

        addInput('sofAll', sofAll ? 'T' : 'F');
        if (!sofAll) {
            const validSof = sofMulti.filter(v => v);
            if (validSof.length > 0) addInput('sofMulti', validSof.join('|'));
        }

        addInput('statusAll', statusAll ? 'T' : 'F');
        if (!statusAll) {
            const validStatus = statusMulti.filter(v => v);
            if (validStatus.length > 0) addInput('statusMulti', validStatus.join('|'));
        }

        if (dateFrom) addInput('dateFrom', dateFrom);
        if (dateTo) addInput('dateTo', dateTo);

        document.body.appendChild(formEl);
        formEl.submit();
        document.body.removeChild(formEl);
    };

    return { pageInit, fieldChanged, downloadExcel };
});