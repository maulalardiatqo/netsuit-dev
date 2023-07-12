/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', "N/record", "N/search"], (runtime, log, record, search) => {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
        // let dataRec = context.newRecord;
        var dataRec = record.load({
          type: context.newRecord.type,
          id: context.newRecord.id,
          isDynamic: true,
        })
        // let supplierInvoice = dataRec.getValue("custbody_sol_sup_inv_apply");
        // log.debug("supplierInvoice", supplierInvoice);
        let vendorCreditApplyRec = search.create({
          type: 'customrecord_sol_vcn_apply',
          columns: ['internalid', 'custrecord_sol_vcn_app_si', 'custrecord_sol_vcn_app_apply'],
          filters: [{
            name: 'custrecord_sol_vcn_app_vb',
            operator: 'is',
            values: dataRec.id
          }, ]
        });
        let vendorCreditApplyRecSet = vendorCreditApplyRec.run();
        vendorCreditApplyRec = vendorCreditApplyRecSet.getRange({
          start: 0,
          end: 100
        });
        log.debug("vendorCreditApplyRec", vendorCreditApplyRec);
        for (var i = 0; i < vendorCreditApplyRec.length; i++) {
          let row = vendorCreditApplyRec[i];
          let billSupInvoiceID = row.getValue({
            name: 'internalid'
          });
          let billSupInvoice = row.getValue({
            name: 'custrecord_sol_vcn_app_si'
          });
          let billSupInvoiceAmount = row.getValue({
            name: 'custrecord_sol_vcn_app_apply'
          });
          log.debug("billSupInvoice", {
            billSupInvoice: billSupInvoice,
            billSupInvoiceAmount: billSupInvoiceAmount
          });
          let billRec = record.load({
            type: 'vendorbill',
            id: billSupInvoice,
          });
          let vendorBillStatus = billRec.getValue("approvalstatus");
          if (vendorBillStatus == 2) {
            log.debug("approved", billSupInvoice)
            var pymt_line_to_apply = dataRec.findSublistLineWithValue({
              sublistId: 'apply',
              fieldId: 'internalid',
              value: billSupInvoice
            });
            log.debug("get pymt_line_to_apply", pymt_line_to_apply);
            if (pymt_line_to_apply > 0) {
              dataRec.selectLine({
                sublistId: 'apply',
                line: pymt_line_to_apply
              });

              dataRec.setCurrentSublistValue({
                sublistId: 'apply',
                fieldId: 'apply',
                value: true
              });
              log.debug("amount apply", billSupInvoiceAmount);

              // dataRec.setCurrentSublistValue({
              //   sublistId: 'apply',
              //   fieldId: 'internalid',
              //   value: billSupInvoice
              // });
              //
              // dataRec.setCurrentSublistValue({
              //   sublistId: 'apply',
              //   fieldId: 'amount',
              //   value: billSupInvoiceAmount
              // });

              dataRec.commitLine('apply');
              log.debug("commit line", 'apply0');

            }

            dataRec.save({
              enableSourcing: true,
              ignoreMandatoryFields: true
            });
            // dataRec.setSublistValue({
            //   sublistId: 'apply',
            //   fieldId: 'internalid',
            //   value: billSupInvoice,
            //   line: i
            // });
            // dataRec.setSublistValue({
            //   sublistId: 'apply',
            //   fieldId: 'amount',
            //   value: billSupInvoiceAmount,
            //   line: i
            // });
          }

          // var lineTotal = dataRec.getLineCount({
          //   sublistId: "apply"
          // });
          // for (var j = 0; j < lineTotal; j++) {
          //   if (vendorBillStatus == 2) {
          //     let applyID = dataRec.getSublistValue({
          //       sublistId: "apply",
          //       fieldId: "internalid",
          //       line: j,
          //     });
          //     if (applyID == billSupInvoice) {
          //       dataRec.setSublistValue({
          //         sublistId: 'apply',
          //         fieldId: 'internalid',
          //         value: billSupInvoice,
          //         line: j
          //       });
          //       dataRec.setSublistValue({
          //         sublistId: 'apply',
          //         fieldId: 'amount',
          //         value: billSupInvoiceAmount,
          //         line: j
          //       });
          //     } else {
          //       dataRec.selectNewLine({
          //         sublistId: 'apply'
          //       });
          //       dataRec.setCurrentSublistValue({
          //         sublistId: 'apply',
          //         fieldId: 'internalid',
          //         value: billSupInvoice
          //       });
          //       dataRec.setCurrentSublistValue({
          //         sublistId: 'apply',
          //         fieldId: 'amount',
          //         value: billSupInvoiceAmount
          //       });
          //       dataRec.commitLine({
          //         sublistId: 'apply'
          //       });
          //     }
          //   }
          // }
        }
      }
    } catch (error) {
      log.debug("Error in after submit", error.name + ' : ' + error.message);
    }
  }
  return {
    afterSubmit: afterSubmit
  };
});