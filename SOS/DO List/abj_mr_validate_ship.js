/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', 'N/record', 'N/search'], function (runtime, record, search) {

    function getInputData() {

        const cartonIds = JSON.parse(runtime.getCurrentScript().getParameter('custscript_carton_ids') || '[]');
        const packingId = runtime.getCurrentScript().getParameter('custscript_packing_list_id');

        log.debug('M/R Input - Carton Added', cartonIds);
        log.debug('M/R Input - Packing ID', packingId);

        return cartonIds.map(id => ({
            cartonId: id,
            packingId: packingId
        }));
    }
    function map(context) {
        const data = JSON.parse(context.value);
        const cartonId = data.cartonId;
        const packingId = data.packingId;

        log.debug('MAP - Processing Carton', cartonId);

        try {
            let search_Package_item = search.create({
                type: "customrecord_packship_cartonitem",
                filters: [
                    ["custrecord_packship_carton.custrecord_sos_packing_list_number_pack", "anyof", "@NONE@"],
                    "AND",
                    ["custrecord_packship_itemfulfillment.status", "anyof", "ItemShip:B"],
                    "AND",
                    ["custrecord_packship_itemfulfillment.mainline", "is", "T"],
                    "AND",
                    ["custrecord_packship_carton", "anyof", cartonId]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_packship_itemfulfillment" }),
                    search.createColumn({ name: "custrecord_fulfillment_id" }),
                    search.createColumn({ name: "custrecord_packship_carton" }),
                    search.createColumn({
                        name: "custrecord_sos_packing_list_number_pack",
                        join: "CUSTRECORD_PACKSHIP_CARTON"
                    })
                ]
            }).run().getRange(0, 1000);


            if (!search_Package_item || search_Package_item.length === 0) {
                log.debug("No search result for carton", cartonId);
                return;
            }

            const groupByIF = {};

            search_Package_item.forEach(res => {
                const ifId = res.getValue("custrecord_fulfillment_id");

                if (!groupByIF[ifId]) groupByIF[ifId] = [];
                groupByIF[ifId].push({
                    carton: res.getValue("custrecord_packship_carton"),
                    ifNumber: res.getValue("custrecord_packship_itemfulfillment")
                });
            });

            log.debug("Group By IF", groupByIF);

             record.submitFields({
            type: 'customrecord_packship_carton',
                id: cartonId,
                values: {
                    custrecord_sos_packing_list_number_pack: packingId
                },
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });

            log.debug("Updated carton with packingId", cartonId);
            Object.keys(groupByIF).forEach(function(ifId) {

                try {
                    const cartonListForIF = groupByIF[ifId].map(x => x.carton);

                    log.debug(`Carton list for IF ${ifId}`, cartonListForIF);
                    const uniqueCartonList = [...new Set(cartonListForIF)];

                    const totalCartonInIF = uniqueCartonList.length;

                    let filledCount = 0;

                    uniqueCartonList.forEach(function(ctn) {
                        if (ctn == cartonId) {
                            filledCount++;
                        } else {
                            const cartonHasPacking = search_Package_item.some(r =>
                                r.getValue("custrecord_packship_carton") == ctn &&
                                r.getValue({
                                    name: "custrecord_sos_packing_list_number_pack",
                                    join: "CUSTRECORD_PACKSHIP_CARTON"
                                })
                            );

                            if (cartonHasPacking) filledCount++;
                        }
                    });

                    log.debug(`IF ${ifId} - Total: ${totalCartonInIF}, Filled: ${filledCount}`);
                    if (filledCount === totalCartonInIF) {
                        log.audit(`Carton ${cartonId} is LAST carton for IF ${ifId}`, "Set custbody_sos_already_ship true");

                        record.submitFields({
                            type: 'itemfulfillment',
                            id: ifId,
                            values: { custbody_sos_already_ship: true },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }

                } catch (err) {
                    log.error(`ERROR last-carton-check for IF ${ifId}`, err);
                }
            });


        } catch (e) {
            log.error("MAP ERROR for carton " + cartonId, e);
        }
    }

    

    return {
        getInputData: getInputData,
        map: map
    };
});
