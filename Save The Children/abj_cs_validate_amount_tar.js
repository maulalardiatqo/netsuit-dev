/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/search', 'N/url', 'N/https'], function(currentRecord, dialog, log, search, url, https) {

    function pageInit(context) {}
     function saveRecord(context) {
        var rec = context.currentRecord;
        var torId = rec.getValue('custrecord_tar_link_to_tor');
        log.debug('torId', torId)
        console.log('torId', torId)
        if(torId){
            var totalAmountTOR = 0
            const customrecord_torSearchObj = search.create({
            type: "customrecord_tor",
            filters:
            [
                ["custrecord_tori_id.custrecord_tor_transaction_type","anyof","4"], 
                "AND", 
                ["custrecord_tori_id.custrecord_tor_link_tar","anyof","@NONE@"], 
                "AND", 
                ["internalid","anyof",torId]
            ],
            columns:
            [
                search.createColumn({name: "internalid", label: "Internal ID"}),
                search.createColumn({
                    name: "custrecord_tori_amount",
                    join: "CUSTRECORD_TORI_ID",
                    label: "Amount"
                })
            ]
            });
            const searchResultCount = customrecord_torSearchObj.runPaged().count;
            log.debug("customrecord_torSearchObj result count",searchResultCount);
            customrecord_torSearchObj.run().each(function(result){
                var amountTor = result.getValue({
                    name: "custrecord_tori_amount",
                    join: "CUSTRECORD_TORI_ID",
                })
                totalAmountTOR = Number(totalAmountTOR) + Number(amountTor)
            return true;
            });
            log.debug('totalAmountTOR', totalAmountTOR)
            console.log('totalAmountTOR', totalAmountTOR)
            if(totalAmountTOR > 0){
                var totalAmountTAR = 0
                var cekLine = rec.getLineCount({
                    sublistId : 'recmachcustrecord_tar_e_id'
                });
                log.debug('cekLine', cekLine)
                if(cekLine > 0){
                    for(var i = 0; i < cekLine; i++){
                        var amountTar = rec.getSublistValue({
                            sublistId : 'recmachcustrecord_tar_e_id',
                            fieldId : 'custrecord_tare_amount',
                            line : i
                        })
                        log.debug('amountTar', amountTar)
                        totalAmountTAR = Number(totalAmountTAR) + Number(amountTar)
                    }
                }
                log.debug('compare', {totalAmountTAR : totalAmountTAR, totalAmountTOR : totalAmountTOR})
                console.log('compare', {totalAmountTAR : totalAmountTAR, totalAmountTOR : totalAmountTOR})
                if(Number(totalAmountTAR) > Number(totalAmountTOR)){
                    alert('total Amount In TAR is more than total amount TAR in TOR');
                    return false
                }else{
                    return true
                }
            }else{
                alert('total amount TAR in TOR Record is 0');
                return false
            }
        }else{
            return true
        }
        return true
     }
     return{
        pageInit : pageInit,
        saveRecord : saveRecord
     }
})