/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/error', 'N/ui/dialog', 'N/ui/message', 'N/url', 'N/record', 'N/currentRecord', 'N/log', 'N/search', 'N/runtime'],
function(error, dialog, message, url, record, currentRecord, log, search, runtime) {

    function fieldChanged(context) {
        if (context.fieldId === 'custpage_subsidiary') {
            var vrecord = context.currentRecord;
            var subsId = vrecord.getValue('custpage_subsidiary');
            var taxNo = '';

            if (subsId) {
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters: [["internalid", "anyof", subsId]],
                    columns: [search.createColumn({ name: "taxidnum", label: "Tax ID" })]
                });

                subsidiarySearchObj.run().each(function(result) {
                    taxNo = result.getValue({ name: "taxidnum" });
                    return true;
                });
            }

            if (taxNo) {
                vrecord.setValue({
                    fieldId: 'custpage_npwp',
                    value: taxNo
                });
            }
        }
    }

    function submitWithLoading() {
        var processMsg = message.create({
            title: "Processing",
            message: "On Process. Please wait...",
            type: message.Type.INFORMATION
        });
        processMsg.show();

        setTimeout(function () {
            try {
                document.forms[0].submit();
            } catch (e) {
                processMsg.hide();
                console.log("Error", e);
                dialog.alert({
                    title: "Error",
                    message: e.message
                });
            }
        }, 500);
    }

    return {
        fieldChanged: fieldChanged,
        submitWithLoading: submitWithLoading
    };
});
