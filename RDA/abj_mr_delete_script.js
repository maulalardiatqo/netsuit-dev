/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/file', 'N/log'], (search, file, log) => {

    const getInputData = () => {
        return search.create({
            type: 'file',
            filters: [
                ['name', 'contains', 'abj_'], 'AND',
                ['folder', 'anyof', '-15'] 
            ],
            columns: ['internalid', 'name', 'folder']
        });
    };

    const map = (context) => {
        try {
            const result = JSON.parse(context.value);
            const fileId = result.values.internalid.value;
            const fileName = result.values.name;

            log.debug('File Found', `Deleting fileId: ${fileId}, name: ${fileName}`);
            file.delete({ id: fileId });

            context.write({
                key: fileId,
                value: fileName
            });
        } catch (e) {
            log.error('Error in map', e);
        }
    };

    const summarize = (summary) => {
        summary.output.iterator().each((key, value) => {
            log.audit('File Deleted', `ID: ${key}, Name: ${value}`);
            return true;
        });

        if (summary.inputSummary.error) {
            log.error('Input Error', summary.inputSummary.error);
        }

        summary.mapSummary.errors.iterator().each((key, error) => {
            log.error(`Map Error for key: ${key}`, error);
            return true;
        });
    };

    return { getInputData, map, summarize };
});
