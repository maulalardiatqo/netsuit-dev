/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search"], function (record, search) {
    function afterSubmit(context) {
      try {
        if (context.type == context.UserEventType.CREATE) {
          var rec = context.newRecord;
  
          var recordTRans = record.load({
            type: rec.type,
            id: rec.id,
          });
          var TransType = recordTRans.getValue("type");
          var customForm = recordTRans.getValue("customform");
          if (TransType == "custrecordentry") {
            var dateTrans = recordTRans.getValue("custrecord_iss_date");
          } else {
            var dateTrans = recordTRans.getValue("trandate");
          }
  
          log.debug("dateBill", dateTrans);
          log.debug("customForm", customForm);
          var date = new Date(dateTrans);
  
          var day = date.getDate();
          var month = date.getMonth() + 1;
          var year = date.getFullYear();
          log.debug("month", month);
          log.debug("Year", year);
          var dayFormatted = day < 10 ? "0" + day : day;
          var monthFormatted = month < 10 ? "0" + month : month;
  
          var formattedDate = dayFormatted + "/" + monthFormatted + "/" + year;
          log.debug("formatdate", formattedDate);
          var lastTwoDigits = year.toString().slice(-2);
          log.debug("lastTwoDigit", lastTwoDigits);
          log.debug("transtype", TransType);
          log.debug("monthFormatted", monthFormatted);
          var textSub;
          if (TransType == "purchord") {
            if (customForm == 138) {
              textSub = "PR";
            } else {
              textSub = "PO";
            }
          } else if (TransType == "journal") {
            textSub = "JE";
          } else if (TransType == "vendpymt") {
            textSub = "PYMT";
          } else if (TransType == "custinvc") {
            textSub = "INV";
          } else if (TransType == "vendcred") {
            textSub = "VEND";
          } else if (TransType == "custcred") {
            textSub = "CM";
          } else if (TransType == "vendbill") {
            textSub = "VEND";
          } else if (TransType == "salesord") {
            if(customForm == 148){
                textSub = "PI";
            }else{
                textSub = "SO";
            }
          } else if (TransType == "itemrcpt") {
            textSub = "IR";
          } else if (TransType == "opprtnty") {
            textSub = "OPP";
          } else if (TransType == "cashsale") {
            textSub = "CS";
          } else if (TransType == "check") {
            textSub = "CHK";
          } else if (TransType == "deposit") {
            textSub = "DEP";
          } else if (TransType == "itemship") {
            textSub = "IF";
          } else if (TransType == "trnfrord") {
            textSub = "TO";
          } else if (TransType == "estimate") {
            textSub = "QT";
          } else if (TransType == "custpymt") {
            textSub = "PYMT";
          } else if (TransType == "vprep") {
            textSub = "VPP";
          } else if (TransType == "exprept") {
            textSub = "EXP";
          } else if (TransType == "custrecordentry") {
            textSub = "PR";
          }
          var formatRunning = "";
          if (TransType == "estimate") {
            formatRunning = "/ISS-BD/" + year + "-" + month + "/" + textSub;
          } else {
            formatRunning = textSub + lastTwoDigits + monthFormatted;
          }
  
          log.debug("formatRunning", {
            formattedDate: formattedDate,
          });
          var searchRunNumb = search.create({
            type: "customrecord__po_numbering",
            columns: ["internalid", "custrecord_msa_pon_transactiontype", "custrecord_msa_pon_prefix", "custrecord_msa_pon_minimum_digit", "custrecord_msa_pon_initial_number", "custrecord_msa_pon_suffix", "custrecord_msa_pon_last_run", "custrecord_msa_pon_start_date", "custrecord_msa_pon_end_date", "custrecord_mas_pon_sample_format"],
            filters: [
              {
                name: "custrecord_msa_pon_transactiontype",
                operator: "is",
                values: TransType,
              },
              {
                name: "custrecord_msa_pon_start_date",
                operator: "onorbefore",
                values: formattedDate,
              },
              {
                name: "custrecord_msa_pon_end_date",
                operator: "onorafter",
                values: formattedDate,
              },
            ],
          });
          var searchRunNumbSet = searchRunNumb.run();
          searchRunNumb = searchRunNumbSet.getRange({
            start: 0,
            end: 1,
          });
          log.debug("searchRunNumb", searchRunNumb);
          log.debug("month", month);
  
          var startDate = new Date(year, month - 1, 1);
          startDate.setHours(0, 0, 0, 0);
          log.debug("startDate", startDate);
  
          var endDate = new Date(year, month, 0);
          endDate.setHours(23, 59, 59, 999);
          log.debug("endDate", endDate);
  
          if (searchRunNumb.length > 0) {
            var runNumbRec = searchRunNumb[0];
            var transactionType = runNumbRec.getValue({
              name: "custrecord_msa_pon_transactiontype",
            });
            var lastRun = runNumbRec.getValue({
              name: "custrecord_msa_pon_last_run",
            });
            var minimumDigit = runNumbRec.getValue({
              name: "custrecord_msa_pon_minimum_digit",
            });
            var internalid = runNumbRec.getValue({
              name: "internalid",
            });
            log.debug("lastRun", lastRun);
            log.debug("transactionType", transactionType);
            var runningNumber = "";
            if (transactionType == "estimate") {
              var lastRunNumber = parseInt(lastRun.split("/")[0], 10);
              log.debug("lastRunNumber", lastRunNumber);
              var newLastRun = lastRunNumber + 1;
              var newDigitPart = "0".repeat(minimumDigit - newLastRun.toString().length) + newLastRun.toString();
              runningNumber = newDigitPart + formatRunning;
              log.debug("runningNumber", runningNumber);
            } else {
              if (lastRun === "") {
                log.debug("lastrun empty");
                log.debug("formatRunning", formatRunning);
                var newLastRun = lastRun + 1;
                var newDigitPart = "0".repeat(minimumDigit) + newLastRun.toString();
  
                runningNumber = formatRunning + newDigitPart;
                log.debug("runningNumber", runningNumber);
              } else {
                var lastRunNumber = parseInt(lastRun.substring(formatRunning.length), 10);
                var newLastRun = lastRunNumber + 1;
                var newDigitPart = "0".repeat(minimumDigit - newLastRun.toString().length) + newLastRun.toString();
                runningNumber = formatRunning + newDigitPart;
              }
            }
  
            var recordBP = record.load({
              type: "customrecord__po_numbering",
              id: internalid,
              isDynamic: true,
            });
            recordBP.setValue({
              fieldId: "custrecord_msa_pon_last_run",
              value: runningNumber,
              ignoreFieldChange: true,
            });
            recordBP.save({
              enableSourcing: false,
              ignoreMandatoryFields: true,
            });
            log.debug('runningNumber', runningNumber)
            if (TransType == "custrecordentry") {
              recordTRans.setValue({
                fieldId: "custrecord_iss_pr_tranid",
                value: runningNumber,
                ignoreFieldChange: true,
              });
            } else {
              recordTRans.setValue({
                fieldId: "tranid",
                value: runningNumber,
                ignoreFieldChange: true,
              });
            }
            var saveRecordTrans = recordTRans.save({
              enableSourcing: false,
              ignoreMandatoryFields: true,
            });
            log.debug("saveRecordTrans", saveRecordTrans);
          } else {
            log.debug("masuk else", formatRunning);
            var createRecord = record.create({
              type: "customrecord__po_numbering",
              isDynamic: true,
            });
            if (TransType == "estimate") {
              createRecord.setValue({
                fieldId: "custrecord_msa_pon_last_run",
                value: "0001" + formatRunning,
                ignoreFieldChange: true,
              });
            } else {
              createRecord.setValue({
                fieldId: "custrecord_msa_pon_last_run",
                value: formatRunning + "0001",
                ignoreFieldChange: true,
              });
            }
  
            createRecord.setValue({
              fieldId: "custrecord_msa_pon_transactiontype",
              value: TransType,
              ignoreFieldChange: true,
            });
            createRecord.setValue({
              fieldId: "custrecord_msa_pon_minimum_digit",
              value: 4,
              ignoreFieldChange: true,
            });
            createRecord.setValue({
              fieldId: "custrecord_msa_pon_start_date",
              value: startDate,
              ignoreFieldChange: true,
            });
            createRecord.setValue({
              fieldId: "custrecord_msa_pon_end_date",
              value: endDate,
              ignoreFieldChange: true,
            });
            var saveRun = createRecord.save({
              enableSourcing: false,
              ignoreMandatoryFields: true,
            });
            log.debug("saveRun", saveRun);
            if (saveRun) {
              log.debug("masukSave");
              log.debug("tranid", formatRunning);
              var setRunning = "";
              if (TransType == "estimate") {
                log.debug("transaction adalah quotation");
                setRunning = "0001" + formatRunning;
              } else {
                log.debug("else quot");
                setRunning = formatRunning + "0001";
              }
              log.debug('setRunning', setRunning)
              if (TransType == "custrecordentry") {
                recordTRans.setValue({
                  fieldId: "custrecord_iss_pr_tranid",
                  value: setRunning,
                  ignoreFieldChange: true,
                });
              } else {
                recordTRans.setValue({
                  fieldId: "tranid",
                  value: setRunning,
                  ignoreFieldChange: true,
                });
              }
              var savetrans = recordTRans.save({
                enableSourcing: false,
                ignoreMandatoryFields: true,
              });
              log.debug("saveTrans", savetrans);
            }
          }
        }
      } catch (e) {
        err_messages = "error in after submit " + e.name + ": " + e.message;
        log.error(err_messages);
      }
    }
  
    return {
      afterSubmit: afterSubmit,
    };
  });
  