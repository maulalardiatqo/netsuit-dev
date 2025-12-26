/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record", "N/search"], (runtime, log, record, search) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            var form = context.form;
            var rec = context.newRecord;
            var cForm = rec.getValue('customform');
            log.debug('cForm', cForm)
            if(cForm == 140){
                log.debug('masuk sini')
                form.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                form.addButton({
                    id: 'custpage_btn_calculate',
                    label: "Calculate Debit Credit",
                    functionName: "calculate()"
                });
                var subItem = form.getSublist({
                    id : 'line'
                });
                subItem.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                subItem.addButton({
                    id: 'custpage_btn_calculate',
                    label: "Calculate Debit Credit",
                    functionName: "calculate()"
                });

                var sublistCustom = form.getSublist({
                    id : 'recmachcustrecord_stc_trx_id_allocation'
                })
                sublistCustom.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "generate()"
                });
                sublistCustom.addButton({
                    id: 'custpage_btn_calculate',
                    label: "Calculate Debit Credit",
                    functionName: "calculate()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_je_premis.js"
            }
            if(cForm == 141){
                form.addButton({
                    id: 'custpage_btn_generate_sof',
                    label: "Generate SOF List",
                    functionName: "onClickGenerate()"
                });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_je_non_premis.js"
            }
        }
    }
    function afterSubmit(context) {
        if(context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT){
            
            try {
                var recId = context.newRecord.id;
                var recType = context.newRecord.type;
                var rec = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: true
                });
                var cForm = rec.getValue('customform');
                log.debug('cForm', cForm)
                if(cForm == 140){
                    var lineCount = rec.getLineCount({
                        sublistId: 'line'
                    });

                    if (lineCount > 0) {
                        for (var i = lineCount - 1; i >= 0; i--) {

                            var debit = rec.getSublistValue({
                                sublistId: 'line',
                                fieldId: 'debit',
                                line: i
                            }) || 0;

                            var credit = rec.getSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                line: i
                            }) || 0;

                            if ((credit === 0 || credit === '' || credit == null) &&
                                (debit === 0 || debit === '' || debit == null)) {

                                log.debug('Removing line', 'Line ' + i + ' removed (debit=0 & credit=0)');
                                rec.removeLine({
                                    sublistId: 'line',
                                    line: i
                                });
                            }
                        }

                        rec.save({
                            ignoreMandatoryFields: true
                        });
                        rec = record.load({
                            type: rec.type,
                            id: rec.id,
                            isDynamic: false
                        });
                        var accountHeader = rec.getValue('custbody_stc_source_account_allocation')
                        var newLineCount = rec.getLineCount({ sublistId: 'line' });
                        var sofToLineIndex = {};
                        var allSOFId = [];

                        for (var i = 0; i < newLineCount; i++) {
                            var sofId = rec.getSublistValue({
                                sublistId: 'line',
                                fieldId: 'cseg_stc_sof',
                                line: i
                            });

                            if (!sofId) continue;

                            if (!sofToLineIndex[sofId]) {
                                sofToLineIndex[sofId] = [];
                                allSOFId.push(sofId);
                            }

                            sofToLineIndex[sofId].push(i);
                        }

                        if (allSOFId.length === 0) {
                            log.debug('STOP', 'Tidak ada SOF di line');
                            return;
                        }
                        log.debug('allSOFid', allSOFId)
                        var searchDea = search.load({
                            id: 'customsearch_mapping_dea_je_premise'
                        });

                        var filters = searchDea.filters || [];

                        filters.push(search.createFilter({
                            name: 'custrecord_stc_sof_link',
                            operator: search.Operator.ANYOF,
                            values: allSOFId
                        }));

                        filters.push(search.createFilter({
                            name: 'custrecord_stc_account_allocation',
                            operator: search.Operator.IS,
                            values: accountHeader
                        }));

                        searchDea.filters = filters;
                        log.debug('searchDea', searchDea)
                        var deaBySof = {};

                        searchDea.run().each(function (result) {
                            log.debug('result', result)
                            var sofId = result.getValue({
                                name: 'custrecord_stc_sof_link'
                            });

                            var dea = result.getValue({
                                name: 'custrecord_dea_allocation'
                            });

                            var drc = result.getValue({
                                name: 'custrecord_stc_drc_from_dea'
                            });

                            if (!sofId) return true;

                            deaBySof[sofId] = {
                                dea: dea,
                                drc: drc
                            };

                            return true;
                        });
                        log.debug('deaBySof', deaBySof)
                        Object.keys(deaBySof).forEach(function (sofId) {
                            var lineIndexes = sofToLineIndex[sofId];

                            if (!lineIndexes || !lineIndexes.length) return;

                            lineIndexes.forEach(function (lineIndex) {
                                if (deaBySof[sofId].drc) {
                                    try{
                                        rec.setSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'cseg_stc_drc_segmen',
                                            line: lineIndex,
                                            value: deaBySof[sofId].drc,
                                            enableSourcing : false,
                                            ignoreFieldChange : true
                                        });
                                    }catch(e){
                                        log.debug('error',e)
                                    }
                                    
                                }
                                if (deaBySof[sofId].dea) {
                                    try{
                                        rec.setSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'cseg_stc_segmentdea',
                                            line: lineIndex,
                                            value: deaBySof[sofId].dea,
                                            enableSourcing : false,
                                            ignoreFieldChange : true
                                        });
                                    }catch(e){
                                        log.debug('error',e)
                                    }
                                    
                                }

                                
                            });
                        });
                        rec.save({
                            ignoreMandatoryFields: true
                        });
                        
                    }
                }
                

            } catch (e) {
                log.error('Error afterSubmit', e);
            }
        }
    }
return {
    beforeLoad: beforeLoad,
    afterSubmit : afterSubmit
};
});