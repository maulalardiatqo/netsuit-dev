/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/log', 'N/search'], (dialog, log, search) => {
    let torKeysCache = null;
    let lastTorId = null;

    const validateLine = (scriptContext) => {
        const rec = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;
        var sblId 
        var typeTran
        var fieldSOF
        var fieldCostCenter
        var fieldProjectCode
        var fieldItem
        var fieldDea

        if (sublistId !== 'item') return true;

        const cekTor = rec.getValue('custbody_stc_link_to_tor');
        if (!cekTor) return true;

        const transType = rec.type;
        if(transType == 'purchaserequisition'){
            typeTran = '3' 
            sblId = 'item'
            fieldItem = 'item'
            fieldCostCenter = 'department'
            fieldProjectCode = 'class'
            fieldSOF = 'cseg_stc_sof'
            fieldDea = 'projecttask'
        }else if(transType == 'purchaseorder'){
            typeTran = '1' 
            sblId = 'item'
            fieldItem = 'item'
            fieldCostCenter = 'department'
            fieldProjectCode = 'class'
            fieldSOF = 'cseg_stc_sof'
            fieldDea = 'projecttask'
        }else if(transType == 'expense'){
            typeTran = '2'
            sblId = 'expense'
            fieldItem = 'expmediaitem'
            fieldCostCenter = 'department'
            fieldProjectCode = 'class'
            fieldSOF = 'cseg_stc_sof'
            fieldDea = 'projecttask'
        }else if(transType == 'customrecord_tar'){
            typeTran = '2'
            sblId = 'recmachcustrecord_tar_e_id'
            fieldItem = 'custrecord_tare_category'
            fieldCostCenter = 'custrecord_tare_cost_center'
            fieldProjectCode = 'custrecord_tare_project_code'
            fieldSOF = 'custrecord_tare_source_of_funding'
            fieldDea = 'custrecord_tare_project_task'
        }
       

        if (torKeysCache === null || lastTorId !== cekTor) {
            torKeysCache = fetchTorKeys(cekTor, typeTran);
            lastTorId = cekTor;
        }
        console.log('torKeysCache', torKeysCache)
        const itemRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldItem });
        const costCenterRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldCostCenter });
        const projectCodeRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldProjectCode });
        const sofRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldSOF });
        const deaRec = rec.getCurrentSublistValue({ sublistId : sblId, fieldId: fieldDea });

        const currentLineKey = `${itemRec}-${costCenterRec}-${projectCodeRec}-${sofRec}-${deaRec}`;
        console.log('currentLineKey', currentLineKey)
        if (!torKeysCache[currentLineKey]) {
            alert('You Cannot add line');
            return false;
        }

        return true;
    };


    const fetchTorKeys = (torId, typeTrans) => {
        log.debug('System', 'Fetching TOR Data for ID: ' + torId);
        let keys = {};

        const torSearch = search.create({
            type: "customrecord_tor_items",
            filters: [
                ["custrecord_tori_id", "anyof", torId],
                "AND",
                ["custrecord_tor_transaction_type", "anyof", typeTrans]
            ],
            columns: [
                "custrecord_tori_item",
                "custrecord_tori_cost_center",
                "custrecord_tori_project_code",
                "custrecord_tori_source_of_funding",
                "custrecord_tor_project_task"
            ]
        });

        torSearch.run().each(result => {
            let item = result.getValue("custrecord_tori_item");
            let costCenter = result.getValue("custrecord_tori_cost_center");
            let projectCode = result.getValue("custrecord_tori_project_code");
            let sof = result.getValue("custrecord_tori_source_of_funding");
            let dea = result.getValue("custrecord_tor_project_task");

            let key = `${item}-${costCenter}-${projectCode}-${sof}-${dea}`;
            keys[key] = true; 
            return true;
        });

        return keys;
    };

    const fieldChanged = (scriptContext) => {
        if (scriptContext.fieldId === 'custbody_stc_link_to_tor') {
            console.log('tirgger field change on tor')
            torKeysCache = null; 

        }
    };
    const saveRecord = (scriptContext) => {
        console.log('masuk eksekusi script')
        const currentRecord = scriptContext.currentRecord;
        const transactionType = currentRecord.type;
        
        log.debug('transactionTYpe', transactionType)
        var maxAmountLimit = 0
        if(transactionType == 'customrecord_tar'){
            maxAmountLimit = parseFloat(currentRecord.getValue({
                fieldId: 'custrecord_amount_from_tor'
            })) || 0;
        }else{
            maxAmountLimit = parseFloat(currentRecord.getValue({
                fieldId: 'custbody_amount_from_tor'
            })) || 0;
        }
        
        log.debug('maxAmountLimit', maxAmountLimit)
        if(maxAmountLimit && maxAmountLimit > 0){
                let sublistId = '';
                let lineFieldId = '';

                if (transactionType === 'purchaseorder') {
                    sublistId = 'item';
                    lineFieldId = 'amount';
                } else if (transactionType === 'purchaserequisition') {
                    sublistId = 'item';
                    lineFieldId = 'estimatedamount';
                } else if (transactionType === 'expensereport') {
                    sublistId = 'expense';
                    lineFieldId = 'amount';
                } else if(transactionType === 'customrecord_tar'){
                    sublistId = 'recmachcustrecord_tar_e_id';
                    lineFieldId = 'custrecord_tare_amount';
                }

                if (!sublistId) return true;

                try {
                    let totalLineAmount = 0;
                    const lineCount = currentRecord.getLineCount({ sublistId: sublistId });

                    for (let i = 0; i < lineCount; i++) {
                        const lineVal = currentRecord.getSublistValue({
                            sublistId: sublistId,
                            fieldId: lineFieldId,
                            line: i
                        }) || 0;
                        
                        totalLineAmount += parseFloat(lineVal);
                    }

                    if (totalLineAmount > maxAmountLimit) {
                        dialog.alert({
                            title: 'Validasi Amount',
                            message: `Total amount (${totalLineAmount.toLocaleString()}) melebihi nilai Amount from TOR (${maxAmountLimit.toLocaleString()}). \n\nMohon sesuaikan kembali agar tidak melebihi batas.`
                        });
                        return false; 
                    }

                    return true; 
                } catch (e) {
                    log.error('Error on Amount Validation', e.message);
                    return true; 
                }

        }
        return true
    };

    return {
        saveRecord: saveRecord,
        validateLine : validateLine,
        fieldChanged : fieldChanged
    };
});