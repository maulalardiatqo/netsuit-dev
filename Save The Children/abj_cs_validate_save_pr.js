/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {
    function saveRecord(context){
        var rec = context.currentRecord;
        var cekDueDate = rec.getValue('duedate');
        if(cekDueDate && cekDueDate != null && cekDueDate != ''){
            var cekPrType = rec.getValue('custbody_stc_pr_category')
            console.log('cekPRType', cekPrType);
            var estimateTotal = Number(rec.getValue('estimatedtotal'))
            if(cekPrType == 1){
                var trandate = rec.getValue('trandate');
                var vdate = rec.getValue('custbody_stc_v_date');
                if (estimateTotal > 2000000 && estimateTotal <= 17000000) {
                    console.log('Original trandate:', trandate);
                    var intervalDateSet = new Date(trandate.getTime());
                    intervalDateSet.setDate(intervalDateSet.getDate() + 7);

                    console.log('intervalDateSet Object:', intervalDateSet);
                    rec.setValue({
                        fieldId: 'custbody_stc_interval_date',
                        value: intervalDateSet
                    });
                }
                if(estimateTotal > 17000000 && estimateTotal <= 200000000){
                    console.log('Original trandate:', trandate);
                    var intervalDateSet = new Date(trandate.getTime());
                    intervalDateSet.setDate(intervalDateSet.getDate() + 14);

                    console.log('intervalDateSet Object:', intervalDateSet);
                    rec.setValue({
                        fieldId: 'custbody_stc_interval_date',
                        value: intervalDateSet
                    });
                }
                if (estimateTotal > 200000000 && estimateTotal <= 2000000000) {
                    var today = new Date(); 
                    console.log('Today:', today);
                    var intervalDateSet = new Date(today.getTime());
                    intervalDateSet.setDate(intervalDateSet.getDate() + 30);

                    console.log('intervalDateSet (Today + 30 days):', intervalDateSet);
                    rec.setValue({
                        fieldId: 'custbody_stc_interval_date',
                        value: intervalDateSet
                    });
                }
                if (estimateTotal > 2000000000) {
                    var today = new Date(); 
                    console.log('Today:', today);
                    var intervalDateSet = new Date(today.getTime());
                    intervalDateSet.setDate(intervalDateSet.getDate() + 90);

                    console.log('intervalDateSet (Today + 30 days):', intervalDateSet);
                    rec.setValue({
                        fieldId: 'custbody_stc_interval_date',
                        value: intervalDateSet
                    });
                }
                var intervalDate = rec.getValue('custbody_stc_interval_date');
                console.log('update intervalDate', intervalDate)
                console.log('trandate', trandate);
                console.log('vdate', vdate)
                if (trandate && vdate) {
                    if (trandate.getTime() >= vdate.getTime()) {
                        if(Number(estimateTotal) <= 2000000){
                            alert('Reject (no procurement process required)  - Amount must be more than 2.000.000');
                            return false; 
                        }
                        if(intervalDate){
                            if(cekDueDate.getTime() < intervalDate.getTime()){
                                if(Number(estimateTotal) > 17000000 && Number(estimateTotal) <= 200000000){
                                    alert('Reject due to amount from 2.000.001 till 17.000.000, Expected Receive By must more than or equal 7 days from created date');
                                    return false
                                }
                                if(Number(estimateTotal) > 2000000 && Number(estimateTotal) <= 17000000){
                                    alert('Reject due to amount from 2.000.001 till 17.000.000, Expected Receive By must more than or equal 7 days from created date');
                                    return false
                                }
                                if(Number(estimateTotal) > 200000000 && Number(estimateTotal) <= 2000000000){
                                    alert('Reject due to Amount from 200.000.001 till 2 .000.000.000, Expected Receive By must more than or equal 30 Days from created date');
                                    return false
                                }
                                 if(Number(estimateTotal) > 2000000000){
                                    alert('Reject due to amount above  2.000.000.0001, Expected Receive By must more than or equal  60 days from created date');
                                    return false
                                }
                            }
                        }
                        
                    }
                }
            }

        }
        return true
    }
    return{
        saveRecord : saveRecord
    }
})
