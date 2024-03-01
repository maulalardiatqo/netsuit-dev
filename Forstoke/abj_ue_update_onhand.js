/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/https","N/record", "N/search", "N/file"], function(
    https, record, search, file
    ) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var recInv = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id
                });
                var invLineCount = recInv.getLineCount({
                    sublistId: 'inventory'
                });
                log.debug('invLineCount', invLineCount)
                if(invLineCount > 0){
                    for (var i = 0; i < invLineCount; i++){
                        var item = recInv.getSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'item',
                            line: i
                        });
                        var itemSearch = search.load({
                            id: 'customsearch3908'
                        });
                        itemSearch.filters.push(search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.ANYOF,
                            values: item    
                        }, ));
                        var itemSearchSet = itemSearch.run();
                        itemSearch = itemSearchSet.getRange(0, 1);
                        log.debug('itemSearch', itemSearch)
                        if(itemSearch.length > 0){
                            var existingRec = itemSearch[0];
                            var sku = existingRec.getValue({
                                name : "itemid"
                            })
                            log.debug('sku', sku)
                            var quantity = existingRec.getValue({
                                name : "quantityonhand"
                            })
                            log.debug('quantity', quantity)
                            var variantUpdate = {
                                variants : [{
                                    sku : sku,
                                    quantity_hand : quantity
                                }]
                            }
                            variantUpdate = JSON.stringify(variantUpdate);
                            let responseLogin = https.post({
                                url: "https://integration.forstok.com/api/v2/auth?id=abdulhakimhsn@gmail.com&secret_key=57246394d2cd0207a0eed96365f62b1b&type=seller&",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            });
                            if (responseLogin.code == 200) {
                                let dataLogin = JSON.parse(responseLogin.body);
                                log.debug("data login", dataLogin);
                                log.debug("data token", dataLogin.data.token);
                                var tokenUrl = dataLogin.data.token;
                                
                                let resPonseVarian = https.post({
                                    url: 'https://accounts.forstok.com/api/v2/variants/quantities.json?user_id=abdulhakimhsn@gmail.com&auth_type=jwt',
                                    body: variantUpdate,
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${tokenUrl}`,
                                        'X-HTTP-Method-Override': 'PATCH'
                                    }
                                });
                                log.debug("resPonseVarian", resPonseVarian);
                                
                            }
                        }
                    }
                }
            }
        }catch (e) {
            err_messages = 'error in after submit ' + e.name + ': ' + e.message;
            log.debug(err_messages);
        }
    }
    
    return {
        afterSubmit: afterSubmit,
    };
});