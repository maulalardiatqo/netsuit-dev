/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record", "N/search"], (runtime, log, record, search) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            
            var recLoad = record.load({
                type : 'customrecord_tor',
                id : rec.id
            });
            var showBtn = false;
            var cekStatusAPp = recLoad.getValue('custrecord_tor_status')
            var cekListAmendment = recLoad.getValue('custrecord_abj_tor_amendment_list');
            var isAmendment = recLoad.getValue('custrecord_source_tor_amendment');
            log.debug('cekListAmendment length', cekListAmendment.length)
            if(cekStatusAPp == '2'){
                if(cekListAmendment.length < 3){
                    if(isAmendment == "" || isAmendment == null){
                        showBtn = true
                    }
                    
                }
            }
            if(showBtn){
                form.addButton({ id: 'custpage_btn_transform_pr', label: "TOR Amendment", functionName: "amandement()" });
                context.form.clientScriptModulePath = "SuiteScripts/abj_cs_tor_amendment.js";
            }
            
        }
        if(context.type === context.UserEventType.EDIT){
            var rec = context.newRecord;
            var cekSource = rec.getValue('custrecord_source_tor_amendment');
            if(cekSource && cekSource != ''){
                
            }
        }
    }
    function afterSubmit(context) {
        try {
            if(context.type == context.UserEventType.CREATE){
                const newRec = context.newRecord;
                var newRecLoad = record.load({
                    type : newRec.type,
                    id : newRec.id,
                    isDynamic : false
                });
                var sourceTor = newRecLoad.getValue('custrecord_source_tor_amendment');
                log.debug('sourceTor', sourceTor)
                if(sourceTor && sourceTor != ''){
                    var cekSource = record.load({
                        type : newRec.type,
                        id : sourceTor
                    })
                    var torNo = cekSource.getValue('name');
                    var cekAmandement = cekSource.getValue('custrecord_abj_tor_amendment_list');
                    log.debug('cekAmandement', cekAmandement)
                    var newTorNo
                    if(cekAmandement.length < 1){
                        newTorNo = torNo + '/A1';
                    }else if(cekAmandement.length == 1){
                        newTorNo = torNo + '/A2';
                    }else{
                        newTorNo = torNo + '/A3';
                    }
                    log.debug('newTorNo', newTorNo)
                    if(newTorNo){
                        log.debug('masuk konisi')
                        newRecLoad.setValue({
                            fieldId : 'name',
                            value : newTorNo
                        })
                        var cekNomerDok = newRecLoad.getValue('name')
                        log.debug('cekNomerDok', cekNomerDok)
                        const saveID = newRecLoad.save();
                        log.debug('saveID', saveID)
                    }
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        beforeLoad : beforeLoad,
        afterSubmit : afterSubmit
    }
});