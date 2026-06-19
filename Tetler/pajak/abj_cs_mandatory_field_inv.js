/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/search'], (currentRecord, dialog, search) => {
    const saveRecord = (context) => {
        const currentRec = currentRecord.get();
        var customForm = currentRec.getValue('customform');
        if(customForm == '126'){
                var requiredFields = [
                    { id: 'custbody_sos_jenis_fp', label: 'Jenis Faktur' },
                    { id: 'custbody_sos_kode_transaksi_trx', label: 'Kode Transaksi' },
                    { id: 'custbody_sos_id_tku_sales', label: 'ID TKU Penjual' },
                    { id: 'custbody_sos_npwp_nik_pembeli', label: 'NPWP/NIK Pembeli' },
                    { id: 'custbody_sos_jenis_id_buyer', label: 'Jenis ID Pembeli' },
                    { id: 'custbody_sos_negara_pembeli', label: 'Negara Pembeli' },
                    { id: 'custbody_sos_nama_pembeli', label: 'Nama Pembeli' },
                    { id: 'custbody_sos_alamat_pembeli', label: 'Alamat Pembeli' },
                    { id: 'custbody_sos_id_tku_pembeli_trx', label: 'ID TKU Pembeli' }
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

                }else{
                    return true
                }
        }else{
            return true
        }
        
    };


    return {
        saveRecord
    };

});