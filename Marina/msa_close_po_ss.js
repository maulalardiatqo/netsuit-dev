/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 *
 * Created By : Susini
 * Date 11/11/2023
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/format', 'N/http', 'N/encode', 'N/file', 'N/query', 'N/url', 'N/https'],
    function (search, record, email, runtime, format, http, encode, file, query, url, https) {
        
        function execute(context) {

            try {

                var searchPO = search.create({
                    type: "purchaseorder",
                    filters:
                        [
                            ["mainline", "is", "T"], "AND",
                            ["status", "anyof", "PurchOrd:D"],
                        ],
                    columns:
                        [
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "postingperiod", label: "Period" }),
                            search.createColumn({ name: "type", label: "Type" }),
                            search.createColumn({ name: "entity", label: "Name" }),
                            search.createColumn({ name: "account", label: "Account" }),
                            search.createColumn({ name: "memo", label: "Memo" }),
                            search.createColumn({ name: "amount", label: "Amount" })
                        ]
                }).run().getRange(0, 1000);

                log.debug('searchPO : '+searchPO.length, searchPO);

                if(searchPO.length > 0){
                    for(var a = 0; a < searchPO.length; a++){
                        var id_po = searchPO[a].id;
                        log.debug('id_po', id_po);
                        var poRecord = record.load({
                            type: record.Type.PURCHASE_ORDER,
                            id: id_po,
                            isDynamic: true
                        });

                        poRecord.setValue({
                            fieldId: 'orderstatus',
                            value: 'H' // 'C' represents the 'Closed' status
                        });

                        var lineCount = poRecord.getLineCount('item');
                        for(var a = 0; a < lineCount; a++){
                            poRecord.selectLine({
                                sublistId: 'item',
                                line: a
                            });
                            poRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: "isclosed", value: true });
                            poRecord.commitLine({ sublistId: "item" });
                        }

                        var updatedPoId = poRecord.save();
                    }
                }

            } catch (e) {
                log.debug({
                    "title": "Error",
                    "details": e.toString()
                });
            }
        }
        return {
            execute: execute
        };
    });