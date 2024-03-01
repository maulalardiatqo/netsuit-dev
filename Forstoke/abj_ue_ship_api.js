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
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.PACK || context.type == context.UserEventType.SHIP){
                var rec = context.newRecord;
                var idRec = rec.id

                var recIf = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id
                });
                var shipStatus = recIf.getValue('shipstatus');

                log.debug('shipStatus', shipStatus)
                    var crFrom = recIf.getValue('createdfrom')
                    if(crFrom){
                        var recSo = record.load({
                            type : 'salesorder',
                            id : crFrom
                        });
                        var orderId = recSo.getValue('otherrefnum');
                        log.debug('orderId', orderId);
                        var dataBody = {
                            order_id : orderId
                        }
                        dataBody = JSON.stringify(dataBody);
                        let responseLogin = https.post({
                            url: "https://integration.forstok.com/api/v2/auth?id=abdulhakimhsn@gmail.com&secret_key=57246394d2cd0207a0eed96365f62b1b&type=seller&",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        });
                        log.debug('responseLogin', responseLogin)
                        if (responseLogin.code == 200) {
                            let dataLogin = JSON.parse(responseLogin.body);
                            log.debug("data login", dataLogin);
                            log.debug("data token", dataLogin.data.token);
                            var tokenUrl = dataLogin.data.token;
                            if(shipStatus == 'B'){
                                let response = https.post({
                                    url: 'https://accounts.forstok.com/api/v1/orders/confirm.json?user_id=abdulhakimhsn@gmail.com&auth_type=jwt',
                                    body: dataBody,
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${tokenUrl}`,
                                    }
                                });
                                
                                log.debug("response data", response);
                            }
                            if(shipStatus == 'C'){
                                let responeReadytoShip = https.post({
                                    url: 'https://accounts.forstok.com/api/v2/orders/fulfills_seller.json?user_id=abdulhakimhsn@gmail.com&auth_type=jwt&order_id=' + orderId + '',
                                    body: '',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${tokenUrl}`,
                                    }
                                })
                                
                                log.debug("responeReadytoShip", responeReadytoShip);
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