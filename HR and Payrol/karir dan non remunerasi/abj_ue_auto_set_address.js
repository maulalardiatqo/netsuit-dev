/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
    record,
    search,
    ) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
    
                var recordTRans = record.load({
                    type: rec.type,
                    id: rec.id,
                });
                var address = recordTRans.getValue("defaultaddress");
                log.debug('address', address);  
                var idRec = rec.id
                var searchKarirRem = search.create({
                    type : "customrecord_remunasi",
                    filters:
                    [
                        ["custrecord3","anyof",idRec]
                    ],
                    columns:
                    [
                        search.createColumn({name: "internalid", })
                    ]
                })
                var searchKarirRemSet = searchKarirRem.run();
                var searchKarirRemResult = searchKarirRemSet.getRange({
                    start: 0,
                    end: 1,
                });
                if(searchKarirRemResult.length > 0){
                    var recRemu = searchKarirRemResult[0]
                    var idKarir = recRemu.getValue({
                        name : "internalid"
                    });
                    log.debug('idKarir', idKarir);
                    var recKarir = record.load({
                        type : "customrecord_remunasi",
                        id : idKarir
                    });
                    recKarir.setValue({
                        fieldId: "custrecord_abj_msa_alamat",
                        value: address,
                        
                    })
                    recKarir.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                    })

                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    }
});