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
          name: 'RECORD_TRANSFORM_FAILED',
          message: JSON.stringify(errorMsg)
        });
        err_message += handleErrorAndSendNotification(e, stage);
      }
      return err_message;
    }

    function getInputData() {
      var searchId = runtime.getCurrentScript().getParameter("custscriptabj_mr_cr_create_search_id");
      log.debug('searchId', searchId);
      var customerRefunt_toprocess = search.load({
        id: searchId
      });
      return customerRefunt_toprocess;

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

    function map(context) {
      var searchResult = JSON.parse(context.value);
      var customerID = searchResult.values.custrecord_abj_cust_ref_customer;
      var location = searchResult.values.custrecord_loc_list_scripted;
      var idResult = searchResult.id;
      // log.debug('location', location);
      // log.debug('customerID map', customerID);
      // log.debug('masuk map')
      // log.debug('searchResult', searchResult);
      var cust_refund_process = new cust_ref_process_data(
        searchResult.id,
        customerID,
        searchResult.values.custrecord_loc_list_scripted.value,
        searchResult.values.custrecord_abj_cust_ref_curr.value,
        searchResult.values.custrecord_abj_cust_ref_cre_app,
        searchResult.values.custrecord_abj_cust_ref_deposit_app,
        searchResult.values.custrecord_cr_id_customer_script.value,
        searchResult.values.custrecord_aracct_id_scripted.value,
        searchResult.values.custrecord_bankacct_id_scripted.value,
        searchResult.values.custrecord_sub_id_scripted.value,
        searchResult.values.custrecord_abj_cust_ref_bank_acc,
        searchResult.values.custrecord_abj_cust_ref_acc,
        searchResult.values.custrecord_abj_cust_ref_memo,
        searchResult.values.custrecord_abj_cust_ref_date,
        searchResult.values.custrecord_abj_cust_ref_exc_rate,
        searchResult.values.custrecord_cre_apply_doc_no_list_scrpt.value,
        searchResult.values.custrecord_dep_apply_doct_no_scripted.value,
        searchResult.values.custrecord_abj_cust_ref_sub
      );
      log.debug('cust_refund_process', cust_refund_process);
      log.debug('customerId', customerID);
      log.debug('idResult', idResult);
      context.write({
        key: customerID,
        value: cust_refund_process
      });
    }

    function reduce(context) {
      log.debug('masuk reduce')
      var customerID = context.key;
      log.debug('customerID reduce', customerID);
      var dataProcess = context.values;
      var customerrefundcount = 0;
      var CustomerRefundDoc;

      function updateProcessStatus(Status, customerID, data_process_ids, data_proc_id, err_message = '') {
        log.debug('data_proces_ids', data_process_ids)
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
        log.debug('dataProcessToUpdate', dataProcessToUpdate);

        dataProcessToUpdate.forEach(function(dataProcess) {
          var dataProcessId = dataProcess.getValue({
            name: 'internalid'
          });
          log.debug('dataProcessId', dataProcessId);
          var recDataToProcess = record.load({
            type: 'customrecord_abj_cut_ref_upload',
            id: dataProcessId,
            isDynamic: false
          });
          log.debug('Status', Status);
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
          var credits_apply = json_data.credits_apply;
          var deposit_apply = json_data.deposit_apply;
          var customerV = json_data.customerV;
          var ar_account = json_data.ar_account;
          var bank_account = json_data.bank_account;
          var memo = json_data.memo;
          var date = json_data.date;
          var exchange_rate = json_data.exchange_rate;
          var aracctid = json_data.aracctid;
          var bankacctid = json_data.bankacctid;
          var credit_appid = json_data.credit_appid;
          var deposit_applyid = json_data.deposit_applyid;
          var subsidiaryId = json_data.subsidiaryId;
          var subsidiary = json_data.subsidiary;
          if (credit_appid) {
            var getType = credits_apply.split("_");
            var typeCredit = getType[0];
            log.debug("typeCredit", typeCredit);
            if (typeCredit == 'CM') {
              var recCredit = record.load({
                type: 'creditmemo',
                id: credit_appid,
                isDynamic: true,
              });
              var cekCredit = recCredit.getValue("status");
              log.debug('cekCredit', cekCredit);
              if (cekCredit == 'Fully Applied') {
                updateProcessStatus('Failed', customerID, data_process_ids, 0, 'Failure to create Customer Refund for Customer: ' + customerID + ' ' + ' ' + 'there is a credit memo that has a fully applied status');
                return false;
              }
            }
            if(typeCredit == 'PAY'){
              var recPayment = record.load({
                type: 'customerpayment',
                id: credit_appid,
                isDynamic: true,
              });
              var cekPayment = recPayment.getValue("applied");
              log.debug('cekPayment', cekPayment);
              if(cekPayment>0){
                updateProcessStatus('Failed', customerID, data_process_ids, 0, 'Failure to create Customer Refund for Customer: ' + customerID + ' ' + ' ' + 'there is a Payment that has a fully applied status');
                return false;
              }
              
            }
          }
          if (deposit_applyid) {
            var recDepo = record.load({
              type: 'customerdeposit',
              id: deposit_applyid,
              isDynamic: true,
            });
            var cekDepo = recDepo.getValue("status");
            if (cekDepo == 'Fully Applied') {
              updateProcessStatus('Failed', customerID, data_process_ids, 0, 'Failure to create Customer Refund for Customer: ' + customerID + ' ' + ' ' + ' Customer Deposit is Fully Applied');
              return false;
            }
          }

          if (credits_apply && credit_appid == null) {
            updateProcessStatus('Failed', customerID, data_process_ids, 0, 'Failure to create Customer Refund for Customer: ' + customerID + ' ' + ' ' + ' Credit Apply is not found');
            return false;
          }
          if (deposit_apply && deposit_applyid == null) {
            updateProcessStatus('Failed', customerID, data_process_ids, 0, 'Failure to create Customer Refund for Customer: ' + customerID + ' ' + ' ' + ' Deposit Apply is not found');
            return false;
          }
          if (credits_apply == '' && deposit_apply == '') {
            updateProcessStatus('Failed', customerID, data_process_ids, 0, 'Failure to create Customer Refund for Customer: ' + customerID + ' ' + ' ' + 'No credit memo or deposit memo is entered');
            return false;
          }
          if (subsidiary && subsidiaryId == null) {
            updateProcessStatus('Failed', customerID, data_process_ids, 0, 'Failure to create Customer Refund for Customer: ' + customerID + ' ' + ' ' + ' Subsidiary Not Found');
            return false;
          }
          var date_upload = format.parse({
            value: date,
            type: format.Type.DATE
          });

          var postingPeriod = months[date_upload.getMonth()] + ' ' + date_upload.getFullYear();
          // log.debug('postingPeriod', postingPeriod);

          var postingPeriodData = search.load({
            id: 'customsearch602',
          });
          postingPeriodData.filters.push(search.createFilter({
            name: 'periodname',
            operator: search.Operator.IS,
            values: postingPeriod
          }));
          postingPeriodDataSet = postingPeriodData.run();
          postingPeriodData = postingPeriodDataSet.getRange(0, 1);
          // log.debug("postingPeriodData", postingPeriodData);
          var postingPeriodID = postingPeriodData[0].getValue("internalid");
          // log.debug("postingPeriodID", postingPeriodID);
          // log.debug('subsidiaryId', subsidiaryId);
          // log.debug('aracid', aracctid);
          // log.debug('bankacctid', bankacctid);
          if (!custExecute.includes(cust_id)) {
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

        dataProcess.forEach(function(data) {
          var json_data = JSON.parse(data);
          var data_process_id = json_data.id;
          var cust_id = json_data.cust_id;
          var locationid = json_data.locationid;
          var currenc = json_data.currenc;
          var credits_apply = json_data.credits_apply;
          var deposit_apply = json_data.deposit_apply;
          var customerV = json_data.customerV;
          var ar_account = json_data.ar_account;
          var bank_account = json_data.bank_account;
          var memo = json_data.memo;
          var date = json_data.date;
          var exchange_rate = json_data.exchange_rate;
          var aracctid = json_data.aracctid;
          var bankacctid = json_data.bankacctid;
          var credit_appid = json_data.credit_appid;
          var deposit_applyid = json_data.deposit_applyid;
          var subsidiaryId = json_data.subsidiaryId;
          var subsidiary = json_data.subsidiary;
          data_process_ids.push(data_process_id);
          // log.debug('data_process_ids', data_process_ids);
          // log.debug('subsidiaryid', subsidiaryId);

          
          // log.debug('credits_apply', credits_apply);

          if (credit_appid) {
            log.debug('masuk kondisi credit')
            lineTotal = CustomerRefundDoc.getLineCount({
              sublistId: 'apply'
            });
            log.debug('lineTotal', lineTotal);
            var pymt_line_to_apply = CustomerRefundDoc.findSublistLineWithValue({
              sublistId: 'apply',
              fieldId: 'internalid',
              value: credit_appid
            });

            log.debug("get pymt_line_to_apply", pymt_line_to_apply);
            CustomerRefundDoc.selectLine({
              sublistId: 'apply',
              line: pymt_line_to_apply
            });
            CustomerRefundDoc.setCurrentSublistValue({
              sublistId: 'apply',
              fieldId: 'apply',
              value: true
            });
            customerrefundcount++;
          }
          if (deposit_applyid) {
            // var deposit_apply_1 = deposit_apply.split("#");
            // var deposit_apply = deposit_apply_1[1];
            log.debug('deposit_apply', deposit_apply);
            lineTotal = CustomerRefundDoc.getLineCount({
              sublistId: 'deposit'
            });
            log.debug('lineTotalDeposit', lineTotal);

            CustomerRefundDoc.selectLine({
              sublistId: 'deposit',
              line: 0
            });
            var refnumline = CustomerRefundDoc.getCurrentSublistValue({
              sublistId: 'deposit',
              fieldId: 'refnum',
            });
            log.debug("refnumline", refnumline);

            var pymt_line_to_apply = CustomerRefundDoc.findSublistLineWithValue({
              sublistId: 'deposit',
              fieldId: 'refnum',
              value: deposit_apply
            });

            log.debug("get pymt_line_to_apply On Deposit", pymt_line_to_apply);
            CustomerRefundDoc.selectLine({
              sublistId: 'deposit',
              line: pymt_line_to_apply
            });
            CustomerRefundDoc.setCurrentSublistValue({
              sublistId: 'deposit',
              fieldId: 'apply',
              value: true
            });
            customerrefundcount++;
          }
          log.debug("customerrefundcount", customerrefundcount);
        });
        if (customerrefundcount > 0) {
          var data_proc_id = CustomerRefundDoc.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
          log.debug('data_proc_id', data_proc_id);
          if (data_proc_id) {
            log.debug('data_proc_idif', data_proc_id);
            updateProcessStatus('Success', customerID, data_process_ids, data_proc_id);
          }
        }
        context.write({
          key: customerID,
          value: data_process_ids
        })

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