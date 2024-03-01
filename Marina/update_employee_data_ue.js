/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/record", "N/search"], (runtime, log, record, search) => {
  function afterSubmit(scriptContext) {
    if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
      try {
        var rec = scriptContext.newRecord;
        let employee = rec.getValue("custrecord3");
        let adddress_1 = rec.getValue("custrecord_alamt1");
        let adddress_2 = rec.getValue("custrecord_alamat2");
        let city = rec.getValue("custrecord_kota");
        let state = rec.getValue("custrecord_provinsi");
        let zip = rec.getValue("custrecord_msa_kodepos");
        let phone = rec.getValue("custrecord_msa_phone_number");
        var dataEmp = record.load({
          type: "employee",
          id: employee,
          isDynamic: true,
        });
        dataEmp.setValue({
          fieldId: "mobilephone",
          value: phone,
          ignoreFieldChange: true,
        });
        var addressSublistId = "addressbook";
        var addressFieldId = "addressbookaddress";
        var line = 0;

        // Check if the 'addressbook' sublist exists
        var hasAddressSublist = dataEmp.getSublist({
          sublistId: addressSublistId,
        });

        if (!hasAddressSublist) {
          // 'addressbook' sublist doesn't exist, create it
          dataEmp.selectNewLine({
            sublistId: addressSublistId,
          });

          dataEmp.setCurrentSublistValue({
            sublistId: addressSublistId,
            fieldId: "defaultbilling",
            value: true,
          });

          dataEmp.setCurrentSublistValue({
            sublistId: addressSublistId,
            fieldId: "defaultshipping",
            value: true,
          });

          var newSubrecord = dataEmp.getCurrentSublistSubrecord({
            sublistId: addressSublistId,
            fieldId: addressFieldId,
          });

          // Set address details in the new subrecord
          newSubrecord.setValue({
            fieldId: "label",
            value: "Home",
          });

          newSubrecord.setValue({
            fieldId: "addr1",
            value: adddress_1,
          });

          newSubrecord.setValue({
            fieldId: "addr2",
            value: adddress_2,
          });

          newSubrecord.setValue({
            fieldId: "state",
            value: state,
          });

          newSubrecord.setValue({
            fieldId: "city",
            value: city,
          });

          newSubrecord.setValue({
            fieldId: "zip",
            value: zip,
          });

          dataEmp.commitLine({
            sublistId: addressSublistId,
          });
        } else {
          // 'addressbook' sublist exists, update line 0
          dataEmp.selectLine({
            sublistId: addressSublistId,
            line: line,
          });

          var subrecord = dataEmp.getCurrentSublistSubrecord({
            sublistId: addressSublistId,
            fieldId: addressFieldId,
          });

          // Set address details in the existing subrecord
          subrecord.setValue({
            fieldId: "label",
            value: "Home",
          });

          subrecord.setValue({
            fieldId: "addr1",
            value: adddress_1,
          });

          subrecord.setValue({
            fieldId: "addr2",
            value: adddress_2,
          });

          subrecord.setValue({
            fieldId: "state",
            value: state,
          });

          subrecord.setValue({
            fieldId: "city",
            value: city,
          });

          subrecord.setValue({
            fieldId: "zip",
            value: zip,
          });

          dataEmp.commitLine({
            sublistId: addressSublistId,
          });
        }
        dataEmp.save({
          enableSourcing: true,
          ignoreMandatoryFields: true,
        });
      } catch (error) {
        log.error({
          title: "error",
          details: error.message,
        });
      }
    }
  }
  return {
    afterSubmit: afterSubmit,
  };
});
