/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime", "N/currency", "N/redirect"], function(
  record,
  search,
  serverWidget,
  runtime, currency, redirect
) {

  // function saveBankDetail(context){
  //   var supplierRecord=record.load({
  //     type: 'vendor',
  //     id:contextId
  //   });
  //    var swiftCode = supplierRecord.getValue({
  //     fieldId : 'custentity_sol_ven_swift_code'
  //    });

  //   var idSUblist = ''
  //   var objSublist = objRecord.getSublist({
  //     sublistId: idSUblist
  //   });
  //   log.debug('objSublist',objSublist);
  //   var countSublistSupplier= supplierRecord.getLinecount(idSublist); // get length of line/sublist bank detail // param id sublist
  //   for(var i =0 ; i < countSublistSupplier ; i++){
  //     var idBankDetailSublist = supplierRecord.getSublistValue(idSublist,'', i); //param id sublist
  //     var textFormatFile = supplierRecord.getSublistValue(idSublist,'', i); //param id sublist
  //     var textFormatSplit = textFormatFile.replace('.','').split("|");
      
  //     var bankDetailRecord =record.load({
  //       type: 'customrecord_2663_entity_bank_details',
  //       id:idBankDetailSublist
  //     });
  //     var value = swiftCode == 'PBB' && textFormatSplit[0] == 'PBB' ? 'PBB' : 'IBG' ;

  //     bankDetailRecord.setValue({
  //       fieldId : 'custpage_eft_custrecord_2663_entity_bic',
  //       value : value
  //     })
  //     bankDetailRecord.save();
  //   }
  // }


  function afterSubmit(context) {
    try {
      var isEditData = context.type == context.UserEventType.EDIT;
      if (context.type == context.UserEventType.CREATE || isEditData) {
        log.debug("Debug", 'after submit');
        var rec = context.newRecord;
        var vendorId = rec.id;
        log.debug("vendorId", vendorId);
        var vendorName = rec.getValue('companyname');
        var BillerCode = rec.getValue('custentity_billercode') || '';
        var swiftCode = rec.getValue('custentity_sol_etris_cus_branch_swift_cd');
        var getswiftCode = swiftCode.substring(0,3);
        EFTFieldMappings = search.create({
          type: 'customrecord_2663_eft_field_mapping',
          columns: ['internalid',
            'name',
            'custrecord_2663_eft_fld_map_pmt_file_frm',
            'custrecord_2663_eft_fld_map_ent_dtl_type'
          ],
        }).run().getRange(0, 1000);
        // log.debug("EFTFieldMappings", EFTFieldMappings);

        var vsublistid = 'recmachcustrecord_2663_eft_field_mapping';
        EFTFieldMappings.forEach(function(EFTFieldMapping) {
          var PaymentFileFormat = EFTFieldMapping.getValue('custrecord_2663_eft_fld_map_pmt_file_frm');
          var textPaymentFileFormat = EFTFieldMapping.getText('custrecord_2663_eft_fld_map_pmt_file_frm');
          var textFileFormatToArray = textPaymentFileFormat.replace('.','').replaceAll(" ","").split("|");
          log.debug('get Text', textPaymentFileFormat);

          // log.debug("PaymentFileFormat", PaymentFileFormat);
          var EntityBankDtlType = EFTFieldMapping.getValue('custrecord_2663_eft_fld_map_ent_dtl_type');
          var FieldMappingName = EFTFieldMapping.getValue('name');
          var FieldMappingID = EFTFieldMapping.getValue('internalid');
          log.debug("FieldMappingID", {
            FieldMappingName: FieldMappingName,
            isEditData: isEditData,
            BillerCode: BillerCode
          });

          var BankDetailname = vendorName + ' ' + FieldMappingName;
          if (((FieldMappingName !== 'JomPay')) ||
            ((FieldMappingName == 'JomPay') && BillerCode)) {
            var BankDetailsData = search.create({
              type: 'customrecord_2663_entity_bank_details',
              columns: [{
                name: 'internalid'
              }],
              filters: [{
                name: 'custrecord_2663_parent_vendor',
                operator: 'is',
                values: vendorId
              }, {
                name: 'custrecord_2663_entity_file_format',
                operator: 'is',
                values: PaymentFileFormat
              }, ]
            }).run().getRange(0, 999);
            log.debug("BankDetailsData", BankDetailsData);

            function saveData(EFT_Data) {
              EFT_Data.setValue({
                fieldId: 'name',
                value: BankDetailname,
                ignoreFieldChange: true
              });
              EFT_Data.setValue({
                fieldId: 'custrecord_2663_parent_vendor',
                value: vendorId,
                ignoreFieldChange: true
              });
              EFT_Data.setValue({
                fieldId: 'custrecord_2663_entity_file_format',
                value: PaymentFileFormat,
                ignoreFieldChange: true
              });
              EFT_Data.setValue({
                fieldId: 'custrecord_2663_entity_bank_type',
                value: EntityBankDtlType,
                ignoreFieldChange: true
              });
              if(getswiftCode || getswiftCode !== ''){
                if(getswiftCode == 'PBB' && textFileFormatToArray[0]=='PBB'){
                  log.debug('MASUK PBB')
                  EFT_Data.setValue({
                    fieldId: 'custrecord_sol_payment_mode',
                    value: 'PBB',
                    ignoreFieldChange: true
                  });
                }else{
                  log.debug('MASUK ELSE PBB')
                  if(textFileFormatToArray[0]=='PBB'){
                    EFT_Data.setValue({
                      fieldId: 'custrecord_sol_payment_mode',
                      value: 'IBG',
                      ignoreFieldChange: true
                    });
                  }
                }
              }else{
                EFT_Data.setValue({
                  fieldId: 'custrecord_sol_payment_mode',
                  value: '',
                  ignoreFieldChange: true
                });
              }
              
                

              // if(swiftCode === 'PBB' && textFileFormatToArray[0] === 'PBB'){
              
              // }
              var EFTFieldMapping_id = EFTFieldMapping.getValue('internalid');
              var EFTFieldMapping_rec = record.load({
                type: 'customrecord_2663_eft_field_mapping',
                id: EFTFieldMapping_id,
                isDynamic: true
              });
              var field_count = EFTFieldMapping_rec.getLineCount({
                sublistId: vsublistid
              });
              for (var counter = 0; counter < field_count; counter++) {
                var CustomRecordFields = EFTFieldMapping_rec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'custrecord_2663_eft_mapping_cr_fields',
                  line: counter
                }) || '';
                var VendorFields = EFTFieldMapping_rec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'custrecord_2663_eft_mapping_vend_fields',
                  line: counter
                }) || '';
                var DefaultValue = EFTFieldMapping_rec.getSublistValue({
                  sublistId: vsublistid,
                  fieldId: 'custrecord_2663_eft_mapping_dflt_value',
                  line: counter
                }) || '';
                // log.debug("CustomRecordFields", CustomRecordFields);
                // log.debug("VendorFields", VendorFields);
                // log.debug("DefaultValue", DefaultValue);

                var VendorValue = VendorFields !== '' ? rec.getValue(VendorFields) : DefaultValue;
                // log.debug("VendorValue", VendorValue);
                if (VendorValue)
                  VendorValue = VendorValue.toString().replace(/[`~!#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
                if (CustomRecordFields && VendorValue)
                  EFT_Data.setValue({
                    fieldId: CustomRecordFields,
                    value: VendorValue,
                    ignoreFieldChange: true
                  });
              }
              return EFT_Data.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
              });
            }

            if (BankDetailsData.length > 0) {
              BankDetailsData.forEach(function(row) {
                let bankDetailsID = row.getValue({
                  name: 'internalid'
                });
                var EFT_Data = record.load({
                  type: 'customrecord_2663_entity_bank_details',
                  id: bankDetailsID,
                  isDynamic: true
                });
                let updateID = saveData(EFT_Data);
                log.debug('updateID', updateID);
              })
            } else {
              var EFT_Data = record.create({
                type: 'customrecord_2663_entity_bank_details',
                isDynamic: true
              });
              let insertID = saveData(EFT_Data);
              log.debug('insertID', insertID);
            }
          }
        });

        var vendorRec = record.load({
          type: 'vendor',
          id: vendorId,
          isDynamic: true
        });
        vendorRec.setValue({
          fieldId: 'custentity_2663_payment_method',
          value: true,
          ignoreFieldChange: true
        });
        var vendorRecNo = vendorRec.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });
      }
    } catch (e) {
      err_messages = 'error in after submit ' + e.name + ': ' + e.message;
      log.debug(err_messages);
    }
  }

  return {
    afterSubmit: afterSubmit,
  };
});