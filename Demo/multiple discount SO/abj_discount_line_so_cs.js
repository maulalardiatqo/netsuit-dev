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
    function roundToTwoDigits(value) {
        return Math.round(value * 100) / 100;
    }
    function updateDiscHeader(params){
        console.log('sublist change')
        var itemCount = records.getLineCount({ sublistId: 'item' });
        console.log('itemCount', itemCount);
        var totalAmount = 0
        var totalDiscOnLine = 0
        var totalAfterDisc = 0
        var isCount = true;
        for (var i = 0; i < itemCount; i++) {
            var amount = records.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
            var totalDiscline = records.getSublistValue({ sublistId: 'item', fieldId: 'custcol_abj_total_line_disc_so', line: i });
            var discInLine = records.getSublistValue({sublistId : 'item', fieldId : 'custcol_abj_disc1_so', line : i});
            var afterDiscLineSo = records.getSublistValue({sublistId : 'item', fieldId : 'custcol_abj_after_disc_line_so', line : i});
            if(params == "line"){
                if(discInLine == ''){
                    isCount = false
                }
            }
            totalAfterDisc += Number(afterDiscLineSo)
            totalAmount += Number(amount);
            console.log('totalDiscline', totalDiscline)
            
            totalDiscOnLine += Number(totalDiscline);
        }
        if(isCount){
            console.log('isCOunt')
            var afterDiscLine = Number(totalAmount) - Number(totalDiscOnLine);
            var disc1 = records.getValue({
                fieldId: 'custbody_abj_disc1_so',
            });
            console.log('disc1', disc1)
            var disc2 = records.getValue({
                fieldId: 'custbody_abj_disc2_so',
            });
            var disc3 = records.getValue({
                fieldId: 'custbody_abj_disc3_so',
            });
            
            if(disc1 == '' || disc2 == '' || disc3 == ''){
                console.log('masuk if')
            }else{
                console.log('afterDiscLine', totalAfterDisc);
                var head1 = (Number(disc1)/100)*Number(totalAfterDisc)
                head1 = roundToTwoDigits(head1)
                records.setValue({
                    fieldId : 'custbody_abj_total_disc1_so',
                    value : head1,
                    ignoreFieldChange: true
                })
                var totalHead1 = records.getValue({
                    fieldId : 'custbody_abj_total_disc1_so'
                })
                var head2 = (Number(disc2)/100)*(Number(totalAfterDisc) - Number(totalHead1))
                head2 = roundToTwoDigits(head2)
                records.setValue({
                    fieldId : 'custbody_abj_total_disc2_so',
                    value : head2,
                    ignoreFieldChange: true
                })
                var totalHead2 = records.getValue({
                    fieldId : 'custbody_abj_total_disc2_so'
                })
                var head3 = (Number(disc3)/100)* (Number(totalAfterDisc) - Number(totalHead1) - Number(totalHead2))
                head3 = roundToTwoDigits(head3)
                records.setValue({
                    fieldId : 'custbody_abj_total_disc3_so',
                    value : head3,
                    ignoreFieldChange: true
                });
                var totalHead = Number(head1) + Number(head2) + Number(head3)
                totalHead = roundToTwoDigits(totalHead)
                records.setValue({
                    fieldId : 'custbody_total_header_disc',
                    value : totalHead,
                    ignoreFieldChange: true
                });
                totalAfterDisc = roundToTwoDigits(totalAfterDisc)
                var totalAfterDiscHead = Number(totalAfterDisc) - Number(totalHead)
                records.setValue({
                    fieldId : 'custbody_abj_total_head_after_disc',
                    value : totalAfterDiscHead,
                    ignoreFieldChange: true
                });
        }
        }
        
        
    }

    function fieldChanged(context){
        var vrecord = context.currentRecord;
        var sublistFieldName = context.fieldId;
        var sublistName = context.sublistId;
        var totalLineDisc = 0;
        if (sublistName == "item") {
            if (sublistFieldName == "custcol_abj_disc1_so") {
                console.log('change sublist')
                var amountLine = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                })
                var disCount1 = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_disc1_so",
                })
                console.log('amountLine', amountLine)
                console.log('disCount1', disCount1)
                
                var countAmountDisc1 = (Number(disCount1)/100)*Number(amountLine);
                totalLineDisc += Number(countAmountDisc1)
                console.log('countAmountDisc1', countAmountDisc1);
                countAmountDisc1 = roundToTwoDigits(countAmountDisc1)
                records.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_disc1_amount_so",
                    value: countAmountDisc1,
                });
                totalLineDisc = roundToTwoDigits(totalLineDisc)
                records.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_total_line_disc_so",
                    value: totalLineDisc,
                });
                var afterDiscLine = Number(amountLine) - countAmountDisc1
                console.log('afterDiscLine', afterDiscLine)
                afterDiscLine = roundToTwoDigits(afterDiscLine)
                records.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_after_disc_line_so",
                    value: afterDiscLine,
                });

            }
        }
        if (sublistName == "item") {
            if (sublistFieldName == "custcol_abj_disc2_so") {
                console.log('change sublist')
                var amountLine = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                })
                var amountDisc1 = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_disc1_amount_so",
                })
                var amountLine2 = Number(amountLine) - Number(amountDisc1)
                var disCount2 = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_disc2_so",
                })
                var cekTotal = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_total_line_disc_so",
                })
                console.log('cekTotal', cekTotal)
                console.log('amountLine2', amountLine2)
                console.log('disCount2', disCount2)
                var countAmountDisc2 = (Number(disCount2)/100)*Number(amountLine2);
                countAmountDisc2 = roundToTwoDigits(countAmountDisc2)
                totalLineDisc = Number(countAmountDisc2) + Number(amountDisc1)
                console.log('countAmountDisc2', countAmountDisc2);
                records.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_disc2_amount",
                    value: countAmountDisc2,
                });
                totalLineDisc = roundToTwoDigits(totalLineDisc)
                records.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_total_line_disc_so",
                    value: totalLineDisc,
                });
                console.log('amountLine', amountLine)
                console.log('amountDisc1', amountDisc1)
                console.log('countAmountDisc2', countAmountDisc2)
                var afterDiscLine = Number(amountLine) - Number(amountDisc1) - Number(countAmountDisc2)
                console.log('afterDiscLine', afterDiscLine)
                afterDiscLine = roundToTwoDigits(afterDiscLine)
                records.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_after_disc_line_so",
                    value: afterDiscLine,
                });
            }
        }
        if (sublistName == "item") {
            if (sublistFieldName == "custcol_abj_disc3_so") {
                console.log('change sublist')
                var amountLine = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                })
                var amountDisc1 = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_disc1_amount_so",
                })
                var amountDisc2 = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_disc2_amount",
                });
                var amountLine3 = Number(amountLine) - Number(amountDisc1) - Number(amountDisc2)
                var disCount3 = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_disc3_so",
                })
                console.log('amountLine3', amountLine3)
                console.log('disCount3', disCount3)
                var cekTotal = records.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_total_line_disc_so",
                })
                var countAmountDisc3 = (Number(disCount3)/100)*Number(amountLine3);
                totalLineDisc = Number(amountDisc1) + Number(amountDisc2) + Number(countAmountDisc3)
                console.log('countAmountDisc3', countAmountDisc3);
                console.log('cekTotal', cekTotal)
                countAmountDisc3 = roundToTwoDigits(countAmountDisc3)
                records.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_disc3_amount_so",
                    value: countAmountDisc3,
                });
                totalLineDisc = roundToTwoDigits(totalLineDisc)
                records.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_total_line_disc_so",
                    value: totalLineDisc,
                });
                var afterDiscLine = Number(amountLine) - Number(amountDisc1) - Number(amountDisc2) - Number(countAmountDisc3)
                console.log('afterDiscLine', afterDiscLine)
                afterDiscLine = roundToTwoDigits(afterDiscLine)
                records.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_abj_after_disc_line_so",
                    value: afterDiscLine,
                });
            }
            
        }
        if(context.fieldId == "custbody_abj_disc1_so"){
            console.log('change disc head')
            var params = "head"
            updateDiscHeader(params)
        }
        if(context.fieldId == "custbody_abj_disc2_so"){
            console.log('change disc head')
            var params = "head"
            updateDiscHeader(params)
        }
        if(context.fieldId == "custbody_abj_disc3_so"){
            console.log('change disc head')
            var params = "head"
            updateDiscHeader(params)
        }
    }
    function sublistChanged(context) {
        if (context.sublistId === 'item') {
            console.log('fieldChanged');
            var params = "line";
            updateDiscHeader(params);
        return true;
        }
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
        sublistChanged : sublistChanged
    };
});