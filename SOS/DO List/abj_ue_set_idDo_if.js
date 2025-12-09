/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/error', 'N/task'],

    (record, log, error, task) => {

        const afterSubmit = (context) => {
            const newRecord = context.newRecord;
            const oldRecord = context.oldRecord
            const packingListId = newRecord.id;

            // Saat CREATE
            if (context.type === context.UserEventType.CREATE) {
                const doList = newRecord.getValue({ fieldId: 'custbody_do_list' });
                const cartonList = newRecord.getValue({ fieldId: 'custbody_sos_box_list' });

                if (!doList || doList.length === 0) {
                    log.debug('Info', 'custbody_do_list kosong, tidak ada Item Fulfillment untuk diproses.');
                    return;
                }
                if (!cartonList || cartonList.length === 0){
                    log.debug('Info', 'custbody_sos_box_list kosong, tidak ada carton untuk diproses.');
                    return;
                }
                log.debug('cartonList', cartonList)
                const doIds = Array.isArray(doList) ? doList : doList.split(',');
                const cartonIds = Array.isArray(cartonList) ? cartonList : cartonList.split(',');
                log.debug('DO List (Create)', JSON.stringify(doIds));

                doIds.forEach((ifId) => {
                    try {
                        if (!ifId) return;

                        record.submitFields({
                            type: record.Type.ITEM_FULFILLMENT,
                            id: ifId,
                            values: {
                                custbody_sos_packing_list_number: packingListId
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });

                        log.audit('Success Update (Create)', `Item Fulfillment ID ${ifId} updated with packing list number ${packingListId}`);

                    } catch (e) {
                        log.error('Error Update Item Fulfillment (Create)', `ID: ${ifId}, Error: ${e.message}`);
                    }
                });
                // cartonIds.forEach((cartonId) =>{
                //     try{
                //         if(!cartonId) return;
                //         record.submitFields({
                //             type: 'customrecord_packship_carton',
                //             id: cartonId,
                //             values: {
                //                 custrecord_sos_packing_list_number_pack: packingListId
                //             },
                //             options: {
                //                 enableSourcing: false,
                //                 ignoreMandatoryFields: true
                //             }
                //         });
                //     }catch (e) {
                //         log.error('Error Update Carton (Create)', `ID: ${cartonId}, Error: ${e.message}`);
                //     }
                // })
                const mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_abj_mr_validate_ship',
                        params: {
                            custscript_carton_ids: JSON.stringify(cartonIds),
                            custscript_packing_list_id: packingListId
                        }
                    });
                    mrTask.submit();
            }

            // Saat DELETE
            if (context.type === context.UserEventType.DELETE) {
                const doList = newRecord.getValue({ fieldId: 'custbody_do_list' });
                const cartonList = newRecord.getValue({ fieldId: 'custbody_sos_box_list' });
                if (!doList || doList.length === 0) {
                    log.debug('Info', 'custbody_do_list kosong saat delete, tidak ada Item Fulfillment untuk direset.');
                    return;
                }
                if (!cartonList || cartonList.length === 0) {
                    log.debug('Info', 'custbody_sos_box_list kosong saat delete, tidak ada Box List untuk direset.');
                    return;
                }

                const doIds = Array.isArray(doList) ? doList : doList.split(',');
                const cartonIds = Array.isArray(cartonList) ? cartonList : cartonList.split(',');

                log.debug('DO List (Delete)', JSON.stringify(doIds));

                doIds.forEach((ifId) => {
                    try {
                        if (!ifId) return;

                        record.submitFields({
                            type: record.Type.ITEM_FULFILLMENT,
                            id: ifId,
                            values: {
                                custbody_sos_packing_list_number: ''
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });

                        log.audit('Success Reset (Delete)', `Item Fulfillment ID ${ifId} packing list number dikosongkan.`);

                    } catch (e) {
                        log.error('Error Reset Item Fulfillment (Delete)', `ID: ${ifId}, Error: ${e.message}`);
                    }
                });
                cartonIds.forEach((cartonId) => {
                    try {
                        if (!cartonId) return;

                        record.submitFields({
                            type: "customrecord_packship_carton",
                            id: cartonId,
                            values: {
                                custrecord_sos_packing_list_number_pack: ''
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });

                        log.audit('Success Reset (Delete)', `Carton ID ${cartonId} packing list number dikosongkan.`);

                    } catch (e) {
                        log.error('Error Reset Carton (Delete)', `ID: ${cartonId}, Error: ${e.message}`);
                    }
                });
            }
            if(context.type === context.UserEventType.EDIT){
                var boxListOld = oldRecord.getValue('custbody_sos_box_list');
                var boxListNew = newRecord.getValue('custbody_sos_box_list');
                log.debug('boxListOld', boxListOld);
                log.debug('boxListNew', boxListNew)
                var added = boxListNew.filter(x => !boxListOld.includes(x));

                // Cari yang dihapus
                var removed = boxListOld.filter(x => !boxListNew.includes(x));

                log.debug('added', added);
                log.debug('removed', removed);

                // ============================
                //   JIKA ADA YANG DITAMBAHKAN
                // ============================
                if(added.length > 0){
                    const mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_abj_mr_validate_ship',
                        params: {
                            custscript_carton_ids: JSON.stringify(added),
                            custscript_packing_list_id: packingListId
                        }
                    });
                    mrTask.submit();
                }
                // added.forEach(function(cartonId){
                //     record.submitFields({
                //         type: 'customrecord_packship_carton',
                //         id: cartonId,
                //         values: {
                //             custrecord_sos_packing_list_number_pack: packingListId
                //         },
                //         options: {
                //             enableSourcing: false,
                //             ignoreMandatoryFields: true
                //         }
                //     });
                //     log.debug('Updated ADD carton', cartonId);
                // });

                // ============================
                //     JIKA ADA YANG DIHAPUS
                // ============================
                removed.forEach(function(cartonId){
                    record.submitFields({
                        type: 'customrecord_packship_carton',
                        id: cartonId,
                        values: {
                            custrecord_sos_packing_list_number_pack: ''
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    log.debug('Updated REMOVE carton', cartonId);
                });
            }

        };

        return { afterSubmit };

    });
