/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/record'], function (url, log, record) {
     function afterSubmit(context){
        try {
            if (context.type == context.UserEventType.CREATE) {
                var rec = context.newRecord;
                var idRec = rec.id;
                var recSo = record.load({
                    type : record.Type.SALES_ORDER,
                    id : idRec,
                });
                var cekTransType = recSo.getValue('custbody_sos_transaction_types')
                log.debug('cekTransType', cekTransType)
                if(cekTransType == '2'){
                    var customerId = recSo.getValue('entity');
                    var location = recSo.getValue('location');
                    var department = recSo.getValue('department');
                    var classId = recSo.getValue('class');
                    var trandate = recSo.getValue('trandate');
                    log.debug('trandate', trandate)
                    var recDeposit = record.create({
                        type: record.Type.CUSTOMER_DEPOSIT,
                        isDynamic: false
                    });
                    recDeposit.setValue({
                        fieldId: 'customer',
                        value : customerId
                    });
                    recDeposit.setValue({
                        fieldId: 'salesorder',
                        value : idRec
                    });
                    recDeposit.setValue({
                        fieldId: 'trandate',
                        value : trandate
                    });
                    if(location){
                        recDeposit.setValue({
                            fieldId: 'location',
                            value : location
                        })
                    }
                    if(department){
                        recDeposit.setValue({
                            fieldId: 'department',
                            value : department
                        })
                    }
                    if(classId){
                        recDeposit.setValue({
                            fieldId: 'class',
                            value : classId
                        })
                    }
                    var depositId = recDeposit.save({ enableSourcing: true, ignoreMandatoryFields: false });
                    log.debug('Customer Deposit created', depositId);
                    
                }
            }
        }catch(e){
            log.debug('error', e);
        }
    }
    return{
        afterSubmit : afterSubmit
    }
})