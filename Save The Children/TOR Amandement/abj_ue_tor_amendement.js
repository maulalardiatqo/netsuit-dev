/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record", "N/search"], (runtime, log, record, search) => {

    function generateUniqueAmendmentName(recType, torNo, sourceId, excludeRecId) {
        var usedSuffixes = {};

        var filters = [
            ['custrecord_source_tor_amendment', 'anyof', sourceId]
        ];
        if (excludeRecId) {
            filters.push('AND');
            filters.push(['internalid', 'noneof', excludeRecId]);
        }

        var s = search.create({
            type: recType,
            filters: filters,
            columns: ['name']
        });

        s.run().each(function (result) {
            var nm = result.getValue({ name: 'name' }) || '';
            var match = nm.match(/\/A(\d+)$/i);
            if (match) {
                usedSuffixes[parseInt(match[1], 10)] = true;
            }
            return true;
        });

        var n = 1;
        while (usedSuffixes[n]) {
            n++;
        }
        return torNo + '/A' + n;
    }

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

                    var newTorNo = generateUniqueAmendmentName(
                        newRec.type,
                        torNo,
                        sourceTor,
                        newRec.id
                    );

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