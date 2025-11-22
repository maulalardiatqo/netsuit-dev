/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/search'], (currentRecord, dialog, search) => {

    const pageInit = (context) => {
        console.log('pageInit call');
        const currentRec = currentRecord.get();
        const customLink = document.getElementById('custom247lnk');
        console.log('customLink', customLink);

        if (customLink) {
            customLink.style.display = 'none';
        }

        const isAnyTrue = checkAnyTrueLine('item') || checkAnyTrueLine('expense');

        if (customLink) {
            customLink.style.display = isAnyTrue ? 'block' : 'none';
        }
        // ============================

        var field = document.getElementById('custpage_nama_objek_pajak');

        if (!field) return;

        https.get({
            url: '/app/site/hosting/scriptlet.nl?script=1324&deploy=1' 
        }).then(function(res) {
            var data = JSON.parse(res.body);

            field.innerHTML = '';

            field.add(new Option('-- Pilih Objek Pajak --', ''));

            data.forEach(function(rec) {
                field.add(new Option(rec.text, rec.id));
            });
        });
    };

    const checkAnyTrueLine = (sublistId) => {
        const currentRec = currentRecord.get();
        const lineCount = currentRec.getLineCount({ sublistId: sublistId });
        let result = false;

        for (let i = 0; i < lineCount; i++) {
            const value = currentRec.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custcol_4601_witaxapplies',
                line: i
            });
            console.log(`${sublistId} line ${i} value:`, value);
            if (value === true || value === 'T') {
                result = true;
                break;
            }
        }
        return result;
    };

    const checkAnyTrue = (sublistId) => {
        const currentRec = currentRecord.get();
        const value = currentRec.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custcol_4601_witaxapplies'
        });
        console.log(`CekValue ${sublistId}:`, value);

        const customLink = document.getElementById('custom247lnk');
        if (customLink) {
            customLink.style.display = (value === true || value === 'T') ? 'block' : 'none';
        }
    };

    const fieldChanged = (context) => {
        if (
            (context.sublistId === 'item' || context.sublistId === 'expense') &&
            context.fieldId === 'custcol_4601_witaxapplies'
        ) {
            checkAnyTrue(context.sublistId);
        }
    };
    const saveRecord = (context) => {
        const currentRec = currentRecord.get();
        const isAnyTrue = checkAnyTrueLine('item') || checkAnyTrueLine('expense');
        console.log('isAnyTrue', isAnyTrue);
        
        if (isAnyTrue) {
            var requiredFields = [
                { id: 'custbody_sos_tahun_pajak', label: 'Tahun Pajak' },
                { id: 'custbody_sos_masa_pajak', label: 'Masa Pajak' },
                { id: 'custbody_sos_npwp_vendor', label: 'NPWP' },
                { id: 'custbody_sos_id_tku_penerima_penghasil', label: 'ID TKU Penerima Penghasilan' },
                { id: 'custbody_sos_fasilitas', label: 'Fasilitas' },
                { id: 'custbody_sos_kode_obj_pajak', label: 'Kode Objek Pajak' },
                { id: 'custbody_sos_tarif', label: 'Tarif' },
                { id: 'custbody_id_tku_pemotong', label: 'ID TKU Pemotong' },
                { id: 'custbody_sos_jenis_dok_ref', label: 'Jenis Dok. Referensi' }
            ];
            var missingFields = requiredFields.filter(function(field) {
                return currentRec.getValue(field.id) === '' || currentRec.getValue(field.id) == null;
            });

            if (missingFields.length > 0) {
                var missingFieldNames = missingFields.map(function(field) {
                    return '- ' + field.label;
                }).join('<br>');

                dialog.alert({
                    title: 'Missing Required Fields',
                    message: 'Please fill in the following fields before saving:<br><br>' + missingFieldNames
                });

                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    };


    return {
        pageInit,
        fieldChanged,
        saveRecord
    };

});
