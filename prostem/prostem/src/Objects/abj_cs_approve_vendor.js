/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(['N/record', 'N/currentRecord'], function(record, currentRecord) {

    function pageInit(context) {
        // Biarkan kosong, diperlukan oleh standard NetSuite
    }

    function onApproveVendorClick() {
        if (confirm("Are you sure you want to approve this form and create the vendor?")) {
            var currRec = currentRecord.get();
            var recId = currRec.id;
            var recType = currRec.type;

            try {
                // Update status menjadi '2' (Approved) di background
                // Ini akan men-trigger afterSubmit (sebagai event XEDIT) di User Event Script
                record.submitFields({
                    type: recType,
                    id: recId,
                    values: {
                        'custrecord_srf_status': '2' // Pastikan field ID & nilainya tepat
                    }
                });

                alert('Form has been approved. The Vendor is being created.');
                // Reload halaman untuk melihat status dan link Vendor yang baru terbuat
                location.reload();

            } catch (e) {
                console.error(e);
                alert('Error creating vendor: ' + e.message);
            }
        }
    }

    return {
        pageInit: pageInit,
        onApproveVendorClick: onApproveVendorClick
    };
});