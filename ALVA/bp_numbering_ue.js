/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
  function getStartAndEndDateMonth(dateParams) {
    const today = new Date(dateParams);
    const startOfMonth = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
    const endOfMonth = new Date(today.getUTCFullYear(), today.getUTCMonth() + 1, 0);

    return {
      startMtd: startOfMonth,
      endMtd: endOfMonth,
    };
  }
  function sysDate(transDate) {
    var date = transDate;
    var tdate = date.getUTCDate();
    var month = date.getUTCMonth() + 1;
    var year = date.getUTCFullYear();

    return year + "-" + month + "-" + tdate;
  }

  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        var rec = context.newRecord;
        let account = rec.getValue("account");
        let subsidiary = rec.getValue("subsidiary");
        let nType = rec.getValue("ntype");
        var tranDate = new Date(rec.getValue("trandate"));
        var transYear = String(tranDate.getFullYear());
        var transMonth = String(tranDate.getMonth() + 1).padStart(2, "0");
        log.debug("data", {
          account: account,
          subsidiary: subsidiary,
          transYear: transYear,
          transMonth: transMonth,
          tranDate: tranDate,
          ntype: nType,
        });
        let dataRec = record.load({
          type: rec.type,
          id: rec.id,
        });
        var customrecord628SearchObj = search.create({
          type: "customrecord628",
          filters: [["custrecord_ntb_subsidiary", "anyof", subsidiary], "AND", ["custrecord_ntb_accounts", "anyof", account], "AND", ["formulatext: TO_CHAR({custrecord_ntb_start_date}, 'MM')", "is", transMonth], "AND", ["formulatext: TO_CHAR({custrecord_ntb_start_date}, 'YYYY')", "is", transYear]],
          columns: [
            search.createColumn({
              name: "scriptid",
              sort: search.Sort.ASC,
            }),
            "internalid",
            "custrecord_ntb_preffix",
            "custrecord_ntb_minimum_digit",
            "custrecord_ntb_start_date",
            "custrecord_ntb_end_date",
            "custrecord_ntb_transaction",
            "custrecord_ntb_sample_format",
            "custrecord_ntb_accounts",
            "custrecord_ntb_last_numberr",
            "custrecord_ntb_subsidiary",
          ],
        });
        var searchResultCount = customrecord628SearchObj.runPaged().count;
        log.debug("customrecord628SearchObj result count", searchResultCount);
        if (searchResultCount > 0) {
          customrecord628SearchObj.run().each(function (result) {
            var prefix = result.getValue("custrecord_ntb_preffix");
            var minimumDigit = parseInt(result.getValue("custrecord_ntb_minimum_digit"));
            var lastNumber = parseInt(result.getValue("custrecord_ntb_last_numberr") || 0) + 1;
            var internalID = result.getValue("internalid");
            var digitPart = "0";
            digitPart = digitPart.repeat(minimumDigit) + lastNumber.toString();
            function rightStr(str, chr) {
              return str.slice(str.length - chr, str.length);
            }
            log.debug("DigitPart0", digitPart);
            digitPart = rightStr(digitPart, minimumDigit);
            var runNumber = `${prefix}${digitPart}`;
            log.debug("runNumber", runNumber);
            if (nType == 18) {
              dataRec.setValue({
                fieldId: "tranid",
                value: runNumber,
                ignoreFieldChange: true,
              });
            } else {
              dataRec.setValue({
                fieldId: "custbody_alva_numbering",
                value: runNumber,
                ignoreFieldChange: true,
              });
            }

            dataRec.save({
              enableSourcing: false,
              ignoreMandatoryFields: true,
            });

            var runNumber_Toupdate = record.load({
              type: "customrecord628",
              id: internalID,
              isDynamic: true,
            });

            runNumber_Toupdate.setValue({
              fieldId: "custrecord_ntb_last_numberr",
              value: lastNumber,
              ignoreFieldChange: false,
            });

            runNumber_Toupdate.save({
              enableSourcing: false,
              ignoreMandatoryFields: true,
            });
          });
        } else {
          // if subsidiary is ALVA, FROYO, JINGGA, SISI
          var subsInArray = ["46", "47", "48", "49"];
          if (subsInArray.includes(subsidiary)) {
            // create new record numbering
            log.debug("create new record numbering", true);
            var transDate = sysDate(tranDate);
            var { startMtd, endMtd } = getStartAndEndDateMonth(transDate);
            var fieldLookUpBank = search.lookupFields({
              type: "ACCOUNT",
              id: account,
              columns: ["name", "custrecord_acc_bank_code"],
            });
            var bankCode = fieldLookUpBank.custrecord_acc_bank_code[0].text || "";
            var transYear2 = transYear.slice(-2);
            var prefixCreation = bankCode + transYear2 + transMonth + "-";
            log.debug("transDate", {
              transDate: transDate,
              startMtd: startMtd,
              endMtd: endMtd,
              bankCode: bankCode,
              prefixCreation: prefixCreation,
            });
            // update Bill Payment Number
            var runNumber = prefixCreation + "001";
            log.debug("runNumber", runNumber);
            dataRec.setValue({
              fieldId: "tranid",
              value: runNumber,
              ignoreFieldChange: true,
            });
            dataRec.save({
              enableSourcing: false,
              ignoreMandatoryFields: true,
            });
            // end update Bill Payment Number
            var nRec = record.create({
              type: "customrecord628",
              isDynamic: true,
            });
            nRec.setValue({
              fieldId: "custrecord_ntb_preffix",
              value: prefixCreation,
              ignoreFieldChange: false,
            });
            nRec.setValue({
              fieldId: "custrecord_ntb_transaction",
              value: nType,
              ignoreFieldChange: false,
            });
            nRec.setValue({
              fieldId: "custrecord_ntb_subsidiary",
              value: subsidiary,
              ignoreFieldChange: false,
            });
            nRec.setValue({
              fieldId: "custrecord_ntb_minimum_digit",
              value: 3,
              ignoreFieldChange: false,
            });
            nRec.setValue({
              fieldId: "custrecord_ntb_accounts",
              value: account,
              ignoreFieldChange: false,
            });
            nRec.setValue({
              fieldId: "custrecord_ntb_start_date",
              value: startMtd,
              ignoreFieldChange: false,
            });
            nRec.setValue({
              fieldId: "custrecord_ntb_end_date",
              value: endMtd,
              ignoreFieldChange: false,
            });
            nRec.setValue({
              fieldId: "custrecord_ntb_last_numberr",
              value: 1,
              ignoreFieldChange: false,
            });
            nRec.save({
              enableSourcing: false,
              ignoreMandatoryFields: true,
            });
          }
        }
      }
    } catch (e) {
      err_messages = "error in after submit " + e.name + ": " + e.message;
      log.debug(err_messages);
    }
  }

  return {
    afterSubmit: afterSubmit,
  };
});
