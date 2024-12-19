/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], (record, log) => {
    const beforeLoad = (context) => {
        if (context.type === context.UserEventType.EDIT) {
            const newRecord = context.newRecord;
            var idRec = newRecord.id
            log.debug('idRec', idRec)
            var recIf = record.load({
                type: 'itemfulfillment',
                id: idRec,
                isDynamic : true
            })
            const lineCount = recIf.getLineCount({ sublistId: 'item' });
            log.debug('lineCount', lineCount)

            for (let i = 0; i < lineCount; i++) {
                // Ambil nilai field 'units' dari sublist 'item'
                const units = recIf.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'unitconversion',
                    line: i
                });

                log.debug(`Line ${i + 1}`, `Units: ${units}`);

                // Pilih baris di sublist
                recIf.selectLine({ sublistId: 'item', line: i });

                // Set value ke field 'custcol15' pada baris yang dipilih
                recIf.setCurrentSublistValue({
                    sublistId : "item",
                    fieldId : "custcol15",
                    line : i,
                    value : units
                })
                // Commit perubahan pada baris
                recIf.commitLine({ sublistId: 'item' });
            }
        }
    };

    return {
        beforeLoad
    };
});
