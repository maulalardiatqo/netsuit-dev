/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/format', 'N/https', 'N/url'], 
function(currentRecord, format, https, url) {

    function pageInit(context) { }

    function fieldChanged(context) {
        if (context.fieldId === 'custpage_select_all') {
            let rec = context.currentRecord;
            let isChecked = rec.getValue({ fieldId: 'custpage_select_all' });
            let lineCount = rec.getLineCount({ sublistId: 'custpage_alloc_list' });

            for (let i = 0; i < lineCount; i++) {
                rec.selectLine({ sublistId: 'custpage_alloc_list', line: i });
                rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_select', value: isChecked, ignoreFieldChange: true });
                rec.commitLine({ sublistId: 'custpage_alloc_list' });
            }
        }
    }

    async function onProcess() {
        let rec = currentRecord.get();
        let lineCount = rec.getLineCount({ sublistId: 'custpage_alloc_list' });
        let processedCount = 0;
        let hasSelected = false;

        for (let i = 0; i < lineCount; i++) {
            if (rec.getSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_select', line: i }) === true) {
                hasSelected = true; break;
            }
        }
        
        if (!hasSelected) return alert('Silakan pilih minimal 1 Allocation Schedule untuk diproses.');

        let iframe = document.getElementById('processor_iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'processor_iframe';
            iframe.style.display = 'none'; 
            document.body.appendChild(iframe);
        }

        for (let i = 0; i < lineCount; i++) {
            let isSelected = rec.getSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_select', line: i });
            
            if (isSelected === true) {
                let allocId = rec.getSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_internalid', line: i });
                
                rec.selectLine({ sublistId: 'custpage_alloc_list', line: i });
                rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_status', value: 'Loading Page...', ignoreFieldChange: true });
                rec.commitLine({ sublistId: 'custpage_alloc_list' });

                try {
                    await new Promise((resolve, reject) => {
                        let step = 1;
                        
                        let timeoutId = setTimeout(() => {
                            reject(new Error('Timeout: Sistem NetSuite tidak merespons.'));
                        }, 30000); 

                        iframe.onload = function() {
                            try {
                                let iframeWindow = iframe.contentWindow;
                                let iframeDoc = iframe.contentDocument || iframeWindow.document;

                                if (step === 1) {
                                    rec.selectLine({ sublistId: 'custpage_alloc_list', line: i });
                                    rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_status', value: 'Triggering Native Process...', ignoreFieldChange: true });
                                    rec.commitLine({ sublistId: 'custpage_alloc_list' });

                                    if (typeof iframeWindow.allocation_createJournalEntries === 'function') {
                                        step = 2; 
                                        iframeWindow.allocation_createJournalEntries(allocId);
                                    } else {
                                        let btnJE = iframeDoc.getElementById('createje');
                                        if (btnJE) {
                                            step = 2;
                                            btnJE.click();
                                        } else {
                                            clearTimeout(timeoutId);
                                            throw new Error('Tombol Create JE tidak ditemukan.');
                                        }
                                    }
                                } else if (step === 2) {
                                    clearTimeout(timeoutId);
                                    
                                    // Mengekstrak HTML dan memvalidasi pesan error NetSuite
                                    let htmlContent = iframeDoc.body ? iframeDoc.body.innerHTML : '';
                                    let warningText = "The Allocation sources or destinations did not have any expenses associated with them for the selected period.";
                                    
                                    if (htmlContent.includes(warningText)) {
                                        reject(new Error("Gagal: Tidak ada saldo (expenses) untuk dialokasikan pada periode ini."));
                                    } else if (htmlContent.includes('class="uir-alert-box warning session_confirmation_alert"')) {
                                        reject(new Error("Gagal: Terdapat peringatan pada halaman Allocation Schedule."));
                                    } else {
                                        resolve(); // Jika tidak ada peringatan HTML, tandai sebagai sukses
                                    }
                                }
                            } catch (err) {
                                clearTimeout(timeoutId); 
                                reject(err);
                            }
                        };

                        iframe.onerror = () => {
                            clearTimeout(timeoutId);
                            reject(new Error('Iframe gagal memuat halaman'));
                        };

                        let recordUrl = url.resolveRecord({
                            recordType: 'allocationschedule',
                            recordId: allocId,
                            isEditMode: false
                        });
                        iframe.src = recordUrl;
                    });

                    rec.selectLine({ sublistId: 'custpage_alloc_list', line: i });
                    rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_status', value: 'SUCCESS (JE Created)', ignoreFieldChange: true });
                    rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_select', value: false, ignoreFieldChange: true }); 
                    rec.commitLine({ sublistId: 'custpage_alloc_list' });
                    processedCount++;

                } catch (e) {
                    rec.selectLine({ sublistId: 'custpage_alloc_list', line: i });
                    rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_status', value: e.message, ignoreFieldChange: true });
                    rec.commitLine({ sublistId: 'custpage_alloc_list' });
                }
            }
        }

        alert('Proses massal selesai! Total berhasil: ' + processedCount);
    }

    function onSearch() {
        let rec = currentRecord.get();
        let nextDateObj = rec.getValue({ fieldId: 'custpage_next_date' });
        let isSelectAll = rec.getValue({ fieldId: 'custpage_select_all' });
        let sourceAccount = rec.getValue({ fieldId: 'custpage_source_account' });

        // Validasi parameter wajib sebelum pencarian
        if (!sourceAccount) return alert('Silakan pilih Source Account terlebih dahulu.');
        if (!nextDateObj) return alert('Silakan tentukan Next Date terlebih dahulu.');

        let formattedSearchDate = format.format({ value: nextDateObj, type: format.Type.DATE });
        onReset();

        let currentUrl = new URL(window.location.href);
        let fetchUrl = url.resolveScript({
            scriptId: currentUrl.searchParams.get('script'),
            deploymentId: currentUrl.searchParams.get('deploy'),
            params: { 
                custparam_action: 'get_data', 
                custparam_nextdate: formattedSearchDate,
                custparam_sourceaccount: sourceAccount 
            }
        });

        https.get.promise({ url: fetchUrl }).then(function(response) {
            let resBody = JSON.parse(response.body);
            if (resBody.status === 'success') {
                if (resBody.data.length === 0) return alert('Data tidak ditemukan.');

                resBody.data.forEach(function(item) {
                    rec.selectNewLine({ sublistId: 'custpage_alloc_list' });
                    rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_select', value: isSelectAll, ignoreFieldChange: true });
                    rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_internalid', value: item.id, ignoreFieldChange: true });
                    rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_name', value: item.name, ignoreFieldChange: true });
                    rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_frequency', value: item.frequency, ignoreFieldChange: true });
                    
                    if (item.nextdate) {
                        let parsedDate = format.parse({ value: item.nextdate, type: format.Type.DATE });
                        rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_nextdate', value: parsedDate, ignoreFieldChange: true });
                    }
                    
                    rec.setCurrentSublistValue({ sublistId: 'custpage_alloc_list', fieldId: 'custpage_status', value: '', ignoreFieldChange: true });
                    rec.commitLine({ sublistId: 'custpage_alloc_list' });
                });
            } else {
                alert('Error Server: ' + resBody.message);
            }
        }).catch(function(e) { alert('Gagal request: ' + e); });
    }

    function onReset() {
        let rec = currentRecord.get();
        for (let i = rec.getLineCount({ sublistId: 'custpage_alloc_list' }) - 1; i >= 0; i--) {
            rec.removeLine({ sublistId: 'custpage_alloc_list', line: i, ignoreRecalc: true });
        }
    }

    return { pageInit: pageInit, fieldChanged: fieldChanged, onSearch: onSearch, onReset: onReset, onProcess: onProcess };
});