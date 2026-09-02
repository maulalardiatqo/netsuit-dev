/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/search'], function (search) {

    var SUBLIST_ID = 'item';
    var FLD_SOF = 'cseg_stc_sof';
    var FLD_DEA = 'cseg_stc_segmentdea';
    var FLD_ACTIVITY_REAL = 'custcol_activiti_code_custom';   // hidden, simpan value asli
    var FLD_ACTIVITY_PROXY = 'custpage_activity_code_proxy';  // visible, filtered dropdown

    var MAPPING_RECORD = 'customrecord_stc_activity_sof_relation';
    var MAP_FLD_SOF = 'custrecord_act_sof';
    var MAP_FLD_DEA = 'custrecord_act_dea';
    var MAP_FLD_ACTIVITY = 'custrecord_act_activity_code';

    function getValidActivityCodes(sof, dea) {
        var options = [];
        search.create({
            type: MAPPING_RECORD,
            filters: [
                [MAP_FLD_SOF, 'anyof', sof],
                'AND',
                [MAP_FLD_DEA, 'anyof', dea]
            ],
            columns: [
                search.createColumn({ name: 'internalid' }),
                search.createColumn({ name: MAP_FLD_ACTIVITY })
            ]
        }).run().each(function (result) {
            var id = result.getValue(MAP_FLD_ACTIVITY);
            var text = result.getText(MAP_FLD_ACTIVITY);
            if (id) options.push({ id: id, text: text });
            return true;
        });
        return options;
    }

    function refreshProxyOptions(rec, line) {
        var sof = rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_SOF });
        var dea = rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_DEA });

        var proxyField = rec.getSublistField({
            sublistId: SUBLIST_ID,
            fieldId: FLD_ACTIVITY_PROXY,
            line: line
        });

        // Field custpage ini VALID untuk insertSelectOption sesuai dokumentasi
        proxyField.removeSelectOption({ value: null });
        proxyField.insertSelectOption({ value: '', text: '' });

        if (!sof || !dea) return [];

        var options = getValidActivityCodes(sof, dea);
        options.forEach(function (opt) {
            proxyField.insertSelectOption({ value: opt.id, text: opt.text });
        });

        return options;
    }

    function fieldChanged(context) {
        if (context.sublistId !== SUBLIST_ID) return;

        var rec = context.currentRecord;
        var line = rec.getCurrentSublistIndex({ sublistId: SUBLIST_ID });

        // Saat SOF/DEA berubah -> refresh opsi di proxy field
        if (context.fieldId === FLD_SOF || context.fieldId === FLD_DEA) {
            var validOptions = refreshProxyOptions(rec, line);

            // Kalau value real field sudah tidak valid untuk kombinasi baru, clear keduanya
            var currentReal = rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_ACTIVITY_REAL });
            if (currentReal) {
                var stillValid = validOptions.some(function (o) { return o.id === currentReal; });
                if (!stillValid) {
                    rec.setCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_ACTIVITY_REAL, value: '' });
                    rec.setCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_ACTIVITY_PROXY, value: '' });
                }
            }
        }

        // Saat user pilih value di proxy field -> sync ke real field
        if (context.fieldId === FLD_ACTIVITY_PROXY) {
            var proxyValue = rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_ACTIVITY_PROXY });
            rec.setCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: FLD_ACTIVITY_REAL,
                value: proxyValue
            });
        }
    }

    // Saat baris sudah ada value (edit mode) -> tampilkan value asli sebagai opsi terpilih di proxy
    function validateLine(context) {
        var rec = context.currentRecord;
        var line = rec.getCurrentSublistIndex({ sublistId: SUBLIST_ID });

        var validOptions = refreshProxyOptions(rec, line);
        var realValue = rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_ACTIVITY_REAL });

        if (realValue) {
            var proxyField = rec.getSublistField({
                sublistId: SUBLIST_ID,
                fieldId: FLD_ACTIVITY_PROXY,
                line: line
            });
            var exists = validOptions.some(function (o) { return o.id === realValue; });
            if (exists) {
                rec.setCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_ACTIVITY_PROXY, value: realValue });
            }
        }
        return true;
    }

    return {
        fieldChanged: fieldChanged,
        validateLine: validateLine
    };
});