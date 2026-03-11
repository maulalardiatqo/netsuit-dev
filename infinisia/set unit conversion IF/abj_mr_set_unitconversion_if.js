/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    const getInputData = () => {
        return search.create({
            type: 'itemfulfillment', 
            filters: [
                ['mainline', 'is', 'F'],
                'AND',
                ['custcol_unitconversion_fulfill', 'isempty', '']
            ],
            columns: ['internalid']
        });
    };

    const map = (mapContext) => {
        const searchResult = JSON.parse(mapContext.value);
        const recordId = searchResult.id;

        try {
            const objRecord = record.load({
                type: 'itemfulfillment', 
                id: recordId,
                isDynamic: false
            });

            const lineCount = objRecord.getLineCount({ sublistId: 'item' });
            let isChanged = false;

            for (let i = 0; i < lineCount; i++) {
                const unitConv = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'unitconversion',
                    line: i
                });

                if (unitConv) {
                    objRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_unitconversion_fulfill',
                        line: i,
                        value: unitConv
                    });
                    isChanged = true;
                }
            }

            if (isChanged) {
                objRecord.save();
                log.audit(`Updated ID: ${recordId}`);
            }
        } catch (e) {
            log.error(`Error processing ID: ${recordId}`, e);
        }
    };

    return { getInputData, map };
});