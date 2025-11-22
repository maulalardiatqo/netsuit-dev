/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search'], function(search) {

    function onRequest(context) {

        var list = [];

        var s = search.create({
            type: 'customrecord_sos_list_kode_objek_pajak',
            columns: ['custrecord_sos_nama_objek_pajak']
        });

        s.run().each(function(r) {
            list.push({
                id: r.id,
                text: r.getValue('custrecord_sos_nama_objek_pajak')
            });
            return true;
        });

        context.response.write(JSON.stringify(list));
    }

    return { onRequest: onRequest };
});
