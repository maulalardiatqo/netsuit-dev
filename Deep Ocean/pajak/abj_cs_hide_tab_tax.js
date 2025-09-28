/**
 * @NApiVersion 2.x
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log'], function(currentRecord, dialog, log) {
    
    function pageInit(context){
        try{
            console.log('pageInit call');
            var currentRec = currentRecord.get();
            var customLink = document.getElementById('custom1701lnk');

            if (customLink) {
                customLink.style.display = 'none';
            }

            var isAnyTrue = checkAnyTrueLine('item') || checkAnyTrueLine('expense');

            if (customLink) {
                customLink.style.display = isAnyTrue ? 'block' : 'none';
            }
        }catch (error) {
            log.error('Error in PageInit', error);
        }
        
    }

    function checkAnyTrueLine(sublistId){
        var currentRec = currentRecord.get();
        var lineCount = currentRec.getLineCount({ sublistId: sublistId });
        var result = false;

        for (var i = 0; i < lineCount; i++) {
            var value = currentRec.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custcol_4601_witaxapplies',
                line: i
            });
            log.debug(sublistId + ' line ' + i + ' value:', value);
            if (value === true || value === 'T') {
                result = true;
                break;
            }
        }
        return result;
    }

    function checkAnyTrue(sublistId){
        var currentRec = currentRecord.get();
        var value = currentRec.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custcol_4601_witaxapplies'
        });
        log.debug('CekValue ' + sublistId + ':', value);

        var customLink = document.getElementById('custom1701lnk');
        if (customLink) {
            customLink.style.display = (value === true || value === 'T') ? 'block' : 'none';
        }
    }

    function fieldChanged(context){
        if (
            (context.sublistId === 'item' || context.sublistId === 'expense') &&
            context.fieldId === 'custcol_4601_witaxapplies'
        ) {
            checkAnyTrue(context.sublistId);
        }
    }

    function saveRecord(context){
        var currentRec = currentRecord.get();
        var isAnyTrue = checkAnyTrueLine('item') || checkAnyTrueLine('expense');
        log.debug('isAnyTrue', isAnyTrue);
        
        if (isAnyTrue) {
            var requiredFields = [
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
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };

});
