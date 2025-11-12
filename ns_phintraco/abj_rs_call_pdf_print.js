/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/render', 'N/log'], function (render, log) {

    function doGet(request) {
        try {
            var recId = request.po_ns_id || request.poId || request.id;
            var recType = request.record_type || 'purchaseorder';
            var customForm = request.custom_form || request.formnumber || request.form_id;

            if (!recId) {
                return { status: 'error', message: 'Missing po_ns_id parameter' };
            }

            recId = parseInt(recId, 10);
            log.debug('recId',  recId)
            var renderOpts = {
                entityId: recId, // ✅ gunakan PO ID yang dikirim
                printMode: render.PrintMode.PDF
            };

            if (customForm) {
                var formNum = parseInt(customForm, 10);
                if (!isNaN(formNum)) {
                    renderOpts.formId = formNum;
                }
            }

            // ✅ Generate PDF dari transaksi
            var pdfFile = render.transaction(renderOpts);

            // ✅ Ambil isi file dalam bentuk Base64 (langsung aman)
            var pdfBase64 = pdfFile.getContents();

            return {
                status: 'success',
                recordType: recType,
                recordId: recId,
                fileName: pdfFile.name || ('PO_' + recId + '.pdf'),
                pdfBase64: pdfBase64,
                usedForm: renderOpts.formId || null
            };

        } catch (e) {
            log.error('Error printing PO', e);
            return {
                status: 'error',
                message: e.message || String(e),
                stack: e.stack || null
            };
        }
    }

    return {
        get: doGet
    };
});
