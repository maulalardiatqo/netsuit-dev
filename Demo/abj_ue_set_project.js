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
            if (context.type == context.UserEventType.CREATE) {
                var rec = context.newRecord;
  
                var soRec = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true,
                });
                var trandId = soRec.getValue('tranid');
                var idSub = soRec.getValue('subsidiary')
                log.debug('trandId', trandId);
                log.debug('idSub', idSub);

                var valueForSegment = 'Proyek' + ' ' + trandId
                log.debug('valueForSegment', valueForSegment);
                
                // rec Segment
                var newSegmentValue = record.create({
                    type: 'customrecord_cseg3'
                });
                newSegmentValue.setValue ({
                    fieldId: 'name',
                    value: valueForSegment
                });
                newSegmentValue.setValue ({
                    fieldId: 'cseg3_filterby_subsidiary',
                    value: idSub
                });
                var saveSegment = newSegmentValue.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                var countLine = soRec.getLineCount({
                    sublistId : 'item'
                });
                log.debug('countLine', countLine)
                if(countLine > 0){
                    for(var i = 0; i < countLine; i++){
                        soRec.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        log.debug('saveSegment', saveSegment)
                        soRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'cseg3',
                            value: saveSegment,
                        });
                        soRec.commitLine({ sublistId: 'item' });
                    }
                    var saveSo = soRec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('saveSo', saveSo)
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    };
});