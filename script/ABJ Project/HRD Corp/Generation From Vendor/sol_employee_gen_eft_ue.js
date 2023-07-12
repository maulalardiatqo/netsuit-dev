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
        var EmployeeId = rec.id;
        var EmployeeNo = rec.getValue('entityid');
        var EmployeeName = rec.getValue('firstname') || '';
        EmployeeName += ' ' + rec.getValue('middlename') || '';
        EmployeeName += ' ' + rec.getValue('lastname') || '';

        EFTFieldMappings = search.create({
          type: 'customrecord_2663_emp_eft_field_mapping',
          columns: ['internalid',
            'name',
            'custrecord_emp_eft_fld_map_pmt_file_frm',
            'custrecord_emp_eft_fld_map_ent_dtl_type'
          ],
        }).run().getRange(0, 1000);

        var vsublistid = 'recmachcustrecord_2663_eft_field_mapping';
        EFTFieldMappings.forEach(function(EFTFieldMapping) {
          var PaymentFileFormat = EFTFieldMapping.getValue('custrecord_emp_eft_fld_map_pmt_file_frm');
          var EntityBankDtlType = EFTFieldMapping.getValue('custrecord_emp_eft_fld_map_ent_dtl_type');
          var FieldMappingName = EFTFieldMapping.getValue('name');
          var BankDetailname = EmployeeName + ' ' + FieldMappingName;

          var EFTDataCheck = search.create({
            type: 'customrecord_2663_entity_bank_details',
            columns: ['internalid', ],
            filters: [{
                name: 'custrecord_2663_parent_employee',
                operator: 'is',
                values: EmployeeId
              },
              {
                name: 'custrecord_2663_entity_file_format',
                operator: 'is',
                values: PaymentFileFormat
              }
            ],
          }).run().getRange(0, 1);
          var EFT_Data;
          if (EFTDataCheck.length > 0) {
            var EFT_Data_id = EFTDataCheck[0].getValue('internalid');
            EFT_Data = record.load({
              type: 'customrecord_2663_entity_bank_details',
              id: EFT_Data_id,
              isDynamic: true
            });
          } else {
            EFT_Data = record.create({
              type: 'customrecord_2663_entity_bank_details',
              isDynamic: true
            });
          }
          EFT_Data.setValue({
            fieldId: 'name',
            value: BankDetailname,
            ignoreFieldChange: true
          });
          EFT_Data.setValue({
            fieldId: 'custrecord_2663_parent_employee',
            value: EmployeeId,
            ignoreFieldChange: true
          });
          EFT_Data.setValue({
            fieldId: 'custpage_eft_custrecord_sol_emp_idno',
            value: EmployeeNo,
            ignoreFieldChange: true
          });
          EFT_Data.setValue({
            fieldId: 'custpage_eft_custrecord_2663_entity_acct_name',
            value: EmployeeName,
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
            type: 'customrecord_2663_emp_eft_field_mapping',
            id: EFTFieldMapping_id,
            isDynamic: true
          });
          var field_count = EFTFieldMapping_rec.getLineCount({
            sublistId: vsublistid
          });
          for (var counter = 0; counter < field_count; counter++) {
            var CustomRecordFields = EFTFieldMapping_rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'custrecord_emp_eft_mapping_cr_fields',
              line: counter
            }) || '';
            var EmployeeFields = EFTFieldMapping_rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'custrecord_emp_eft_mapping_emp_fields',
              line: counter
            }) || '';
            var DefaultValue = EFTFieldMapping_rec.getSublistValue({
              sublistId: vsublistid,
              fieldId: 'custrecord_emp_mapping_dflt_value',
              line: counter
            }) || '';
            log.debug("CustomRecordFields", CustomRecordFields);
            log.debug("EmployeeFields", EmployeeFields);
            log.debug("DefaultValue", DefaultValue);

            var EmployeeValue = EmployeeFields !== '' ? rec.getValue(EmployeeFields) : DefaultValue;
            log.debug("EmployeeValue", EmployeeValue);
            if (EmployeeValue)
              EmployeeValue = EmployeeValue.toString().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
            if (CustomRecordFields && EmployeeValue)
              EFT_Data.setValue({
                fieldId: CustomRecordFields,
                value: EmployeeValue,
                ignoreFieldChange: true
              });
          }
          var EFT_No = EFT_Data.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        });

        var employeeRec = record.load({
          type: 'employee',
          id: EmployeeId,
          isDynamic: true
        });
        employeeRec.setValue({
          fieldId: 'custentity_2663_payment_method',
          value: true,
          ignoreFieldChange: true
        });
        var employeeRecNo = employeeRec.save({
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