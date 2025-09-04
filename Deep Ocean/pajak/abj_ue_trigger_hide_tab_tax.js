/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([], () => {

    const beforeSubmit = (context) => {
        const rec = context.newRecord;

        const checkAnyTrueLine = (sublistId) => {
            const lineCount = rec.getLineCount({ sublistId });
            for (let i = 0; i < lineCount; i++) {
                const isChecked = rec.getSublistValue({
                    sublistId,
                    fieldId: 'custcol_4601_witaxapplies', 
                    line: i
                });
                if (isChecked === true || isChecked === 'T') {
                    return true;
                }
            }
            return false;
        };

        const isAnyTrue = checkAnyTrueLine('item') || checkAnyTrueLine('expense');
        log.debug('isAnyTrue', isAnyTrue)
        if (isAnyTrue) {
            const requiredFields = [
                { id: 'custbody_bs_tahun_pajak', label: 'Tahun Pajak' },
                { id: 'custbody_bs_masa_pajak', label: 'Masa Pajak' },
                { id: 'custbody_bs_npwp_vendor', label: 'NPWP' },
                { id: 'custbody_bs_id_tku_penerima_penghasil', label: 'ID TKU Penerima Penghasilan' },
                { id: 'custbody_bs_fasilitas', label: 'Fasilitas' },
                { id: 'custbody_bs_kode_obj_pajak', label: 'Kode Objek Pajak' },
                { id: 'custbody_bs_tarif', label: 'Tarif' },
                { id: 'custbody_id_tku_pemotong', label: 'ID TKU Pemotong' },
                { id: 'custbody_bs_jenis_dok_ref', label: 'Jenis Dok. Referensi' }
            ];

            const missingFields = requiredFields.filter((field) => {
                const val = rec.getValue({ fieldId: field.id });
                return val === '' || val == null;
            });

            if (missingFields.length > 0) {
                const missingFieldNames = missingFields.map((f) => '- ' + f.label).join(', ');
                var message = 'Peringatan! Field berikut wajib diisi: ' + missingFieldNames;
                throw message; // langsung throw string message
            }
        }
    };

    return { beforeSubmit };

});
