/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/file', 'N/runtime'], (search, file, runtime) => {

    const FOLDER_IDS = [2344325, 2344326];

    const execute = (context) => {
        try {
            FOLDER_IDS.forEach(folderId => {
                log.debug('Proses Folder', folderId);
                deleteFilesInFolder(folderId);
            });
        } catch (e) {
            log.error('Error execute', e);
        }
    };

    function deleteFilesInFolder(folderId) {
        const fileSearch = search.create({
            type: search.Type.FOLDER,
            filters: [
                ['internalid', 'anyof', folderId],
                'AND',
                ['file.internalid', 'isnotempty', '']
            ],
            columns: [
                search.createColumn({ name: 'internalid', join: 'file' }),
                search.createColumn({ name: 'name', join: 'file' })
            ]
        });

        let pagedData = fileSearch.runPaged({ pageSize: 1000 });

        pagedData.pageRanges.forEach(pageRange => {
            let page = pagedData.fetch({ index: pageRange.index });
            page.data.forEach(result => {
                let fileId = result.getValue({ name: 'internalid', join: 'file' });
                let fileName = result.getValue({ name: 'name', join: 'file' });

                if (fileId && !isNaN(fileId) && Number(fileId) > 0) {
                try {
                    file.delete({ id: fileId });
                    log.debug('Deleted File', `ID: ${fileId}, Name: ${fileName}`);
                } catch (err) {
                    log.error('Delete Error', `File ID: ${fileId}, Err: ${err.message}`);
                }
                } else {
                log.audit('Skip Delete', `File kosong/null di folder ${folderId}`);
                }

                // cek governance
                if (runtime.getCurrentScript().getRemainingUsage() < 200) {
                log.audit('Yield', 'Rescheduling script karena governance hampir habis');
                runtime.getCurrentScript().yield();
                }
            });
        });
    }

    return { execute };
});
