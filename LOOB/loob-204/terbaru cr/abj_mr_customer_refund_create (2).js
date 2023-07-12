/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format'],
  function(search, record, email, runtime, error, format) {
    function handleErrorAndSendNotification(e, stage) {
      var subject = 'Map/Reduce script ' + runtime.getCurrentScript().id + ' failed for stage: ' + stage;
      var body = 'An error occurred with the following information:\n' +
        'Error code: ' + e.name + '\n' +
        'Error msg: ' + e.message;
      log.debug(subject, body);
      var err_message = subject + ' ' + body;
      return err_message;
    }

    function handleErrorIfAny(summary) {
      var inputSummary = summary.inputSummary;
      var mapSummary = summary.mapSummary;
      var reduceSummary = summary.reduceSummary;
      var err_message = '';
      if (inputSummary.error) {
        var e = error.create({
          name: 'INPUT_STAGE_FAILED',
          message: inputSummary.error
        });
        err_message += handleErrorAndSendNotification(e, 'getInputData');
      }

      err_message += handleErrorInStage('map', mapSummary);
      err_message += handleErrorInStage('reduce', reduceSummary);
      return err_message;
    }

    function handleErrorInStage(stage, summary) {
      var errorMsg = [];
      summary.errors.iterator().each(function(key, value) {
        var msg = 'Failure to create for custom refund : ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
        errorMsg.push(msg);
        return true;
      });
      var err_message = '';
      if (errorMsg.length > 0) {
        var e = error.create({
          name: 'RECORD_CREATE_FAILED',
          message: JSON.stringify(errorMsg)
        });
        err_message += handleErrorAndSendNotification(e, stage);
      }
      return err_message;
    }

    function getAllResults(s) {
      var results = s.run();
      var searchResults = [];
      var searchid = 0;
      do {
        var resultslice = results.getRange({
          start: searchid,
          end: searchid + 1000
        });
        resultslice.forEach(function(slice) {
          searchResults.push(slice);
          searchid++;
        });
      } while (resultslice.length >= 1000);
      return searchResults;
    }

    function getInputData() {
      var searchId = runtime.getCurrentScript().getParameter("custscriptabj_mr_cr_create_search_id");
      var customerRefundProcess = [];

      var customerRefunt_toprocess = search.load({
        id: searchId
      });
      var myResult = getAllResults(customerRefunt_toprocess);
      let counter = 0;
      myResult.forEach(function(result) {
        counter++;
        if (counter <= 10000) {
          var internalid = result.getValue('internalid');
          var cust_id = result.getValue('custrecord_abj_cust_ref_customer');
          var locationid = result.getValue('custrecord_loc_list_scripted');
          var currenc = result.getValue('custrecord_abj_cust_ref_curr');
          var credits_apply = result.getValue('custrecord_abj_cust_ref_cre_app');
          var deposit_apply = result.getValue('custrecord_abj_cust_ref_deposit_app');
          var customerV = result.getValue('custrecord_cr_id_customer_script');
          var aracctid = result.getValue('custrecord_aracct_id_scripted');
          var bankacctid = result.getValue('custrecord_bankacct_id_scripted');
          var subsidiaryId = result.getValue('custrecord_sub_id_scripted');
          var ar_account = result.getValue('custrecord_abj_cust_ref_acc');
          var bank_account = result.getValue('custrecord_abj_cust_ref_bank_acc');
          var memo = result.getValue('custrecord_abj_cust_ref_memo');
          var date = result.getValue('custrecord_abj_cust_ref_date');
          var exchange_rate = result.getValue('custrecord_abj_cust_ref_exc_rate');
          var credit_appid = result.getValue('custrecord_cre_apply_doc_no_list_scrpt');
          var deposit_applyid = result.getValue('custrecord_dep_apply_doct_no_scripted');
          var subsidiary = result.getValue('custrecord_abj_cust_ref_sub');
          customerRefundProcess.push({
            id: internalid,
            cust_id: cust_id,
            locationid: locationid,
            currenc: currenc,
            credits_apply: credits_apply,
            deposit_apply: deposit_apply,
            customerV: customerV,
            aracctid: aracctid,
            bankacctid: bankacctid,
            subsidiaryId: subsidiaryId,
            ar_account: ar_account,
            bank_account: bank_account,
            memo: memo,
            date: date,
            exchange_rate: exchange_rate,
            credit_appid: credit_appid,
            deposit_applyid: deposit_applyid,
            subsidiary: subsidiary
          });
        }
      });
      log.debug("customerRefundProcess", customerRefundProcess.length);
      return customerRefundProcess;

    }

    function cust_ref_process_data(id, cust_id, locationid, currenc, credits_apply, deposit_apply, customerV, aracctid, bankacctid, subsidiaryId, ar_account, bank_account, memo, date, exchange_rate, credit_appid, deposit_applyid, subsidiary) {
      this.id = id;
      this.cust_id = cust_id;
      this.locationid = locationid;
      this.currenc = currenc;
      this.credits_apply = credits_apply;
      this.deposit_apply = deposit_apply;
      this.customerV = customerV;
      this.aracctid = aracctid;
      this.bankacctid = bankacctid;
      this.subsidiaryId = subsidiaryId;
      this.ar_account = ar_account;
      this.bank_account = bank_account;
      this.memo = memo;
      this.date = date;
      this.exchange_rate = exchange_rate;
      this.credit_appid = credit_appid;
      this.deposit_applyid = deposit_applyid;
      this.subsidiary = subsidiary
    }

    // var searchResultCount = 0;
    // var batchSize = 700;
    // var previousCustomerID = null;
    // var customerIDCountMap = {};

    // function map(context) {
    //   var searchResult = JSON.parse(context.value);
    //   var customerID = searchResult.cust_id;

    //   if (customerID !== previousCustomerID) {
    //     previousCustomerID = customerID;
    //     if (customerID in customerIDCountMap) {
    //       searchResultCount = customerIDCountMap[customerID];
    //     } else {
    //       searchResultCount = 0;
    //     }
    //   }

    //   searchResultCount++;
    //   log.debug('searchResultCount', searchResultCount);

    //   var batchIndex = Math.floor((searchResultCount - 1) / batchSize);
    //   var unikKey = customerID;

    //   if (searchResultCount > batchSize) {
    //     var batchCount = Math.floor((searchResultCount - 1) / batchSize);
    //     unikKey = customerID + "_" + batchCount;

    //     if (batchCount > 1) {
    //       var remainingCount = searchResultCount - batchSize * batchCount;
    //       if (remainingCount > batchSize) {
    //         var extraBatchCount = Math.floor((remainingCount - 1) / batchSize);
    //         unikKey = customerID + "_" + (batchCount + extraBatchCount);
    //       }
    //     }

    //     if (batchCount >= 2 && searchResultCount % batchSize === 1) {
    //       customerIDCountMap[customerID] = searchResultCount - batchSize;
    //     }
    //   }
          
    var searchResultCount = 0;
    var batchSize = 700;
    var previousCustomerID = null;
    var customerIDCountMap = {};

    function map(context) {
      var searchResult = JSON.parse(context.value);
      var customerID = searchResult.cust_id;
    
      if (customerID in customerIDCountMap) {
        searchResultCount = customerIDCountMap[customerID] + 1;
      } else {
        searchResultCount = 1;
      }
    
      log.debug('searchResultCount', searchResultCount);
    
      var batchIndex = Math.floor((searchResultCount - 1) / batchSize);
      var unikKey = customerID;
    
      if (searchResultCount > batchSize) {
        var batchCount = Math.floor((searchResultCount - 1) / batchSize);
        unikKey = customerID + "_" + batchCount;
    
        if (batchCount > 1) {
          var remainingCount = searchResultCount - batchSize * batchCount;
          if (remainingCount > batchSize) {
            var extraBatchCount = Math.floor((remainingCount - 1) / batchSize);
            unikKey = customerID + "_" + (batchCount + extraBatchCount);
          }
        }
    
        if (batchCount >= 2 && searchResultCount % batchSize === 1) {
          customerIDCountMap[customerID] = searchResultCount - batchSize;
        }
      } else {
        customerIDCountMap[customerID] = searchResultCount;
      }
    
      var cust_refund_process = new cust_ref_process_data(
        searchResult.id,
        customerID,
        searchResult.locationid,
        searchResult.currenc,
        searchResult.credits_apply,
        searchResult.deposit_apply,
        searchResult.customerV,
        searchResult.aracctid,
        searchResult.bankacctid,
        searchResult.subsidiaryId,
        searchResult.ar_account,
        searchResult.bank_account,
        searchResult.memo,
        searchResult.date,
        searchResult.exchange_rate,
        searchResult.credit_appid,
        searchResult.deposit_applyid,
        searchResult.subsidiary
      );
      context.write({
        key: unikKey,
        value: cust_refund_process
      });
      
      log.debug('unikKey', unikKey);
    }
    

    function reduce(context) {
      // log.debug('masuk reduce')
      var customerID = context.key;
      log.debug('customerID reduce', customerID);
      var dataProcess = context.values;
      var customerrefundcount = 0;
      var CustomerRefundDoc;

      function updateProcessStatus(Status, customerID, data_process_ids, data_proc_id, err_message = '') {
        // log.debug('data_proces_ids', data_process_ids)
        const underscoreIndex = customerID.lastIndexOf('_');
        if (underscoreIndex !== -1) {
          const suffix = customerID.substring(underscoreIndex + 1);
          if (!isNaN(suffix) && suffix.length === 1) {
            customerID = customerID.substring(0, underscoreIndex);
          }
        }
        log.debug('customerIDprosesupdate', customerID);
        var dataProcessToUpdate = search.create({
          type: 'customrecord_abj_cut_ref_upload',
          columns: ['internalid', 'custrecord_abj_cust_ref_customer'],
          filters: [{
            name: 'custrecord_abj_cust_ref_customer',
            operator: 'is',
            values: customerID
          }, ]
        });
        if (data_process_ids.length > 0) {
          dataProcessToUpdate.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: data_process_ids
          }));
        }
        var dataProcessToUpdateSet = dataProcessToUpdate.run();
        dataProcessToUpdate = dataProcessToUpdateSet.getRange(0, 1000);
        // log.debug('dataProcessToUpdate', dataProcessToUpdate);

        dataProcessToUpdate.forEach(function(dataProcess) {
          var dataProcessId = dataProcess.getValue({
            name: 'internalid'
          });
          // log.debug('dataProcessId', dataProcessId);
          var recDataToProcess = record.load({
            type: 'customrecord_abj_cut_ref_upload',
            id: dataProcessId,
            isDynamic: false
          });
          // log.debug('Status', Status);
          recDataToProcess.setValue({
            fieldId: 'custrecord_abj_cust_ref_status',
            value: Status,
            ignoreFieldChange: true
          });
          if (Status == 'Success') {
            recDataToProcess.setValue({
              fieldId: 'custrecord_abj_cust_ref_refund',
              value: data_proc_id,
              ignoreFieldChange: true
            });
          }
          recDataToProcess.setValue({
            fieldId: 'custrecord_abj_cus_ref_create',
            value: false,
            ignoreFieldChange: true
          });
          recDataToProcess.setValue({
            fieldId: 'custrecord_abj_cust_ref_error_details',
            value: Status == 'Success' ? '' : err_message,
            ignoreFieldChange: true
          });
          recDataToProcess.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        });
      }

      try {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var data_process_ids = [];
        var custExecute = [];

        log.debug("tess", {
          customerID: customerID,
          dataProcess: dataProcess.length,
        });

        CustomerRefundDoc = record.create({
          type: record.Type.CUSTOMER_REFUND,
          isDynamic: true,
        });
        // header
        dataProcess.forEach(function(data) {
          var json_data = JSON.parse(data);
          var cust_id = json_data.cust_id;
          var locationid = json_data.locationid;
          var currenc = json_data.currenc;
          var customerV = json_data.customerV;
          var memo = json_data.memo;
          var date = json_data.date;
          var exchange_rate = json_data.exchange_rate;
          var aracctid = json_data.aracctid;
          var bankacctid = json_data.bankacctid;
          var subsidiaryId = json_data.subsidiaryId;

          if (!custExecute.includes(cust_id)) {
            log.debug("loop_head", cust_id);
            var date_upload = format.parse({
              value: date,
              type: format.Type.DATE
            });

            var postingPeriod = months[date_upload.getMonth()] + ' ' + date_upload.getFullYear();
            var postingPeriodData = search.create({
              type: "accountingperiod",
              filters: [
                ["periodname", "is", postingPeriod]
              ],
              columns: [
                search.createColumn({
                  name: "periodname",
                  sort: search.Sort.ASC
                }),
                "internalid"
              ]
            });
            var postingPeriodID;
            postingPeriodData.run().each(function(result) {
              postingPeriodID = result.getValue({
                name: 'internalid'
              });
              return true;
            });
            // var postingPeriodData = search.create({
            //   id: 'customsearch_accounting_period',
            // });
            // postingPeriodData.filters.push(search.createFilter({
            //   name: 'periodname',
            //   operator: search.Operator.IS,
            //   values: postingPeriod
            // }));
            // postingPeriodDataSet = postingPeriodData.run();
            // postingPeriodData = postingPeriodDataSet.getRange(0, 1);
            // var postingPeriodID = postingPeriodData[0].getValue("internalid");
            if (customerV || aracctid || bankacctid) {
              CustomerRefundDoc.setValue({
                fieldId: 'customer',
                value: customerV,
                ignoreFieldChange: false
              });
              if (subsidiaryId) {
                CustomerRefundDoc.setValue({
                  fieldId: 'subsidiary',
                  value: subsidiaryId,
                  ignoreFieldChange: false
                });
              }
              CustomerRefundDoc.setValue({
                fieldId: 'postingperiod',
                value: postingPeriodID,
                ignoreFieldChange: false
              });
              CustomerRefundDoc.setValue({
                fieldId: 'currency',
                value: currenc,
                ignoreFieldChange: false
              });
              CustomerRefundDoc.setValue({
                fieldId: 'aracct',
                value: aracctid,
                ignoreFieldChange: false
              });
              CustomerRefundDoc.setValue({
                fieldId: 'account',
                value: bankacctid,
                ignoreFieldChange: false
              });
              CustomerRefundDoc.setValue({
                fieldId: 'exchangerate',
                value: exchange_rate,
                ignoreFieldChange: false
              });
              CustomerRefundDoc.setValue({
                fieldId: 'trandate',
                value: date_upload,
                ignoreFieldChange: false
              });
              CustomerRefundDoc.setValue({
                fieldId: 'memo',
                value: memo,
                ignoreFieldChange: false
              });
              CustomerRefundDoc.setValue({
                fieldId: 'location',
                value: locationid,
                ignoreFieldChange: false
              });
              custExecute.push(cust_id);
            }
          }
        });

        // log.debug("dataProcess", dataProcess);
        dataProcess.forEach(function(data) {
          var json_data = JSON.parse(data);
          var data_process_id = json_data.id;
          var deposit_apply = json_data.deposit_apply;
          var credit_appid = json_data.credit_appid;
          var deposit_applyid = json_data.deposit_applyid;
          data_process_ids.push(data_process_id);
          // log.debug('data_process_ids', data_process_ids);
          // log.debug('subsidiaryid', subsidiaryId);


          // log.debug('credits_apply', credits_apply);

          if (credit_appid) {
            // log.debug('masuk kondisi credit')
            lineTotal = CustomerRefundDoc.getLineCount({
              sublistId: 'apply'
            });
            // log.debug('lineTotal', lineTotal);
            var pymt_line_to_apply = CustomerRefundDoc.findSublistLineWithValue({
              sublistId: 'apply',
              fieldId: 'internalid',
              value: credit_appid
            });

            // log.debug("get pymt_line_to_apply", pymt_line_to_apply);
            if (pymt_line_to_apply >= 0) {
              CustomerRefundDoc.selectLine({
                sublistId: 'apply',
                line: pymt_line_to_apply
              });
              CustomerRefundDoc.setCurrentSublistValue({
                sublistId: 'apply',
                fieldId: 'apply',
                value: true
              });
            }
            customerrefundcount++;
          }
          if (deposit_applyid) {
            // var deposit_apply_1 = deposit_apply.split("#");
            // var deposit_apply = deposit_apply_1[1];
            // log.debug('deposit_apply', deposit_apply);
            lineTotal = CustomerRefundDoc.getLineCount({
              sublistId: 'deposit'
            });
            // log.debug('lineTotalDeposit', lineTotal);

            CustomerRefundDoc.selectLine({
              sublistId: 'deposit',
              line: 0
            });
            var refnumline = CustomerRefundDoc.getCurrentSublistValue({
              sublistId: 'deposit',
              fieldId: 'refnum',
            });
            // log.debug("refnumline", refnumline);

            var pymt_line_to_apply = CustomerRefundDoc.findSublistLineWithValue({
              sublistId: 'deposit',
              fieldId: 'refnum',
              value: deposit_apply
            });

            // log.debug("get pymt_line_to_apply On Deposit", pymt_line_to_apply);
            if (pymt_line_to_apply >= 0) {
              CustomerRefundDoc.selectLine({
                sublistId: 'deposit',
                line: pymt_line_to_apply
              });
              CustomerRefundDoc.setCurrentSublistValue({
                sublistId: 'deposit',
                fieldId: 'apply',
                value: true
              });
            }
            customerrefundcount++;
          }
        });
        // log.debug("customerrefundcount", customerrefundcount);
        if (customerrefundcount > 0) {
          var data_proc_id = CustomerRefundDoc.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
          // log.debug('data_proc_id', data_proc_id);
          if (data_proc_id) {
            log.debug('data_proc_id', data_proc_id);
            updateProcessStatus('Success', customerID, data_process_ids, data_proc_id);
          }
        }
        context.write({
          key: customerID,
          value: data_process_ids
        });

      } catch (e) {
        var err_msg = 'Failure to create Customer Refund for Customer: ' + customerID + ' ' + e.name + ': ' + e.message + '\n';
        updateProcessStatus('Failed', customerID, data_process_ids, 0, err_msg);
      }
    }

    function summarize(summary) {
      handleErrorIfAny(summary);
      log.debug('Usage Consumed', summary.usage);
    }
    return {
      getInputData: getInputData,
      map: map,
      reduce: reduce,
      summarize: summarize
    };
  });