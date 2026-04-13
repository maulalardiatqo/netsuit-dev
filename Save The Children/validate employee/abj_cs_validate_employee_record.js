
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/dialog', 'N/log', 'N/runtime', 'N/currentRecord'], (search, dialog, log, runtime, currentRecord) => {
    function cekKondisiInactive(rec){
        try{
            var isValidate = false
            var tdu = rec.getValue('custentity_stc_tdu_asset');
            var supplyChan = rec.getValue('custentity_stc_supply_chain');
            var financeAdvance = rec.getValue('custentity_stc_finance_advance');
            var hrField = rec.getValue('custentity_stc_hr');
            console.log('dataKondisi', {
                tdu : tdu,
                supplyChan : supplyChan,
                financeAdvance : financeAdvance,
                hrField : hrField
            })
            if(tdu && supplyChan && financeAdvance && hrField){
                isValidate = true
            }
            return isValidate
        }catch(e){
            console.log('error', e)
        }
    }
    function cekTDU(idEmp){
        try{
            console.log('idEmp', idEmp)
            var isValidate = true
            const customrecord_ncfar_assetSearchObj = search.create({
            type: "customrecord_ncfar_asset",
            filters:
            [
                ["custrecord_assettype","anyof","4","5","6","7","8","9"], 
                "AND", 
                ["custrecord_assetcaretaker","anyof",idEmp]
            ],
            columns:
            [
                search.createColumn({name: "name", label: "ID"}),
                search.createColumn({name: "altname", label: "Name"}),
                search.createColumn({name: "custrecord_assetcaretaker", label: "Custodian"}),
                search.createColumn({name: "custrecord_assetdescr", label: "Asset Description"}),
                search.createColumn({name: "custrecord_assettype", label: "Asset Type"}),
                search.createColumn({name: "custrecord_assetcost", label: "Asset Original Cost"}),
                search.createColumn({name: "custrecord_assetcurrentcost", label: "Asset Current Cost"}),
                search.createColumn({name: "custrecord_assetaccmethod", label: "Depreciation Method"}),
                search.createColumn({name: "custrecord_assetlifetime", label: "Asset Lifetime"}),
                search.createColumn({name: "custrecord_assetstatus", label: "Asset Status"}),
                search.createColumn({name: "custrecord_componentof", label: "Component Of"}),
                search.createColumn({name: "cseg1", label: "Business Unit"}),
                search.createColumn({name: "custrecord_ncfar_quantity", label: "Quantity"})
            ]
            });
            const searchResultCount = customrecord_ncfar_assetSearchObj.runPaged().count;
            console.log('searchResultCount', searchResultCount)
            if(searchResultCount > 0){
                isValidate = false
            }
            return isValidate
        }catch(e){
            console.log('error', e)
        }
    }
    function cekSuply(idEmp){
        try{
            var isValidate = true
            const customrecord_ncfar_assetSearchObj = search.create({
            type: "customrecord_ncfar_asset",
            filters:
            [
                ["custrecord_assettype","noneof","8","7","9","4","5","6"], 
                "AND", 
                ["custrecord_assetcaretaker","anyof",idEmp]
            ],
            columns:
            [
                search.createColumn({name: "name", label: "ID"}),
                search.createColumn({name: "altname", label: "Name"}),
                search.createColumn({name: "custrecord_assetcaretaker", label: "Custodian"}),
                search.createColumn({name: "custrecord_assetdescr", label: "Asset Description"}),
                search.createColumn({name: "custrecord_assettype", label: "Asset Type"}),
                search.createColumn({name: "custrecord_assetcost", label: "Asset Original Cost"}),
                search.createColumn({name: "custrecord_assetcurrentcost", label: "Asset Current Cost"}),
                search.createColumn({name: "custrecord_assetaccmethod", label: "Depreciation Method"}),
                search.createColumn({name: "custrecord_assetlifetime", label: "Asset Lifetime"}),
                search.createColumn({name: "custrecord_assetstatus", label: "Asset Status"}),
                search.createColumn({name: "custrecord_componentof", label: "Component Of"}),
                search.createColumn({name: "cseg1", label: "Business Unit"}),
                search.createColumn({name: "custrecord_ncfar_quantity", label: "Quantity"})
            ]
            });
            const searchResultCount = customrecord_ncfar_assetSearchObj.runPaged().count;
            console.log('searchResultCount', searchResultCount)
            if(searchResultCount > 0){
                isValidate = false
            }
            return isValidate
        }catch(e){
            console.log('error', e)
        }
    }
    const fieldChanged = (context) => {
        try{
            if(context.fieldId == 'isinactive'){
                var isValidate = cekKondisiInactive(context.currentRecord);
                console.log('isValidate', isValidate)
                if(!isValidate){
                    alert('Masih ada validasi yang belum terselesaikan')
                    context.currentRecord.setValue({
                        fieldId : 'isinactive',
                        value : false,
                        ignoreFieldChange: true
                    });
                }
            }
            if(context.fieldId == 'custentity_stc_tdu_asset'){
                var currec = context.currentRecord
                var idEmp = currec.id
                var isVlidate = cekTDU(idEmp);
                console.log('isVlidate', isVlidate)
                if(!isVlidate){
                    alert('Masih ada validasi yang belum terselesaikan')
                    context.currentRecord.setValue({
                        fieldId : 'custentity_stc_tdu_asset',
                        value : false,
                        ignoreFieldChange: true
                    });
                }
            }
            if(context.fieldId == 'custentity_stc_supply_chain'){
                var currec = context.currentRecord
                var idEmp = currec.id
                var isVlidate = cekSuply(idEmp);
                console.log('isVlidate', isVlidate)
                if(!isVlidate){
                    alert('Masih ada validasi yang belum terselesaikan')
                    context.currentRecord.setValue({
                        fieldId : 'custentity_stc_supply_chain',
                        value : false,
                        ignoreFieldChange: true
                    });
                }
            }

        }catch(e){
            console.log('error', e)
        }
    }
    const saveRecord = (context) => {
        try {

        }catch(e){
            console.log('eroor', e)
        }
    }

    return{
        saveRecord : saveRecord,
        fieldChanged : fieldChanged
    }
});