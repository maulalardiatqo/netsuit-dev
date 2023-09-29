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
            var slipgaji = form.addField({
                id: "custpage_slip_gaji",
                label: "Slip Gaji",
                type: serverWidget.FieldType.MULTISELECT,
                source: 'customrecord_slip_gaji',
                container : 'remunerasi'
            });
            
            var slipGajiSearch = search.create({
                type: 'customrecord_slip_gaji',
                columns: ['internalid', 'name']
            });
        
            var searchRemunasiSet = slipGajiSearch.runPaged().count;
            // var fieldGroupMap = {};
        
            slipGajiSearch.run().each(function (row) {
                var name = row.getValue({
                    name: "name",
                });
                
                var internalIDSlip = row.getValue({
                    name : 'internalid'
                });
                log.debug('internalid', internalIDSlip);
                if(internalIDSlip){
                    var recSlip = record.load({
                        type : 'customrecord_slip_gaji',
                        id: internalIDSlip
                    });

                    var pendapatanCount = recSlip.getLineCount({
                        sublistId : 'recmachcustrecord_msa_remunasipend'
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
                            log.debug('pendapatn', pendapatantext);
                            var idGroup = 'custpage_' + name.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase();
                            var fieldGroup = form.addFieldGroup({
                                id: 'custpage_' + name.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase(),
                                label: name,
                            });
                            var pendapatan = form.addField({
                                id: 'custpage_' + pendapatantext.replace(/ /g, '_').replace(/[()]/g, '').toLowerCase(),
                                label: pendapatantext,
                                type: serverWidget.FieldType.CURRENCY,
                                container: idGroup,
                            });
                        }
                    }
                }
                
        
                return true;
            });
        
            // form.clientScriptModulePath = "SuiteScripts/transfer_payment_cs.js";
            context.response.writePage(form);
        }
        
        else if (context.request.method === 'POST') {
            var namaBagian = context.request.parameters.custpage_nama_bagian;
            log.debug('nama_bagian', namaBagian);
            try{
                if (!namaBagian) {
                    context.response.write('Nama Bagian tidak boleh kosong.');
                    return;
                }
    
                var bagianRecord = record.create({
                    type: 'customrecord_bagian',
                    isDynamic: true
                });
    
                bagianRecord.setValue({
                    fieldId: 'custrecord_bagian_name',
                    value: namaBagian
                });
    
                var bagianRecordId = bagianRecord.save();
    
                context.response.write('Catatan Bagian baru telah dibuat dengan ID: ' + bagianRecordId);
            }catch(e){
                log.debug('error', e);
            }
            
        }
    }

    return {
        onRequest: onRequest
    };
});
