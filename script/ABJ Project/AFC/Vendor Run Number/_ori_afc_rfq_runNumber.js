/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function(
  record,
  search,
) {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        //custrecord_abj_rfq_id

        log.debug("Debug", 'after submit');
        var rec = context.newRecord;
        var recid = rec.id;

        log.debug("Type", rec.type);
        log.debug("ID", rec.id);

        let rfqRec = record.load({
          type: rec.type,
          id: rec.id,
        });
        var RfqType = rfqRec.getValue('custrecord_abj_rfq_type');
        var RfqCustomForm = rfqRec.getValue('customform');
        var RfqCustomFormText = rfqRec.getText('customform');

        log.debug("RfqType", RfqType);
        log.debug("RfqCustomForm", RfqCustomForm);
        log.debug("RfqCustomFormText", RfqCustomFormText);
        var RFQRunningNumbers = search.create({
          type: 'customrecord_rfq_autogen_number',
          columns: ['internalid', 'custrecord_rfq_prefix', 'custrecord_rfq_lastnumber', 'custrecord_abj_number_digit'],
          filters: [{
            name: 'custrecordabj_rfq_custom_form',
            operator: 'is',
            values: RfqCustomForm
          }, ]
        });
        log.debug("After Create search", "after create search");
        if (RfqCustomForm == '83') {
          var filterType = [];
          filterType.push(RfqType);
          log.debug("filter type", filterType);
          RFQRunningNumbers.filters.push(
            search.createFilter({
              name: "custrecord_rfq_type",
              operator: search.Operator.ANYOF,
              values: filterType,
            })
          );
        }
        var RFQRunningNumberSet = RFQRunningNumbers.run();
        RFQRunningNumbers = RFQRunningNumberSet.getRange({
          start: 0,
          end: 1
        });
        RFQRunningNumbers.forEach(function(RFQRunningNumber) {
          var RunNumberId = RFQRunningNumber.getValue({
            name: 'internalid'
          });
          var PrefixNumber = RFQRunningNumber.getValue({
            name: 'custrecord_rfq_prefix'
          });
          var LastNumber = parseInt(RFQRunningNumber.getValue({
            name: 'custrecord_rfq_lastnumber'
          }) || 0) + 1;
          var NumberDigit = parseInt(RFQRunningNumber.getValue({
            name: 'custrecord_abj_number_digit'
          }));
          var DigitPart = '0';
          DigitPart = DigitPart.repeat(NumberDigit) + LastNumber.toString();

          function rightStr(str, chr) {
            return str.slice(str.length - chr, str.length);
          }
          log.debug("DigitPart0", DigitPart);
          DigitPart = rightStr(DigitPart, NumberDigit);
          var RfqNumber = PrefixNumber + DigitPart;
          log.debug("RfqNumber", RfqNumber);

          // var trans_to_update = record.load({
          //   type: 'customrecord_abj_rfq',
          //   id: recid,
          //   isDynamic: true
          // });
          // log.debug("rectype", rectype);

          rfqRec.setValue({
            fieldId: 'name',
            value: RfqNumber,
            ignoreFieldChange: true
          });

          rfqRec.setValue({
            fieldId: 'custrecord_abj_rfq_id',
            value: RfqNumber,
            ignoreFieldChange: true
          });

          rfqRec.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
          });

          var runNumber_Toupdate = record.load({
            type: 'customrecord_rfq_autogen_number',
            id: RunNumberId,
            isDynamic: true
          });

          runNumber_Toupdate.setValue({
            fieldId: 'custrecord_rfq_lastnumber',
            value: LastNumber,
            ignoreFieldChange: false
          });

          runNumber_Toupdate.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
          });

          log.debug("recid", recid);
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