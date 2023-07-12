/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', "N/record"], (runtime, log, record) => {
  function beforeLoad(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        var prData = context.newRecord;
        var id;
        var type;
        if (context.request) {
          if (context.request.parameters) {
            type = context.request.parameters.type;
            switch (type) {
              case 'itq':
                id = context.request.parameters.itq_id;
                break;
              case 'rfq':
                id = context.request.parameters.rfq_id;
                break;
              case 'rfp':
                id = context.request.parameters.rfp_id;
                break;
              default:
                id = '';
            }
          }
          log.debug("ID", {
            id: id,
            type: type
          });
          var recordType;
          if (id) {
            switch (type) {
              case 'itq':
                recordType = "customrecord_sol_itq";
                break;
              case 'rfq':
                recordType = "customrecord_sol_rfq";
                break;
              case 'rfp':
                recordType = "customrecord_sol_rfp";
                break;
              default:
                recordType = "";
            }
            if (recordType) {
              var dataTrans = record.load({
                type: recordType,
                id: id,
                isDynamic: true
              });
              log.debug("dataTrans 1", dataTrans);
              var entity = dataTrans.getValue("custrecord_sol_itq_awarded");
              var memo = dataTrans.getValue("altname");
              var department = dataTrans.getValue("custrecord_sol_itq_department");
              var currency = dataTrans.getValue("custrecord_sol_itq_currency");
              log.debug("dataTrans 2", {
                entity: entity,
                memo: memo,
                department: department,
                currency: currency
              });

              prData.setValue({
                fieldId: 'entity',
                value: entity,
                ignoreFieldChange: true
              });

              prData.setValue({
                fieldId: 'memo',
                value: memo,
                ignoreFieldChange: true
              });

              prData.setValue({
                fieldId: 'custbody_sol_pr_itq',
                value: id,
                ignoreFieldChange: true
              });

              prData.setValue({
                fieldId: 'department',
                value: department,
                ignoreFieldChange: true
              });

              prData.setValue({
                fieldId: 'currency',
                value: currency,
                ignoreFieldChange: true
              });

              var lineTotal = dataTrans.getLineCount({
                sublistId: "recmachcustrecord_sol_itq_link",
              });
              log.debug("lineTotal", lineTotal);
              for (var i = 0; i < lineTotal; i++) {
                var item = dataTrans.getSublistValue({
                  sublistId: "recmachcustrecord_sol_itq_link",
                  fieldId: "custrecord_sol_itq_item",
                  line: i,
                });

                var quantity = dataTrans.getSublistValue({
                  sublistId: "recmachcustrecord_sol_itq_link",
                  fieldId: "custrecord_sol_itq_quantity_range",
                  line: i,
                });

                var description = dataTrans.getSublistValue({
                  sublistId: "recmachcustrecord_sol_itq_link",
                  fieldId: "custrecord_sol_itq_description",
                  line: i,
                });

                var rate = dataTrans.getSublistValue({
                  sublistId: "recmachcustrecord_sol_itq_link",
                  fieldId: "custrecord_sol_itq_price",
                  line: i,
                });

                var amount = dataTrans.getSublistValue({
                  sublistId: "recmachcustrecord_sol_itq_link",
                  fieldId: "custrecord_sol_itq_line_total",
                  line: i,
                });

                log.debug("dataGet", {
                  item: item,
                  quantity: quantity,
                  description: description,
                  rate: rate,
                  amount: amount
                });

                // Set sublist values
                prData.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'item',
                  line: i,
                  value: item
                });

                prData.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'quantity',
                  line: i,
                  value: quantity
                });

                prData.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'description',
                  line: i,
                  value: description
                });

                prData.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'department',
                  line: i,
                  value: department
                });

                prData.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'rate',
                  line: i,
                  value: rate
                });

                prData.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'amount',
                  line: i,
                  value: amount
                });
                // End Set sublist values
              }
            }
          }
        }
      }
    } catch (error) {
      log.debug("Error in before load", error.name + ' : ' + error.message);
    }
  }
  return {
    beforeLoad: beforeLoad
  };
});