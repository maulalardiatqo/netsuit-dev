/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget',"N/search"], (serverWidget, search) => {

    const searchTar = (itemId) => {
        log.debug('itemId', itemId)
        const results = [];
            search.create({
                type: 'customrecord_tar_expenses',
                filters: [
                    ['custrecord_tar_e_id', "anyof", itemId], "AND", ["custrecord_tar_diem", "is", "T"]
                ],
                columns: [
                    "custrecord_tar_item_diem", 
                    "custrecord_tare_category",
                    "custrecord_tar_expctd_date_depart", 
                    "custrecord_tar_expctd_date_rtn",
                    "custrecord_tar_prcntg",
                    "custrecord_tare_memo", 
                    "custrecord_tare_amount",
                    "custrecord_tare_cost_center", 
                    "custrecord_tare_project_code", 
                    "custrecord_tare_donor",
                    "custrecord_tar_dea", 
                    "custrecord_tare_source_of_funding", 
                    "custrecord_tare_project_task",
                    "custrecord_tar_drc", 
                    "custrecord_tare_approver", 
                    "custrecord_tar_approver_fa",
                    search.createColumn({ name: "custrecord_tar_travel_from", join: "CUSTRECORD_TAR_E_ID", label: "Travel From" }),
                    search.createColumn({ name: "custrecord_tar_travel_to", join: "CUSTRECORD_TAR_E_ID", label: "Travel To" }),
                    search.createColumn({ name: "cost", join: "CUSTRECORD_TAR_ITEM_DIEM", label: "Purchase Price" })
                ]
            }).run().each(res => {
                let pctRaw = res.getValue("custrecord_tar_prcntg");
                let pct = parseFloat(pctRaw) || 0;
                if (typeof pctRaw === 'string' && pctRaw.includes('%')) {
                    pct /= 100;
                } else if (pct > 1) {
                    pct /= 100;
                }

                results.push({
                    itemDiem: res.getValue("custrecord_tar_item_diem"),
                    dateDepart: res.getValue("custrecord_tar_expctd_date_depart"),
                    dateReturn: res.getValue("custrecord_tar_expctd_date_rtn"),
                    percentage: pct,
                    memo: res.getValue("custrecord_tare_memo"),
                    amountBase: parseFloat(res.getValue({name: "cost", join: "CUSTRECORD_TAR_ITEM_DIEM"})) || 0,
                    costCenter: res.getValue("custrecord_tare_cost_center"),
                    projectCode: res.getValue("custrecord_tare_project_code"),
                    sof: res.getValue("custrecord_tare_donor"),
                    dea: res.getValue("custrecord_tar_dea"),
                    sourceOfFunding: res.getValue("custrecord_tare_source_of_funding"),
                    projectTask: res.getValue("custrecord_tare_project_task"),
                    drc: res.getValue("custrecord_tar_drc"),
                    approver: res.getValue("custrecord_tare_approver"),
                    approverFa: res.getValue("custrecord_tar_approver_fa"),
                    travelFrom: res.getValue({ name: "custrecord_tar_travel_from", join: "CUSTRECORD_TAR_E_ID" }),
                    travelTo: res.getValue({ name: "custrecord_tar_travel_to", join: "CUSTRECORD_TAR_E_ID" })
                });
                return true;
            });
            log.debug('results', results)
            return results;
            
    };

    const onRequest = (context) => {
       if (context.request.method === 'GET') {
            let itemId = context.request.parameters.custscript_item_id;
            log.debug('SOF  ID', itemId);
            let allData = searchTar(itemId);
            log.debug('allData', allData)
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });

            if (allData && allData.length > 0) {
                context.response.write(JSON.stringify(allData));
            } else {
                context.response.write(JSON.stringify([])); 
            }
            
        } else {
            context.response.write('POST request received');
        }
    };

    return { onRequest };
});
