/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/search', 'N/https', 'N/url', 'N/runtime', 'N/log'], 
function(currentRecord, search, https, url, runtime, log) {

function getTarAmount(id) {
        let alocatAmount = 0;
        let idArray = [];

        if (id) {
            if (Array.isArray(id)) idArray = id;
            else if (typeof id === 'string') idArray = id.split(',');
            else idArray = [id];
        }

        if (idArray.length === 0) return 0;

        const tarSearch = search.create({
            type: "customrecord_tar",
            filters: [["internalid", "anyof", idArray]],
            columns: [
                search.createColumn({
                    name: "custrecord_tare_amount",
                    join: "CUSTRECORD_TAR_E_ID"
                })
            ]
        });

        tarSearch.run().each(function(result) {
            let amt = result.getValue({
                name: "custrecord_tare_amount",
                join: "CUSTRECORD_TAR_E_ID"
            }) || 0;
            alocatAmount += Number(amt);
            return true;
        });
        log.debug('alocatAmount', alocatAmount)
        return alocatAmount;
    }


function saveRecord(context) {
    const rec = context.currentRecord;
    const typeRec = rec.type;

    if (typeRec == 'customrecord_tar') {
        const torId = rec.getValue('custrecord_tar_link_to_tor');
        const currentTarId = rec.id; 

        if (torId) {
            let totalAmountTOR = 0;
            let totalAmountOtherTars = 0;

            const torSearch = search.create({
                type: "customrecord_tor",
                filters: [
                    ["custrecord_tori_id.custrecord_tor_transaction_type", "anyof", "4"],
                    "AND",
                    ["internalid", "anyof", torId]
                ],
                columns: [
                    { name: "custrecord_tori_amount", join: "CUSTRECORD_TORI_ID" },
                    { name: "custrecord_tor_link_tar", join: "CUSTRECORD_TORI_ID" }
                ]
            });

            torSearch.run().each(function(result) {
                let amtTor = result.getValue({ name: "custrecord_tori_amount", join: "CUSTRECORD_TORI_ID" }) || 0;
                totalAmountTOR += Number(amtTor);

                let cekTar = result.getValue({ name: "custrecord_tor_link_tar", join: "CUSTRECORD_TORI_ID" });
                if (cekTar) {
                    let tarIds = [];
                    if (Array.isArray(cekTar)) tarIds = cekTar;
                    else if (typeof cekTar === 'string') tarIds = cekTar.split(',');
                    else tarIds = [cekTar];

                    let otherTarIds = tarIds.filter(id => id != currentTarId);

                    if (otherTarIds.length > 0) {
                        totalAmountOtherTars += getTarAmount(otherTarIds);
                    }
                }
                return true;
            });

            let remainingQuota = Number(totalAmountTOR) - Number(totalAmountOtherTars);
            let currentTarInputAmount = 0;
            let sublistId = 'recmachcustrecord_tar_e_id';
            let lineCount = rec.getLineCount({ sublistId: sublistId });

            for (let i = 0; i < lineCount; i++) {
                let lineAmt = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_tare_amount',
                    line: i
                }) || 0;
                currentTarInputAmount += Number(lineAmt);
            }

            if (totalAmountTOR === 0 || remainingQuota < 0) {
                alert('Total amount TAR in TOR Record is 0 or already fully allocated.');
                return false;
            }

            if (currentTarInputAmount > remainingQuota) {
                alert('Total Amount in this TAR (' + currentTarInputAmount + ') exceeds remaining quota in TOR (' + remainingQuota + ')');
                return false;
            }
        }
    }

    return true;
}

    return { pageInit: (ctx) => {}, saveRecord: saveRecord };
});