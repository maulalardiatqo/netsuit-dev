/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/file', 'N/search', 'N/log', 'N/runtime'], function (file, search, log, runtime) {

    function execute(context) {
        try {
            var folderID = 1116;
            log.debug('ENV TYPE', runtime.envType);
            if(runtime.envType == 'SANDBOX'){
                folderID = 1128;
            }

            var fileSearch = search.create({
                type: 'file',
                filters: [
                    ['folder', 'anyof', folderID] 
                ],
                columns: ['internalid', 'name']
            });

            var filesToDelete = [];

            fileSearch.run().each(function (result) {
                var fileId = result.getValue('internalid');
                var fileName = result.getValue('name');
                

                log.debug('Found File', 'ID: ' + fileId + ', Name: ' + fileName);

                filesToDelete.push(fileId);
                return true; 
            });

            filesToDelete.forEach(function (fileId) {
                file.delete({ id: fileId });
                log.audit('File Deleted', 'ID: ' + fileId);
            });

            log.audit('Execution Complete', 'Deleted ' + filesToDelete.length + ' files.');

        } catch (e) {
            log.error('Error in execute function', e);
        }
    }

    return {
        execute: execute
    };

});
