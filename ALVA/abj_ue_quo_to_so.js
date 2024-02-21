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
  
                var soRec = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: true
                });
                var lineCOunt = soRec.getLineCount({
                    sublistId : "recmachcustrecord_ajb_pembobotan_so_id"
                })
                log.debug('linePembobotanCount', lineCOunt)
                if(lineCOunt > 0){
                    var groupedData = {};
                    for(var i = 0; i < lineCOunt; i++){
                        var soDepartment = soRec.getSublistValue({
                            sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                            fieldId: 'custrecord_abj_pembobotan_department',
                            line: i
                        });
                        var soItem = soRec.getSublistValue({
                            sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                            fieldId: 'custrecord_abj_pembobotan_item',
                            line: i
                        });
                        var soAmount = soRec.getSublistValue({
                            sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                            fieldId: 'custrecord_alva_fix_amount',
                            line: i
                        });
                        var soProsent = soRec.getSublistValue({
                            sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                            fieldId: 'custrecord_abj_pembobotan_persen',
                            line: i
                        });
                        var lineCus = i
                        log.debug('allLineSO', {soDepartment : soDepartment, soItem : soItem, soAmount : soAmount, soProsent : soProsent})
                        var data = {soDepartment : soDepartment, soItem : soItem, soAmount : soAmount, soProsent : soProsent, lineCus : lineCus}
                        if (!groupedData[soItem]) {
                            groupedData[soItem] = [];
                        }
                        groupedData[soItem].push(data);
                    }
                    for (var soItem in groupedData) {
                        if (groupedData.hasOwnProperty(soItem)) {
                            var totalAmount = 0
                            for (var i = 0; i < groupedData[soItem].length; i++) {
                                var data = groupedData[soItem][i];
                                var soAmount = data.soAmount
                                if(soAmount){
                                    totalAmount += parseFloat(soAmount)
                                }
                            }
                            
                            for (var k = 0; k < groupedData[soItem].length; k++) {
                                var dataL = groupedData[soItem][k];
                                log.debug('dataL', dataL)
                                var soAmountL = dataL.soAmount
                                var prosentLine = Number(soAmountL) / totalAmount * 100
                                var lineIndex = dataL.lineCus
                                log.debug('lineIndex', lineIndex);
                                log.debug("totalAmount", totalAmount)
                                log.debug('soAmountL', soAmountL);
                                log.debug('prosentLine', prosentLine);
                                soRec.selectLine({
                                    sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                    line: lineIndex
                                });
                                soRec.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                    fieldId: 'custrecord_abj_pembobotan_persen',
                                    value: prosentLine,
                                });
                                soRec.commitLine({ sublistId: 'recmachcustrecord_ajb_pembobotan_so_id' });
                            }
                        }
                    }
                }
                var crFrom = soRec.getValue('createdfrom');
                if(crFrom){
                    var recQuot = record.load({
                        type : "estimate",
                        id : crFrom,
                        isDynamic: false,
                    })
                    var linePembobotanCount = recQuot.getLineCount({
                        sublistId : 'recmachcustrecord_ajb_pembobotan_so_id'
                    });
                    if(linePembobotanCount > 0){
                        for(var i = 0; i < linePembobotanCount; i ++){
                            var departmentQ = recQuot.getSublistValue({
                                sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                fieldId: 'custrecord_abj_pembobotan_department',
                                line: i
                            });
                            var itemQ = recQuot.getSublistValue({
                                sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                fieldId: 'custrecord_abj_pembobotan_item',
                                line: i
                            });
                            var amountQ = recQuot.getSublistValue({
                                sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                fieldId: 'custrecord_alva_fix_amount',
                                line: i
                            });
                            var prosent = recQuot.getSublistValue({
                                sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                fieldId: 'custrecord_abj_pembobotan_persen',
                                line: i
                            });

                            // setValue
                            soRec.selectNewLine({ sublistId: 'recmachcustrecord_ajb_pembobotan_so_id'});
                            soRec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                fieldId: 'custrecord_abj_pembobotan_persen',
                                value: prosent
                            });
                            soRec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                fieldId: 'custrecord_abj_pembobotan_item',
                                value: itemQ
                            });
                            soRec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                fieldId: 'custrecord_alva_fix_amount',
                                value: amountQ
                            });
                            soRec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_ajb_pembobotan_so_id',
                                fieldId: 'custrecord_abj_pembobotan_department',
                                value: departmentQ
                            });
                            soRec.commitLine({ sublistId: 'recmachcustrecord_ajb_pembobotan_so_id' });

                        }
                        
                        
                    }
                }
                var saveSO = soRec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('save SO', saveSO)
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        afterSubmit : afterSubmit
    };
});