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
                container : 'remunerasi',
            });
            employee.isMandatory = true;
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
                                id: 'custpage_' + pendapatantext.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase()+'_'+internalIDSlip+'_pendapatan_'+pendapatanid,
                                label: pendapatantext,
                                type: serverWidget.FieldType.CURRENCY,
                                container: idGroup,
                            });
                            
                        }
                    }
                    if(potonganCount > 0)
                    {
                        for(var index = 0; index < potonganCount; index++){
                            var potonganid = recSlip.getSublistValue({
                                sublistId : 'recmachcustrecord_msa_remunasitry',
                                fieldId : 'custrecord_msa_komponen_potongan',
                                line : index
                            });
                            var potonganText = recSlip.getSublistText({
                                sublistId : 'recmachcustrecord_msa_remunasitry',
                                fieldId : 'custrecord_msa_komponen_potongan',
                                line : index
                            });
                            var potongan = form.addField({
                                id : 'custpage_' + potonganText.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase()+'_'+internalIDSlip+'_potongan_'+potonganid,
                                label : potonganText,
                                type: serverWidget.FieldType.CURRENCY,
                                container: idGroup,
                            });
                        }
                    }
                    
                }
                
        
                return true;
            });
            form.addSubmitButton({
                label: "Submit",
            });
            form.clientScriptModulePath = "SuiteScripts/abj_remunasi_cs.js";
            context.response.writePage(form);
        }
        
        else if (context.request.method === 'POST') {
            var employee = context.request.parameters.custpage_slip_employee;
            var params = context.request.parameters;
            try {
               
                var recordRemunerasi = record.create({
                    type: 'customrecord_msa_remunerasi',
                    isDynamic: true
                });
                recordRemunerasi.setValue({
                    fieldId: 'custrecord_remunerasi_employee',
                    value: employee, 
                    ignoreFieldChange: true
                });
               
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
                        var value = params[key] || 0;
                        log.debug('value slip', { key: key, value: value });
                        if (key.toLowerCase().includes("pendapatan")) {
                            log.debug('Key contains "pendapatan"', key);
                            var match = key.match(/\d+/);
                            if (match) {
                                log.debug('match', match);
                                var internalid_slip = parseInt(match[0], 10);
                                log.debug('internalid slip', internalid_slip);
                            }

                            var matchForKomponen = key.match(/\d+$/);
                            if (matchForKomponen) {
                                var internalId_komponen = parseInt(matchForKomponen[matchForKomponen.length - 1]);
                                log.debug('internalId_komponen', internalId_komponen);
                            }
                            if(internalid_slip && internalId_komponen){
                                recordRemunerasi.selectNewLine({
                                    sublistId: 'recmachcustrecord_remunerasi'
                                });
                                recordRemunerasi.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_remunerasi',
                                    fieldId: 'custrecord_remu_slipgaji',
                                    value: internalid_slip
                                });
                                recordRemunerasi.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_remunerasi',
                                    fieldId: 'custrecord_id_pendapatan',
                                    value: internalId_komponen
                                });
                                // recordRemunerasi.setCurrentSublistValue({
                                //     sublistId: 'recmachcustrecord_remunerasi',
                                //     fieldId: 'custrecord_remunerasi',
                                //     value: saveRemu
                                // });
                                recordRemunerasi.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_remunerasi',
                                    fieldId: 'custrecord_jumlah_pendapatan',
                                    value: value
                                });
                                recordRemunerasi.commitLine({
                                    sublistId: 'recmachcustrecord_remunerasi'
                                });
                            }
                            
                        }
                        if (key.toLowerCase().includes("potongan")) {
                            log.debug('Key contains "pendapatan"', key);
                            var match = key.match(/\d+/);
                            if (match) {
                                log.debug('match', match);
                                var internalid_slip = parseInt(match[0], 10);
                                log.debug('internalid slip', internalid_slip);
                            }

                            var matchForKomponen = key.match(/\d+$/);
                            if (matchForKomponen) {
                                var internalId_komponen = parseInt(matchForKomponen[matchForKomponen.length - 1]);
                                log.debug('internalId_komponen potongan', internalId_komponen);
                            }
                            if(internalid_slip && internalId_komponen){
                                recordRemunerasi.selectNewLine({
                                    sublistId: 'recmachcustrecord_msa_potongan_remunerasi'
                                });
                                recordRemunerasi.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_msa_potongan_remunerasi',
                                    fieldId: 'custrecord_msa_slip_gaji_potongan',
                                    value: internalid_slip
                                });
                                recordRemunerasi.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_msa_potongan_remunerasi',
                                    fieldId: 'custrecord_msa_id_potongan',
                                    value: internalId_komponen
                                });
                                // recordRemunerasi.setCurrentSublistValue({
                                //     sublistId: 'recmachcustrecord_msa_potongan_remunerasi',
                                //     fieldId: 'custrecord_remunerasi',
                                //     value: saveRemu
                                // });
                                recordRemunerasi.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_msa_potongan_remunerasi',
                                    fieldId: 'custrecord_msa_jumlah_potongan',
                                    value: value
                                });
                                recordRemunerasi.commitLine({
                                    sublistId: 'recmachcustrecord_msa_potongan_remunerasi'
                                });
                            }
                        }
                    }
                    
                    
                }
                var saveRemu = recordRemunerasi.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('saveRemu', saveRemu);
                var html = '<html><body><h2>Process Result</h2>';
                var successMessage
                if(saveRemu){
                    successMessage = 'Seuccess Create Remunasi <a href="https://9342705.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=286&id=114" '+saveRemu+'></a><br>';
                    html += '<h3>' + successMessage + '</h3>';
                    html += '<input type="button" value="OK" onclick="history.back()">';
                    html += '</body></html>';
        
                    context.response.write(html);
                }
                
            } catch (e) {
                log.debug('error', e);
            }
            
        }
    }

    return {
        onRequest: onRequest
    };
});
