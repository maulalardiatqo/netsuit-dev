/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(["N/record", "N/search", "N/log"], function (record, search, log) {

    function afterSubmit(context) {
        try {

            // Hanya berjalan saat create atau edit invoice
            if (context.type !== context.UserEventType.CREATE &&
                context.type !== context.UserEventType.EDIT) {
                return;
            }

            var rec = context.newRecord;
            var recType = rec.type;

            // Hanya berjalan untuk Invoice
            if (recType !== record.Type.INVOICE) {
                return;
            }

            var createdFromId = rec.getValue("createdfrom");

            if (!createdFromId) {
                log.debug("No createdFrom", "Invoice tidak berasal dari SO");
                return;
            }

            // Cek type dari createdfrom
            var lookup = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: createdFromId,
                columns: ["recordtype"]
            });

            var createdFromType = lookup.recordtype;
            log.debug("Created From Type", createdFromType);

            if (createdFromType === "salesorder") {

                var soRec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: createdFromId
                });

                var lineCount = soRec.getLineCount({
                    sublistId: "links"
                });

                log.debug("SO Links Count", lineCount);

                var isFirstInvoice = true;

                for (var i = 0; i < lineCount; i++) {
                    var linkType = soRec.getSublistValue({
                        sublistId: "links",
                        fieldId: "type",
                        line: i
                    });

                    if (linkType && linkType.toLowerCase() === "invoice") {
                        isFirstInvoice = false;
                        break;
                    }
                }

                if (isFirstInvoice) {
                    var invId = rec.id;

                    log.debug("First Invoice Detected", "Updating custom field...");

                    record.submitFields({
                        type: record.Type.INVOICE,
                        id: invId,
                        values: {
                            custbody_is_inv_first: true
                        }
                    });
                }
            }

        } catch (e) {
            log.error("error", e);
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
