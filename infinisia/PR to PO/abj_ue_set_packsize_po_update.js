/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/config"], function (
    record,
    search,
    config
) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var dataRec = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: false
                });

                var idRec = rec.id;
                var cForm = dataRec.getValue("customform");
                log.debug("cForm", cForm);

                if (cForm != 138) {
                    var dataLineCount = dataRec.getLineCount({
                        sublistId: "item"
                    });
                    log.debug("dataLineCount", dataLineCount);

                    var allDataPr = [];

                    if (dataLineCount > 0) {
                        for (var i = 0; i < dataLineCount; i++) {
                            var itemIdData = dataRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "item",
                                line: i
                            });
                            var lineId = dataRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_msa_id_line_from_pr",
                                line: i
                            });
                            var quantity = dataRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "quantity",
                                line: i
                            });
                            var internalidPR = dataRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_abj_pr_number",
                                line: i
                            });
                            var rate = dataRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "rate",
                                line: i
                            });
                            var taxCode = dataRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "taxcode",
                                line: i
                            });
                            var packSize = dataRec.getSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_abj_pack_size_order",
                                line: i
                            });

                            if (packSize != "") {
                                dataRec.setSublistValue({
                                    sublistId: "item",
                                    fieldId: "units",
                                    line: i,
                                    value: packSize
                                });
                            }

                            dataRec.setSublistValue({
                                sublistId: "item",
                                fieldId: "rate",
                                line: i,
                                value: rate
                            });
                            dataRec.setSublistValue({
                                sublistId: "item",
                                fieldId: "taxcode",
                                line: i,
                                value: taxCode
                            });

                            allDataPr.push({
                                idRec: idRec,
                                prId: internalidPR,
                                lineIdPr: lineId,
                                itemIdData: itemIdData,
                                quantity: quantity
                            });
                        }

                        // Cache loaded records to reduce usage
                        var prCache = {};

                        allDataPr.forEach(function (prData) {
                            var prId = prData.prId;
                            var lineIdPr = prData.lineIdPr;
                            var itemIdData = prData.itemIdData;
                            var quantity = prData.quantity;

                            if (!prCache[prId]) {
                                prCache[prId] = record.load({
                                    type: "purchaseorder",
                                    id: prId,
                                    isDynamic: false
                                });
                            }

                            var prRecord = prCache[prId];
                            prRecord.setValue({
                                fieldId: "custbody_po_converted",
                                value: prData.idRec,
                                ignoreFieldChange: true
                            });

                            var lineinPr = prRecord.getLineCount({
                                sublistId: "recmachcustrecord_iss_pr_parent"
                            });

                            if (lineinPr > 0) {
                                for (var i = 0; i < lineinPr; i++) {
                                    var itemId = prRecord.getSublistValue({
                                        sublistId: "recmachcustrecord_iss_pr_parent",
                                        fieldId: "custrecord_iss_pr_item",
                                        line: i
                                    });
                                    var line_id = prRecord.getSublistValue({
                                        sublistId: "recmachcustrecord_iss_pr_parent",
                                        fieldId: "id",
                                        line: i
                                    });
                                    var currntQtyPO = prRecord.getSublistValue({
                                        sublistId: "recmachcustrecord_iss_pr_parent",
                                        fieldId: "custrecord_prsum_qtypo",
                                        line: i
                                    }) || 0;

                                    if (itemId == itemIdData && lineIdPr == line_id) {
                                        var qtyPo = Number(currntQtyPO) + Number(quantity);
                                        prRecord.setSublistValue({
                                            sublistId: "recmachcustrecord_iss_pr_parent",
                                            fieldId: "custrecord_prsum_qtypo",
                                            line: i,
                                            value: qtyPo
                                        });
                                    }
                                }
                            }
                        });

                        Object.keys(prCache).forEach(function (prId) {
                            var savePr = prCache[prId].save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug("savePr", savePr);
                        });

                        var savePo = dataRec.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        log.debug("savePo", savePo);
                    }
                }
            }
        } catch (e) {
            log.debug("error", e);
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
