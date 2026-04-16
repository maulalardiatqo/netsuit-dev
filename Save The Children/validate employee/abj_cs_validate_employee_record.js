
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/dialog', 'N/log', 'N/runtime', 'N/currentRecord', 'N/ui/message', 'N/url', 'N/https', 'N/format'], (search, dialog, log, runtime, currentRecord, message, url, https, format) => {
    function getEmployeeBalance(employeeId) {
        var todayUtc = new Date();
        var date = format.format({
            value: todayUtc,
            type: format.Type.DATE
        });

        var allCAIds = [];
        var totalCAAmount = 0;

        var caSearch = search.create({
            type: 'expensereport',
            filters: [
                ['mainline', 'is', true], 'AND',
                ['custbody_stc_expense_report_type', 'is', 1], 'AND',
                ['trandate', 'onorbefore', date], 'AND',
                ['approvalstatus', 'is', 2], 'AND',
                ['status', 'noneof', 'ExpRept:V'], 'AND',
                ['entity', 'anyof', employeeId]
            ],
            columns: ['amount']
        });

        caSearch.run().each(function(res) {
            allCAIds.push(res.id);
            totalCAAmount += parseFloat(res.getValue('amount')) || 0;
            return true;
        });

        if (allCAIds.length === 0) {
            return { balance: 0, caAmount: 0, realization: 0, deposit: 0 };
        }

        var totalRealization = 0;
        var realizSearch = search.create({
            type: 'expensereport',
            filters: [
                ['mainline', 'is', false], 'AND', ['taxline', 'is', false], 'AND',
                ['trandate', 'onorbefore', date], 'AND',
                ['approvalstatus', 'is', 2]
            ],
            columns: [
                'amount', 
                'customform', 
                'custbody_stc_link_expense_report', 
                'custbody_stc_link_expense_report_prtnr'
            ]
        });

        realizSearch.run().each(function(res) {
            var amount = parseFloat(res.getValue('amount')) || 0;
            if (amount < 0) return true; 

            var customForm = res.getValue('customform');
            var caId;

            if (Number(customForm) == 139) {
                caId = res.getValue('custbody_stc_link_expense_report_prtnr');
            } else {
                caId = res.getValue('custbody_stc_link_expense_report');
            }

            if (caId && allCAIds.indexOf(caId) !== -1) {
                totalRealization += amount;
            }
            return true;
        });

        var totalDeposit = 0;
        var depositSearch = search.create({
            type: 'deposit',
            filters: [
                ['mainline', 'is', true], 'AND',
                ['custbody_stc_tipe_deposit', 'is', 1], 'AND',
                ['custbody_stc_link_ca_deposit', 'anyof', allCAIds], 'AND',
                ['trandate', 'onorbefore', date]
            ],
            columns: ['amount']
        });

        depositSearch.run().each(function(res) {
            totalDeposit += parseFloat(res.getValue('amount')) || 0;
            return true;
        });

        var balance = totalCAAmount - totalRealization - totalDeposit;

        return {
            employeeId: employeeId,
            caAmount: totalCAAmount,
            realization: totalRealization,
            deposit: totalDeposit,
            balance: balance < 0 ? 0 : balance 
        };
    }
    function disableButton() {
        var btn = document.getElementById('custpage_button_resignation');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    }
    function resignation(regId){
        try {
            disableButton();
            var rec = currentRecord.get();
            var empId = rec.id;

            var msg = message.create({
                title: 'Please wait',
                message: 'Processing resignation...',
                type: message.Type.INFORMATION
            });

            msg.show({ duration: 0 });

            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_abj_sl_resign_emp',
                deploymentId: 'customdeploy_abj_sl_resign_emp',
                params: {
                    regId: regId,
                    empId: empId
                }
            });

            setTimeout(function () {

                var response = https.get({
                    url: suiteletUrl
                });

                msg.hide();

                var result;
                try {
                    result = JSON.parse(response.body);
                } catch (e) {
                    result = {
                        success: false,
                        message: 'Invalid response from server'
                    };
                }

                dialog.alert({
                    title: result.success ? 'Success' : 'Error',
                    message: result.message || 'No message'
                }).then(function () {
                    location.reload();
                });

            }, 100);

        } catch (e) {
            console.error(e);

            dialog.alert({
                title: 'Error',
                message: e.message
            });
        }
    }
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
                    alert('Status karyawan tidak dapat diubah menjadi nonaktif sebelum semua item checklist offboarding diselesaikan')
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
                    alert('Checklist TDU untuk proses offboarding tidak dapat dilakukan karena masih terdapat aset yang terdaftar pada karyawan')
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
                    alert('Checklist Supply Chain untuk proses offboarding tidak dapat dilakukan karena masih terdapat aset supply chain yang terdaftar pada karyawan')
                    context.currentRecord.setValue({
                        fieldId : 'custentity_stc_supply_chain',
                        value : false,
                        ignoreFieldChange: true
                    });
                }
            }
            if (context.fieldId == 'custentity_stc_finance_advance') {
                var currec = context.currentRecord;
                
                var isChecked = currec.getValue({ fieldId: 'custentity_stc_finance_advance' });
                
                if (isChecked) {
                    var idEmp = currec.id;
                    
                    var cekBalance = getEmployeeBalance(idEmp);
                    console.log('cekBalance', cekBalance);

                    if (cekBalance.balance > 0) {
                        alert('Checklist Finance Advance tidak dapat dilakukan karena masih terdapat sisa saldo sebesar Rp ' + cekBalance.balance + 'pada karyawan');
                        
                        currec.setValue({
                            fieldId: 'custentity_stc_finance_advance',
                            value: false,
                            ignoreFieldChange: true
                        });
                    }
                }
            }
            

        }catch(e){
            console.log('error', e)
        }
    }
    const saveRecord = (context) => {
        try {
            return true
        }catch(e){
            console.log('eroor', e)
        }
    }

    return{
        saveRecord : saveRecord,
        fieldChanged : fieldChanged,
        resignation : resignation
    }
});