/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function pageInit(context) {
        console.log('init masuk')
    }
    function searchData(id) {
        var percentage = null; 

        var customrecord_stc_setup_deduction_diemSearchObj = search.create({
            type: "customrecord_stc_setup_deduction_diem",
            filters: [
                ["internalid", "anyof", id]
            ],
            columns: [
                search.createColumn({ name: "custrecord_sdd_percentage", label: "Percentage" })
            ]
        });

        // jalankan hanya sekali (karena id unik)
        var result = customrecord_stc_setup_deduction_diemSearchObj.run().getRange({ start: 0, end: 1 });
        
        if (result && result.length > 0) {
            percentage = result[0].getValue("custrecord_sdd_percentage");
        }

        log.debug("Percentage value", percentage);
        return percentage; // kembalikan nilainya
    }
    function processDeduction(idSearch, records, rate, isReverse) {
        var percentage = searchData(idSearch);
        console.log('percentage (raw):', percentage);

        var percentageValue = parseFloat(String(percentage).replace('%', '').trim()) || 0;
        console.log('percentageValue (number):', percentageValue);

        var deduction = records.getCurrentSublistValue({
            sublistId: 'recmachcustrecord_terd_id',
            fieldId: 'custrecord_terd_deduction_totall'
        }) || 0;

        var amount = records.getCurrentSublistValue({
            sublistId: 'recmachcustrecord_terd_id',
            fieldId: 'custrecord_terd_amount'
        }) || 0;

        var countPercentage = Number(rate) * (percentageValue / 100);
        console.log('countPercentage', countPercentage);

        var newDeduction, newAmount;

        if (!isReverse) {
            newDeduction = Number(deduction) + Number(countPercentage);
            newAmount = Number(rate) - Number(newDeduction);
            console.log('Mode: NORMAL');
        } else {
            newDeduction = Number(deduction) - Number(countPercentage);
            newAmount = Number(rate) - Number(newDeduction);
            console.log('Mode: REVERSE');
        }

        records.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_terd_id',
            fieldId: 'custrecord_terd_deduction_totall',
            value: newDeduction
        });

        records.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_terd_id',
            fieldId: 'custrecord_terd_amount',
            value: newAmount
        });

        console.log('newDeduction:', newDeduction, 'newAmount:', newAmount);
    }

    function fieldChanged(context){
        var sublistFieldName = context.fieldId;
        var sublistName = context.sublistId;
        if(sublistName == 'recmachcustrecord_terd_id'){
            var rate = records.getCurrentSublistValue({
                sublistId : 'recmachcustrecord_terd_id',
                fieldId : 'custrecord_terd_rate'
            })
            if(sublistFieldName == 'custrecord_terd_rate'){
                var cekrate = records.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_terd_id',
                    fieldId : 'custrecord_terd_rate'
                })
                if(cekrate){
                    records.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_terd_id',
                        fieldId: 'custrecord_terd_amount',
                        value : cekrate
                    })
                }
                
            }
            if(sublistFieldName == 'custrecord_terd_breakfast'){
                var breakFirst = records.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_terd_id',
                    fieldId : 'custrecord_terd_breakfast'
                })
                console.log('rate', rate)
                if(rate){
                    if (breakFirst === true) {
                        processDeduction(1, records, rate, false)

                    } else {
                        processDeduction(1, records, rate, true)
                    }


                }else{
                    alert('please enter value for rate');
                    return false
                }
            }
            if(sublistFieldName == 'custrecord_terd_lunch'){
                var lunch = records.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_terd_id',
                    fieldId : 'custrecord_terd_lunch'
                })
                console.log('rate', rate)
                if(rate){
                    if (lunch === true) {
                        processDeduction(2, records, rate, false)

                    } else {
                        processDeduction(2, records, rate, true)
                    }


                }else{
                    alert('please enter value for rate');
                    return false
                }
            }
            if(sublistFieldName == 'custrecord_terd_diner'){
                var dinner = records.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_terd_id',
                    fieldId : 'custrecord_terd_diner'
                })
                console.log('rate', rate)
                if(rate){
                    if (dinner === true) {
                        processDeduction(3, records, rate, false)

                    } else {
                        processDeduction(3, records, rate, true)
                    }


                }else{
                    alert('please enter value for rate');
                    return false
                }
            }
            if(sublistFieldName == 'custrecord_terd_incidental'){
                var incred = records.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_terd_id',
                    fieldId : 'custrecord_terd_incidental'
                })
                console.log('rate', rate)
                if(rate){
                    if (incred === true) {
                        processDeduction(4, records, rate, false)

                    } else {
                        processDeduction(4, records, rate, true)
                    }


                }else{
                    alert('please enter value for rate');
                    return false
                }
            }

        }
    }
    return{
        pageInit : pageInit,
        fieldChanged : fieldChanged
    }
})
