/**
 * @NAPIVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/config', 'N/runtime', 'N/ui/serverWidget', 'N/https', 'N/format', 'N/record', 'N/search', 'N/query', 'N/error'],
    function (config, runtime, serverWidget, https, format, record, search, query, error) {
        function afterSubmit(context) {
            log.debug('triggered after submit')
            try {
                var rec = context.newRecord;
                
                log.debug('rec', rec);
                var id_rec = rec.id;
                log.debug('id_rec', id_rec);

                var search_Package_item = search.create({
                    type: "customrecord_packship_cartonitem",
                    filters:
                        [
                            ["custrecord_packship_carton.custrecord_sos_packing_list_number_pack", "anyof", "@NONE@"],
                            "AND",
                            ["custrecord_packship_itemfulfillment.status", "anyof", "ItemShip:B"],
                            "AND",
                            ["custrecord_packship_itemfulfillment.mainline", "is", "T"],
                            "AND",
                            ["custrecord_packship_carton","anyof", id_rec]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_packship_itemfulfillment", label: "Fulfillment Number" }),
                            search.createColumn({ name: "custrecord_fulfillment_id", label: "Fulfillment Id " }),
                            search.createColumn({ name: "custrecord_packship_carton", label: "Pack Carton " }),
                            search.createColumn({
                                name: "custrecord_sos_packing_list_number_pack",
                                join: "CUSTRECORD_PACKSHIP_CARTON",
                                label: "SOS - Packing List Number"
                            })
                        ]
                }).run().getRange(0, 1000);;
                log.debug('search_Package_item : ' + search_Package_item.length, search_Package_item);

                if (search_Package_item.length > 0) {
                    log.debug('tidak centang', 'already ship nya');
                } else {
                    var fulfill_id = rec.getValue('custrecord_fulfillment_id');
                    log.debug('fulfill_id', fulfill_id);
                    var setFieldAlreadyShip = record.submitFields({
                        type: record.Type.ITEM_FULFILLMENT,
                        id: fulfill_id,
                        values: {
                            custbody_sos_already_ship: true
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                }
            } //
            catch (e) {
                log.error(e.toString());
            }
        }
        return {
            afterSubmit: afterSubmit,
        };
    });
