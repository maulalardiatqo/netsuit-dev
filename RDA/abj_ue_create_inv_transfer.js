/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/log"], function (record, search, log) {
    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.EDIT) {
                var newRec = context.newRecord;
                var soId = newRec.id;
                log.debug('soId', soId);

                var cekStatus = newRec.getValue('custbody_rda_so_approved');
                log.debug('cekStatus', cekStatus);

                if (cekStatus == true) {
                    var subsId = newRec.getValue('subsidiary');
                    var goodStock;
                    var Outbound;

                    if (subsId) {
                        var recSubs = record.load({
                            type: 'subsidiary',
                            id: subsId
                        });
                        goodStock = recSubs.getValue('custrecordcustrecord_rda_location_gs');
                        Outbound = recSubs.getValue('custrecord_rda_location_intransit_out');
                    }

                    var department = newRec.getValue('department');
                    var classId = newRec.getValue('class');
                    var soDate = newRec.getValue('trandate');
                    log.debug('soDate', soDate);

                    var allItem = [];
                    var cekLineCount = newRec.getLineCount('item');
                    if (cekLineCount > 0) {
                        for (var i = 0; i < cekLineCount; i++) {
                            var item = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            });
                            var units = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'units',
                                line: i
                            });
                            var qty = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i
                            });
                            var isFulfill = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'fulfillable',
                                line: i
                            });

                            if (isFulfill == true) {
                                allItem.push({ item: item, units: units, qty: qty });
                            }
                        }
                    }

                    if (allItem.length > 0) {
                        try {
                            var createRecord = record.create({
                                type: 'inventorytransfer',
                                isDynamic: true
                            });

                            createRecord.setValue({ fieldId: 'subsidiary', value: subsId });
                            createRecord.setValue({ fieldId: 'department', value: department });
                            createRecord.setValue({ fieldId: 'class', value: classId });
                            createRecord.setValue({ fieldId: 'trandate', value: soDate });
                            createRecord.setValue({ fieldId: 'custbody_rda_so_number', value: soId });
                            createRecord.setValue({ fieldId: 'custbody_rda_inventory_transfer_type', value: '2' });
                            createRecord.setValue({ fieldId: 'location', value: goodStock });
                            createRecord.setValue({ fieldId: 'transferlocation', value: Outbound });

                            allItem.forEach(function (data) {
                                createRecord.selectNewLine({ sublistId: 'inventory' });
                                createRecord.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: data.item });
                                createRecord.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'units', value: data.units });
                                createRecord.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: data.qty });
                                createRecord.commitLine({ sublistId: 'inventory' });
                            });

                            var saveCreate = createRecord.save();
                            log.debug('saveCreate', saveCreate);

                            // Set field custbody_rda_inventory_trf_number with the new inventory transfer ID
                            record.submitFields({
                                type: 'salesorder',
                                id: soId,
                                values: { custbody_rda_inventory_trf_number: saveCreate },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        } catch (e) {
                            log.error('Error creating Inventory Transfer', e);

                            // Set the error message on SO
                            record.submitFields({
                                type: 'salesorder',
                                id: soId,
                                values: { custbody_rda_error_message_ivnt_trf: e.message },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        }
                    }
                }
            }
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});
