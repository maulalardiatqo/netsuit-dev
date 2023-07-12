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
  function afterSubmit(context) {
    try {
      var isEditData = context.type == context.UserEventType.EDIT;
      if (context.type == context.UserEventType.CREATE || isEditData) {
        log.debug("Debug", 'after submit');
        var rec = context.newRecord;
        var vendorId = rec.id;
        var vendorName = rec.getValue('companyname');
        var BillerCode = rec.getValue('custentity_billercode') || '';
        EFTFieldMappings = search.create({
          type: 'customrecord_2663_eft_field_mapping',
          columns: ['internalid',
            'name',
            'custrecord_2663_eft_fld_map_pmt_file_frm',
            'custrecord_2663_eft_fld_map_ent_dtl_type'
          ],
        }).run().getRange(0, 1000);

        var vsublistid = 'recmachcustrecord_2663_eft_field_mapping';
        EFTFieldMappings.forEach(function(EFTFieldMapping) {
          var PaymentFileFormat = EFTFieldMapping.getValue('custrecord_2663_eft_fld_map_pmt_file_frm');
          var EntityBankDtlType = EFTFieldMapping.getValue('custrecord_2663_eft_fld_map_ent_dtl_type');
          var FieldMappingName = EFTFieldMapping.getValue('name');
          var BankDetailname = vendorName + ' ' + FieldMappingName;
          if (((FieldMappingName !== 'JomPay') && !isEditData) ||
            ((FieldMappingName == 'JomPay') && BillerCode)) {
            var EFT_Data = record.create({
              type: 'customrecord_2663_entity_bank_details',
              isDynamic: true
            });
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
              log.debug("CustomRecordFields", CustomRecordFields);
              log.debug("VendorFields", VendorFields);
              log.debug("DefaultValue", DefaultValue);

              var VendorValue = VendorFields !== '' ? rec.getValue(VendorFields) : DefaultValue;
              log.debug("VendorValue", VendorValue);
              if (VendorValue)
                VendorValue = VendorValue.toString().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
              if (CustomRecordFields && VendorValue)
                EFT_Data.setValue({
                  fieldId: CustomRecordFields,
                  value: VendorValue,
                  ignoreFieldChange: true
                });
            }
            var EFT_No = EFT_Data.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
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