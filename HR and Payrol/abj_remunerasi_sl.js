/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
  ], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config
  ) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Remunerasi'
            });
            var remunerasi = form.addFieldGroup({
                id: "remunerasi",
                label: "Option",
            });
            var employee = form.addField({
                id: "custpage_slip_employee",
                label: "Employee",
                type: serverWidget.FieldType.SELECT,
                source: 'employee',
                container : 'remunerasi'
            });
            
            var slipGajiSearch = search.create({
                type: 'customrecord_slip_gaji',
                columns: ['internalid', 'name']
            });
        
            var searchRemunasiSet = slipGajiSearch.runPaged().count;
        
            slipGajiSearch.run().each(function (row) {
                var name = row.getValue({
                    name: "name",
                });
                var idGroup = 'custpage_' + name.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase();
                var fieldGroup = form.addFieldGroup({
                    id: 'custpage_' + name.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase(),
                    label: name,
                });
                
                var internalIDSlip = row.getValue({
                    name : 'internalid'
                });
                log.debug('internalid', internalIDSlip);
                var checkboxSlip = form.addField({
                    id : 'custpage_check_' + name.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase(),
                    label: "Select",
                    type: serverWidget.FieldType.CHECKBOX,
                    container : idGroup,
                })
                if(internalIDSlip){
                    
                    var recSlip = record.load({
                        type : 'customrecord_slip_gaji',
                        id: internalIDSlip
                    });

                    var pendapatanCount = recSlip.getLineCount({
                        sublistId : 'recmachcustrecord_msa_remunasipend'
                    });
                    var potonganCount = recSlip.getLineCount({
                        sublistId : 'recmachcustrecord_msa_remunasitry'
                    });
                    log.debug('pendapatan', pendapatanCount);
                    if(pendapatanCount > 0){
                        for(var index = 0; index < pendapatanCount; index++){
                            var pendapatanid = recSlip.getSublistValue({
                                sublistId : 'recmachcustrecord_msa_remunasipend',
                                fieldId : 'custrecord_msa_slipgaji_pendapatan',
                                line : index,
                            });
                            var pendapatantext = recSlip.getSublistText({
                                sublistId : 'recmachcustrecord_msa_remunasipend',
                                fieldId : 'custrecord_msa_slipgaji_pendapatan',
                                line : index,
                            });
                            
                            var pendapatan = form.addField({
                                id: 'custpage_' + pendapatantext.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase()+internalIDSlip,
                                label: pendapatantext,
                                type: serverWidget.FieldType.CURRENCY,
                                container: idGroup,
                            });
                            
                        }
                    }
                    if(potonganCount > 0)
                    {
                        for(var index = 0; index < potonganCount; index++){
                            var potonganText = recSlip.getSublistText({
                                sublistId : 'recmachcustrecord_msa_remunasitry',
                                fieldId : 'custrecord_msa_komponen_potongan',
                                line : index
                            });
                            var potongan = form.addField({
                                id : 'custpage_' + potonganText.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase()+internalIDSlip,
                                label : potonganText,
                                type: serverWidget.FieldType.CURRENCY,
                                container: idGroup,
                            })
                        }
                    }
                    
                }
                
        
                return true;
            });
            form.addSubmitButton({
                label: "Submit",
            });
            // form.clientScriptModulePath = "SuiteScripts/transfer_payment_cs.js";
            context.response.writePage(form);
        }
        
        else if (context.request.method === 'POST') {
            var employee = context.request.parameters.custpage_slip_employee;
            var params = context.request.parameters;
            try{
                for (var key in params) {
                    if (
                        params.hasOwnProperty(key) &&
                        key !== 'custpage_slip_employee' &&
                        !key.startsWith('custpage_slip_') &&
                        key.indexOf('custpage_') === 0 &&
                        key.indexOf('formattedValue') === -1 &&
                        params[key] !== null &&
                        params[key] !== undefined &&
                        params[key] !== '' &&
                        params[key] !== 'F'
                    ) {
                        var value = params[key];
                        log.debug('value slip', value);

                        var match = key.match(/\d+/);
                        if (match) {
                            var internalid_slip = parseInt(match[0], 10); 
                            log.debug('internalid slip', internalid_slip);
                        }
                    }
                }
            }catch(e){
                log.debug('error', e);
            }
            
        }
    }

    return {
        onRequest: onRequest
    };
});
