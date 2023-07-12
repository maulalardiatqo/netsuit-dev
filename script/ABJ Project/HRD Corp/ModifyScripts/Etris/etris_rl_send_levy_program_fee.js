/*******************************************************************************
 * @Client        :  HRDC
 * @Script Name   :  etris_rl_send_levy_program_fee.js
 * @script Record :  - ETRIS RL | Send Levy Program Fee
 * @Trigger Type  :  post
 * @Release Date  :  Jun 2nd 2022
 * @Author        :  Prasad Adari
 * @Description   :
 * @Enhancement   :
 *
 * @NApiVersion 2.1
 * @NScriptType Restlet
 *
 ******************************************************************************/
define(['N/record', 'N/runtime', 'N/format', 'N/search', 'N/file', './etris_module.js'], function(record, runtime, format, search, file, ETRIS_MODULE) {

  function _get(context) {

  }

  function _post(context) {
    try {
      var scriptObj = runtime.getCurrentScript();
      let folderId = scriptObj.getParameter({
        name: 'custscript_etris_rl_folder_id1'
      });
      //let departmentId = scriptObj.getParameter({name: ''});
      let departmentId = 869;
      log.debug('folderId', folderId);
      //log.debug('departmentId', departmentId);
      log.debug('Data', context);
      var inv_id, cpay_id, vb_id, vbp_id, je_id, cn_id, vc_id, dn_id;

      var etRisJsonRecObj = record.create({
        type: 'customrecord_sol_etris_json'
      });

      let _date = new Date();

      let fileId = file.create({
        name: "Levy_Program_Fee_" + _date.getDate() + '-' + (_date.getMonth() + 1) + '-' + _date.getFullYear() + '-' + _date.getTime(),
        fileType: file.Type.PLAINTEXT,
        contents: JSON.stringify(context),
        encoding: file.Encoding.UTF8,
        folder: folderId
      }).save();

      etRisJsonRecObj.setValue('custrecord_sol_etris_process', 2); //2. Levy Fee
      etRisJsonRecObj.setValue('custrecord_sol_etris_json', fileId);
      etRisJsonRecObj.setValue('custrecord_sol_etris_status', 'Request RECEIVED');
      etRisJsonRecObj.setValue('custrecord_sol_etris_process_name', context.program_fee_service.program_fee.process_name);
      etRisJsonRecObj.setValue('custrecord_sol_etris_transaction_scheme', context.program_fee_service.program_fee.scheme);
      etRisJsonRecObj.setValue('custrecord_sol_etris_isrefund', context.program_fee_service.program_fee.refund);
      etRisJsonRecObj.setValue('custrecord_sol_etris_cancellation', context.program_fee_service.program_fee.cancellation);
      var statusRecId = etRisJsonRecObj.save();
      log.debug("statusRecId", statusRecId);

      var jsonData = {
        'custbody_sol_etris_customer_type': context.program_fee_service.program_fee.customer_type,
        'custbody_sol_etris_bank_transaction_id': context.program_fee_service.program_fee.bank_transaction_id,
        'custbody_sol_etris_reference_number': context.program_fee_service.program_fee.reference_number,
        'custbody_sol_etris_customer_id': context.program_fee_service.program_fee.customer_id,
        'custbody_sol_etris_contact_person_name': context.program_fee_service.program_fee.contact_person_name,
        'custbody_sol_etris_contact_person_desn': context.program_fee_service.program_fee.contact_person_desn,
        'custbody_sol_etris_contact_persn_email': context.program_fee_service.program_fee.contact_person_email,
        'custbody_sol_etris_total_amount': context.program_fee_service.program_fee.total_amount,
        'custbody_sol_etris_cheque_number': context.program_fee_service.program_fee.cheque_number,
        'custbody_sol_etris_scheme': context.program_fee_service.program_fee.scheme,
        'custbody_sol_etris_payment_month': context.program_fee_service.program_fee.payment_month,
        'custbody_sol_etris_payment_year': context.program_fee_service.program_fee.payment_year,
        'custbody_sol_etris_registration_date': context.program_fee_service.program_fee.registration_date,
        //'custbody_sol_etris_bank_code'             : context.program_fee_service.program_fee.bank_code,
        'custbody_sol_etris_bank_branch': context.program_fee_service.program_fee.bank_branch,
        'custbody_sol_etris_process_name': context.program_fee_service.program_fee.process_name,
        'custbody_sol_etris_transaction_remark_': context.program_fee_service.program_fee.transaction_remarks,
        //'custbody_sol_etris_reverse_flag'          : context.program_fee_service.program_fee.reverse_flag,
        'custbody_sol_etris_typeof_payment_': context.program_fee_service.program_fee.typeof_payment,
        'custbody_sol_etris_refund': context.program_fee_service.program_fee.refund,
        'custbody_sol_etris_cancellation_': context.program_fee_service.program_fee.cancellation
      };
      log.debug("jsonData", JSON.stringify(jsonData));

      let eTrisMapperSearchObj = searchEtrisMapper(2, jsonData.custbody_sol_etris_process_name, jsonData.custbody_sol_etris_cancellation_, jsonData.custbody_sol_etris_refund, jsonData.custbody_sol_etris_scheme); //processName, isCancel, isrefund, scheme
      log.debug("eTrisMapperSearchObj", JSON.stringify(eTrisMapperSearchObj));

      //If eTris maaper found then proceed
      if (eTrisMapperSearchObj.length > 0) {
        var mappingRecId = eTrisMapperSearchObj[0].getValue('internalid');
        log.debug('mappingRecId', mappingRecId);
        var invProcess = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_inv');
        var custPaymentProcess = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_cp');
        var vendBillProcess = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_vb');
        var BillPaymentProcess = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_vp');
        var JournalProcess = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_jv');
        var CredNoteProcess = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_cn');
        var vendCredProcess = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_vc');
        var DebNoteProcess = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_dn');

        var etrismapRecId = "",
          _statusDetails = "",
          _status = "";
        var arAccount = 2922;
        var apAccount = 2821;
        var _trandate = (jsonData.custbody_sol_etris_registration_date).replaceAll('-', '/');
        log.debug('trandate', _trandate);
        var amount = jsonData.custbody_sol_etris_total_amount;
        log.debug('amount', amount);

        //Finding the customer
        var customerSearchObj = search.create({
          type: search.Type.CUSTOMER,
          filters: [
            ['custentity_sol_ertis_my_co_id', 'is', jsonData.custbody_sol_etris_customer_id]
          ],
          columns: ['internalid', 'custentity_sol_etris_sst_applicable']
        }).run().getRange(0, 1);

        //Finding the Vendor
        var vendorSearchObj = search.create({
          type: search.Type.VENDOR,
          filters: [
            ['custentity_sol_ertis_my_co_id', 'is', jsonData.custbody_sol_etris_customer_id]
          ],
          columns: ['internalid', 'custentity_sol_etris_sst_applicable']
        }).run().getRange(0, 1);

        //============> INVOICE PROCESS <=========
        if (invProcess) {
          //invoiceProcess(customerSearchObj, eTrisMapperSearchObj, _trandate, arAccount, jsonData);
          if (customerSearchObj.length > 0) {
            let customerId = customerSearchObj[0].getValue('internalid');
            let isSST = customerSearchObj[0].getValue('custentity_sol_etris_sst_applicable');
            log.debug('INV: customerId', customerId);

            //Finding AR Account and Item (based on EXTRENALID)
            let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_inv_gl')).split(':');
            var itemExternalId = "";

            if (_sourceArray[1] == "Scheme_Source") {

              let _scheme = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') ? eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') : jsonData.custbody_sol_etris_scheme;
              log.debug('_scheme', _scheme);

              let schemeSearchObj = search.create({
                type: 'customrecord_sol_etris_schemesource',
                filters: [
                  ['name', 'is', _scheme]
                ],
                columns: [
                  search.createColumn({
                    name: "custrecord_sol_ss_bankacc",
                    label: "Bank Account"
                  }),
                  search.createColumn({
                    name: "number",
                    join: "CUSTRECORD_SOL_SS_BANKACC",
                    label: "Number"
                  })
                ]
              }).run().getRange(0, 1);

              if (schemeSearchObj.length > 0) {
                itemExternalId = schemeSearchObj[0].getValue({
                  name: "number",
                  join: "CUSTRECORD_SOL_SS_BANKACC",
                  label: "Number"
                });
              }
            } else {
              itemExternalId = _sourceArray[1];
            }
            log.debug("INV: itemExternalId", itemExternalId);

            //search Item based on externalid
            let invItemSearchObj = search.create({
              type: 'customrecord_sol_etris_item_source',
              filters: [
                ['custrecord_sol_etris_is_item', 'is', itemExternalId]
              ],
              columns: ['custrecord_sol_etris_is_purchase', 'custrecord_sol_etris_is_sale']
            }).run().getRange(0, 1);

            if (invItemSearchObj.length > 0) {
              let _invItemId = invItemSearchObj[0].getValue('custrecord_sol_etris_is_sale');
              log.debug('INV: _invItemId', _invItemId);

              let invId = ETRIS_MODULE.createInvoice(customerId, _trandate, arAccount, _invItemId, amount, jsonData, departmentId, 2, isSST);
              inv_id = invId;
              etrismapRecId = mappingRecId;
              _status = "SUCCESS";
              _statusDetails = "invId: " + invId;
            } else {
              etrismapRecId = mappingRecId;
              _status = "FAIL";
              _statusDetails = "ITEM NOT FOUND for the given ITEM (Internalid: " + itemExternalId + ") for INV ";
            }
          } else {
            etrismapRecId = mappingRecId;
            _status = "FAIL";
            _statusDetails = "CUSTOMER NOT FOUND for the given mapping for INV ";
          }
        }

        //============> CUSTOMER PAYMENT <=========
        if (custPaymentProcess) {
          if (customerSearchObj.length > 0) {
            let customerId = customerSearchObj[0].getValue('internalid');
            log.debug('CP-INV: customerId', customerId);

            //Finding AR Account and Item (based on EXTRENALID)
            let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_inv_gl')).split(':');
            var itemExternalId = "";

            if (_sourceArray[1] == "Scheme_Source") {

              let _scheme = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') ? eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') : jsonData.custbody_sol_etris_scheme;
              log.debug('_scheme', _scheme);

              let schemeSearchObj = search.create({
                type: 'customrecord_sol_etris_schemesource',
                filters: [
                  ['name', 'is', _scheme]
                ],
                columns: [
                  search.createColumn({
                    name: "custrecord_sol_ss_bankacc",
                    label: "Bank Account"
                  }),
                  search.createColumn({
                    name: "number",
                    join: "CUSTRECORD_SOL_SS_BANKACC",
                    label: "Number"
                  })
                ]
              }).run().getRange(0, 1);

              if (schemeSearchObj.length > 0) {
                itemExternalId = schemeSearchObj[0].getValue({
                  name: "number",
                  join: "CUSTRECORD_SOL_SS_BANKACC",
                  label: "Number"
                });
              }
            } else {
              itemExternalId = _sourceArray[1];
            }
            log.debug("INV: itemExternalId", itemExternalId);

            //search Item based on externalid
            let invItemSearchObj = search.create({
              type: 'customrecord_sol_etris_item_source',
              filters: [
                ['custrecord_sol_etris_is_item', 'is', itemExternalId]
              ],
              columns: ['custrecord_sol_etris_is_purchase', 'custrecord_sol_etris_is_sale']
            }).run().getRange(0, 1);

            if (invItemSearchObj.length > 0) {
              let _invItemId = invItemSearchObj[0].getValue('custrecord_sol_etris_is_sale');
              log.debug('CP-INV: _invItemId', _invItemId);

              let invId = ETRIS_MODULE.createInvoice(customerId, _trandate, arAccount, _invItemId, amount, jsonData, departmentId, 2);
              inv_id = invId;
              log.debug('CP-INV: InvoiceID', invId);

              let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_cp_gl')).split(':');
              let scheme = _sourceArray[0];
              log.debug('CP: scheme', scheme);

              //Finding respective bank account from Scheme
              var cpSchemeSearchObj = search.create({
                type: 'customrecord_sol_etris_schemesource',
                filters: [
                  ['name', 'is', jsonData.custbody_sol_etris_scheme]
                ],
                columns: ['custrecord_sol_ss_bankacc']
              }).run().getRange(0, 1);

              if (cpSchemeSearchObj.length > 0 && invId) {
                let bankAccount = cpSchemeSearchObj[0].getValue('custrecord_sol_ss_bankacc');
                log.debug('CP: bankAccount', bankAccount);

                let custPayID = ETRIS_MODULE.createCustomerPayment(invId, _trandate, arAccount, bankAccount, jsonData, departmentId, 2);
                cpay_id = custPayID;
                etrismapRecId = mappingRecId;
                _status = "SUCCESS";
                _statusDetails = "custPayID: " + custPayID;
              } else {
                etrismapRecId = mappingRecId;
                _status = "FAIL";
                _statusDetails = "SCHEME SOURCE NOT FOUND for CP ";
              }
            } else {
              etrismapRecId = mappingRecId;
              _status = "FAIL";
              _statusDetails = "ITEM NOT FOUND for the given ITEM (Internalid: " + itemExternalId + ") for CP ";
            }
          } else {
            etrismapRecId = mappingRecId;
            _status = "FAIL";
            _statusDetails = "CUSTOMER NOT FOUND for the given mapping for CP ";
          }
        }

        //============> VENDOR BILL PROCESS <=========
        if (vendBillProcess) {
          if (vendorSearchObj.length > 0) {
            let vendorId = vendorSearchObj[0].getValue('internalid');
            log.debug('VB: vendorId', vendorId);

            //Finding AR Account and Item (based on EXTRENALID)
            let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_vb_gl')).split(':');
            var itemExternalId = "";

            if (_sourceArray[0] == "Scheme_Source") {

              let _scheme = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') ? eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') : jsonData.custbody_sol_etris_scheme;
              log.debug('_scheme', _scheme);

              let schemeSearchObj = search.create({
                type: 'customrecord_sol_etris_schemesource',
                filters: [
                  ['name', 'is', _scheme]
                ],
                columns: [
                  search.createColumn({
                    name: "custrecord_sol_ss_bankacc",
                    label: "Bank Account"
                  }),
                  search.createColumn({
                    name: "number",
                    join: "CUSTRECORD_SOL_SS_BANKACC",
                    label: "Number"
                  })
                ]
              }).run().getRange(0, 1);

              if (schemeSearchObj.length > 0) {
                itemExternalId = schemeSearchObj[0].getValue({
                  name: "number",
                  join: "CUSTRECORD_SOL_SS_BANKACC",
                  label: "Number"
                });
              }
            } else {
              itemExternalId = _sourceArray[0];
            }
            log.debug("VB: itemExternalId", itemExternalId);

            //search Item based on externalid
            procItemSearchObj = search.create({
              type: 'customrecord_sol_etris_item_source',
              filters: [
                ['custrecord_sol_etris_is_item', 'is', itemExternalId]
              ],
              columns: ['custrecord_sol_etris_is_purchase', 'custrecord_sol_etris_is_sale']
            }).run().getRange(0, 1);

            if (procItemSearchObj.length > 0) {
              let procItemId = procItemSearchObj[0].getValue('custrecord_sol_etris_is_purchase');
              log.debug('VB: procItemId', procItemId);

              let vendBillId = ETRIS_MODULE.createVendorBill(vendorId, _trandate, apAccount, procItemId, amount, jsonData, departmentId, 2);
              vb_id = vendBillId;
              etrismapRecId = mappingRecId;
              _status = "SUCCESS";
              _statusDetails = "invId: " + vendBillId;
            } else {
              etrismapRecId = mappingRecId;
              _status = "FAIL";
              _statusDetails = "ITEM NOT FOUND for the given ITEM (" + itemExternalId + ") for VB ";
            }
          } else {
            etrismapRecId = mappingRecId;
            _status = "FAIL";
            _statusDetails = "VENDOR NOT FOUND for the given mapping for VB ";
          }
        }

        //============> BILL PAYMENT PROCESS <=========
        if (BillPaymentProcess) {
          if (vendorSearchObj.length > 0) {
            let vendorId = vendorSearchObj[0].getValue('internalid');
            log.debug('VB-PAY: vendorId', vendorId);

            //Finding AR Account and Item (based on EXTRENALID)
            let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_vb_gl')).split(':');
            var itemExternalId = "";

            if (_sourceArray[0] == "Scheme_Source") {

              let _scheme = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') ? eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') : jsonData.custbody_sol_etris_scheme;
              log.debug('_scheme', _scheme);

              let schemeSearchObj = search.create({
                type: 'customrecord_sol_etris_schemesource',
                filters: [
                  ['name', 'is', _scheme]
                ],
                columns: [
                  search.createColumn({
                    name: "custrecord_sol_ss_bankacc",
                    label: "Bank Account"
                  }),
                  search.createColumn({
                    name: "number",
                    join: "CUSTRECORD_SOL_SS_BANKACC",
                    label: "Number"
                  })
                ]
              }).run().getRange(0, 1);

              if (schemeSearchObj.length > 0) {
                itemExternalId = schemeSearchObj[0].getValue({
                  name: "number",
                  join: "CUSTRECORD_SOL_SS_BANKACC",
                  label: "Number"
                });
              }
            } else {
              itemExternalId = _sourceArray[1];
            }
            log.debug("VB-PAY: itemExternalId", itemExternalId);

            //search Item based on externalid
            procItemSearchObj = search.create({
              type: 'customrecord_sol_etris_item_source',
              filters: [
                ['custrecord_sol_etris_is_item', 'is', itemExternalId]
              ],
              columns: ['custrecord_sol_etris_is_purchase', 'custrecord_sol_etris_is_sale']
            }).run().getRange(0, 1);

            if (procItemSearchObj.length > 0) {
              let procItemId = procItemSearchObj[0].getValue('custrecord_sol_etris_is_purchase');
              log.debug('VB-PAY: procItemId', procItemId);

              let vendBillId = ETRIS_MODULE.createVendorBill(vendorId, _trandate, apAccount, procItemId, amount, jsonData, departmentId, 2);
              vb_id = vendBillId;
              log.debug('VB-PAY: vendBillId', vendBillId);

              let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_vp_gl')).split(':');
              let scheme = _sourceArray[1];
              log.debug('VBP: scheme', scheme);

              //Finding respective bank account from Scheme
              var schemeSearchObj = search.create({
                type: 'customrecord_sol_etris_schemesource',
                filters: [
                  ['name', 'is', jsonData.custbody_sol_etris_scheme]
                ],
                columns: ['custrecord_sol_ss_bankacc']
              }).run().getRange(0, 1);

              if (schemeSearchObj.length > 0 && invId) {
                let bankAccount = schemeSearchObj[0].getValue('custrecord_sol_ss_bankacc');
                log.debug('VBP: bankAccount', bankAccount);

                let vendPayID = ETRIS_MODULE.createBillPayment(vendBillId, _date, apAccount, bankAccount, jsondata, departmentId, 2);
                vbp_id = vendPayID;
                etrismapRecId = mappingRecId;
                _status = "SUCCESS";
                _statusDetails = "vendPayID: " + vendPayID;
              } else {
                etrismapRecId = mappingRecId;
                _status = "FAIL";
                _statusDetails = "SCHEME SOURCE NOT FOUND for CP ";
              }
            } else {
              etrismapRecId = mappingRecId;
              _status = "FAIL";
              _statusDetails = "ITEM NOT FOUND for the given ITEM (" + itemExternalId + ") for VBP ";
            }
          } else {
            etrismapRecId = mappingRecId;
            _status = "FAIL";
            _statusDetails = "VENDOR NOT FOUND for the given mapping for VBP ";
          }
        }

        //============> JOURNAL ENTRY PROCESS <=========
        if (JournalProcess) {
          let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_jv_gl')).split(':');
          let debit_account = '';
          let credit_account = '';

          if (_sourceArray[0] == "Scheme_Source") {

            let _scheme = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') ? eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') : jsonData.custbody_sol_etris_scheme;
            log.debug('_scheme', _scheme);

            let vcSchemeSearchObj = search.create({
              type: 'customrecord_sol_etris_schemesource',
              filters: [
                ['name', 'is', _scheme]
              ],
              columns: [
                search.createColumn({
                  name: "custrecord_sol_ss_bankacc",
                  label: "Bank Account"
                }),
                search.createColumn({
                  name: "number",
                  join: "CUSTRECORD_SOL_SS_BANKACC",
                  label: "Number"
                })
              ]
            }).run().getRange(0, 1);

            if (vcSchemeSearchObj.length > 0) {
              itemExternalId = vcSchemeSearchObj[0].getValue({
                name: "number",
                join: "CUSTRECORD_SOL_SS_BANKACC",
                label: "Number"
              });
            }
          } else {
            var debAccountSearchObj = search.create({
              type: "account",
              filters: [
                ["number", "is", _sourceArray[0]]
              ],
              columns: [
                search.createColumn({
                  name: "internalid",
                  label: "Internal ID"
                }),
                search.createColumn({
                  name: "name",
                  sort: search.Sort.ASC,
                  label: "Name"
                })
              ]
            }).run().getRange(0, 1);

            if (debAccountSearchObj.length > 0) {
              debit_account = debAccountSearchObj[0].getValue('internalid');
            }
          }

          if (_sourceArray[1] == "Scheme_Source") {

            let _scheme = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') ? eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') : jsonData.custbody_sol_etris_scheme;
            log.debug('_scheme', _scheme);

            let vcSchemeSearchObj = search.create({
              type: 'customrecord_sol_etris_schemesource',
              filters: [
                ['name', 'is', _scheme]
              ],
              columns: [
                search.createColumn({
                  name: "custrecord_sol_ss_bankacc",
                  label: "Bank Account"
                }),
                search.createColumn({
                  name: "number",
                  join: "CUSTRECORD_SOL_SS_BANKACC",
                  label: "Number"
                })
              ]
            }).run().getRange(0, 1);

            if (vcSchemeSearchObj.length > 0) {
              itemExternalId = vcSchemeSearchObj[0].getValue({
                name: "number",
                join: "CUSTRECORD_SOL_SS_BANKACC",
                label: "Number"
              });
            }
          } else {
            var credAccountSearchObj = search.create({
              type: "account",
              filters: [
                ["number", "is", _sourceArray[1]]
              ],
              columns: [
                search.createColumn({
                  name: "internalid",
                  label: "Internal ID"
                }),
                search.createColumn({
                  name: "name",
                  sort: search.Sort.ASC,
                  label: "Name"
                })
              ]
            }).run().getRange(0, 1);

            if (credAccountSearchObj.length > 0) {
              credit_account = credAccountSearchObj[0].getValue('internalid');
            }
          }
          log.debug("debit_account", debit_account);
          log.debug("credit_account", credit_account);

          if (debit_account != '' && credit_account != '') {
            let jeID = ETRIS_MODULE.createJournalEntry(_trandate, credit_account, debit_account, amount, jsonData, departmentId, 2);
            je_id = jeID;
            etrismapRecId = mappingRecId;
            _status = "SUCCESS";
            _statusDetails = "Journal Entry InternalID: " + jeID;
          } else {
            etrismapRecId = mappingRecId;
            _status = "FAIL";
            _statusDetails = "Missing accounts for the given mapping (Internalid: " + mappingRecId + ") for JE ";
          }
        }

        //============> CREDIT NOTE/MEMO PROCESS <=========
        if (CredNoteProcess) {
          if (customerSearchObj.length > 0) {
            let customerId = customerSearchObj[0].getValue('internalid');
            log.debug('CN: customerId', customerId);

            //Finding AR Account and Item (based on EXTRENALID)
            let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_cn_gl')).split(':');
            var itemExternalId = "";

            if (_sourceArray[0] == "Scheme_Source") {

              let _scheme = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') ? eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') : jsonData.custbody_sol_etris_scheme;
              log.debug('_scheme', _scheme);

              let schemeSearchObj = search.create({
                type: 'customrecord_sol_etris_schemesource',
                filters: [
                  ['name', 'is', _scheme]
                ],
                columns: [
                  search.createColumn({
                    name: "custrecord_sol_ss_bankacc",
                    label: "Bank Account"
                  }),
                  search.createColumn({
                    name: "number",
                    join: "CUSTRECORD_SOL_SS_BANKACC",
                    label: "Number"
                  })
                ]
              }).run().getRange(0, 1);

              if (schemeSearchObj.length > 0) {
                itemExternalId = schemeSearchObj[0].getValue({
                  name: "number",
                  join: "CUSTRECORD_SOL_SS_BANKACC",
                  label: "Number"
                });
              }
            } else {
              itemExternalId = _sourceArray[0];
            }
            log.debug("CN: itemExternalId", itemExternalId);

            //search Item based on externalid
            let invItemSearchObj = search.create({
              type: 'customrecord_sol_etris_item_source',
              filters: [
                ['custrecord_sol_etris_is_item', 'is', itemExternalId]
              ],
              columns: ['custrecord_sol_etris_is_purchase', 'custrecord_sol_etris_is_sale']
            }).run().getRange(0, 1);

            if (invItemSearchObj.length > 0) {
              let _invItemId = invItemSearchObj[0].getValue('custrecord_sol_etris_is_sale');
              log.debug('CN: _invItemId', _invItemId);

              let credNoteID = ETRIS_MODULE.createCreditNote(customerId, _trandate, arAccount, itemExternalId, amount, jsonData, departmentId, 2);
              cn_id = credNoteID;
              etrismapRecId = mappingRecId;
              _status = "SUCCESS";
              _statusDetails = "credNoteID: " + credNoteID;
            } else {
              etrismapRecId = mappingRecId;
              _status = "FAIL";
              _statusDetails = "ITEM NOT FOUND for the given ITEM (" + itemExternalId + ") for CN ";
            }
          } else {
            etrismapRecId = mappingRecId;
            _status = "FAIL";
            _statusDetails = "CUSTOMER NOT FOUND for the given mapping for CN ";
          }
        }

        //============> VENDOR CREDIT PROCESS <=========
        if (vendCredProcess) {
          if (vendorSearchObj.length > 0) {
            let vendorId = vendorSearchObj[0].getValue('internalid');
            let isSST = vendorSearchObj[0].getValue('custentity_sol_etris_sst_applicable');
            log.debug('VC: vendorId', vendorId);

            //Finding AR Account and Item (based on EXTRENALID)
            let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_vc_gl')).split(':');
            var itemExternalId = "";

            if (_sourceArray[1] == "Scheme_Source") {

              let _scheme = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') ? eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') : jsonData.custbody_sol_etris_scheme;
              log.debug('_scheme', _scheme);

              let schemeSearchObj = search.create({
                type: 'customrecord_sol_etris_schemesource',
                filters: [
                  ['name', 'is', _scheme]
                ],
                columns: [
                  search.createColumn({
                    name: "custrecord_sol_ss_bankacc",
                    label: "Bank Account"
                  }),
                  search.createColumn({
                    name: "number",
                    join: "CUSTRECORD_SOL_SS_BANKACC",
                    label: "Number"
                  })
                ]
              }).run().getRange(0, 1);

              if (schemeSearchObj.length > 0) {
                itemExternalId = schemeSearchObj[0].getValue({
                  name: "number",
                  join: "CUSTRECORD_SOL_SS_BANKACC",
                  label: "Number"
                });
              }
            } else {
              itemExternalId = _sourceArray[1];
            }
            log.debug("VC: itemExternalId", itemExternalId);

            //search Item based on externalid
            procItemSearchObj = search.create({
              type: 'customrecord_sol_etris_item_source',
              filters: [
                ['custrecord_sol_etris_is_item', 'is', itemExternalId]
              ],
              columns: ['custrecord_sol_etris_is_purchase', 'custrecord_sol_etris_is_sale']
            }).run().getRange(0, 1);

            if (procItemSearchObj.length > 0) {
              let procItemId = procItemSearchObj[0].getValue('custrecord_sol_etris_is_purchase');
              log.debug('VC: procItemId', procItemId);

              let venCredId = ETRIS_MODULE.createVendorCredit(vendorId, _trandate, apAccount, procItemId, amount, jsonData, departmentId, 2, isSST);
              vc_id = venCredId;
              etrismapRecId = mappingRecId;
              _status = "SUCCESS";
              _statusDetails = "venCredId: " + venCredId;
            } else {
              etrismapRecId = mappingRecId;
              _status = "FAIL";
              _statusDetails = "ITEM NOT FOUND for the given ITEM (" + itemExternalId + ") for VC ";
            }
          } else {
            etrismapRecId = mappingRecId;
            _status = "FAIL";
            _statusDetails = "VENDOR NOT FOUND for the given mapping for VC ";
          }
        }

        //============> DEBIT NOTE PROCESS <=========
        if (DebNoteProcess) {
          if (customerSearchObj.length > 0) {
            let customerId = customerSearchObj[0].getValue('internalid');
            log.debug('DN: customerId', customerId);

            //Finding AR Account and Item (based on EXTRENALID)
            let _sourceArray = (eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_inv_gl')).split(':');
            var itemExternalId = "";

            if (_sourceArray[1] == "Scheme_Source") {

              let _scheme = eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') ? eTrisMapperSearchObj[0].getValue('custrecord_sol_etris_scheme') : jsonData.custbody_sol_etris_scheme;
              log.debug('_scheme', _scheme);

              let schemeSearchObj = search.create({
                type: 'customrecord_sol_etris_schemesource',
                filters: [
                  ['name', 'is', _scheme]
                ],
                columns: [
                  search.createColumn({
                    name: "custrecord_sol_ss_bankacc",
                    label: "Bank Account"
                  }),
                  search.createColumn({
                    name: "number",
                    join: "CUSTRECORD_SOL_SS_BANKACC",
                    label: "Number"
                  })
                ]
              }).run().getRange(0, 1);

              if (schemeSearchObj.length > 0) {
                itemExternalId = schemeSearchObj[0].getValue({
                  name: "number",
                  join: "CUSTRECORD_SOL_SS_BANKACC",
                  label: "Number"
                });
              }
            } else {
              itemExternalId = _sourceArray[1];
            }
            log.debug("DN: itemExternalId", itemExternalId);

            //search Item based on externalid
            let invItemSearchObj = search.create({
              type: 'customrecord_sol_etris_item_source',
              filters: [
                ['custrecord_sol_etris_is_item', 'is', itemExternalId]
              ],
              columns: ['custrecord_sol_etris_is_purchase', 'custrecord_sol_etris_is_sale']
            }).run().getRange(0, 1);

            if (invItemSearchObj.length > 0) {
              let _invItemId = invItemSearchObj[0].getValue('custrecord_sol_etris_is_sale');
              log.debug('DN: _invItemId', _invItemId);

              let dnId = ETRIS_MODULE.createDebitNote(customerId, _trandate, arAccount, _invItemId, amount, jsonData, departmentId, 2);
              dn_id = dnId;
              etrismapRecId = mappingRecId;
              _status = "SUCCESS";
              _statusDetails = "dnId: " + dnId;
            } else {
              etrismapRecId = mappingRecId;
              _status = "FAIL";
              _statusDetails = "ITEM NOT FOUND for the given ITEM (Internalid: " + itemExternalId + ") for DN ";
            }
          } else {
            etrismapRecId = mappingRecId;
            _status = "FAIL";
            _statusDetails = "CUSTOMER NOT FOUND for the given mapping for DN ";
          }
        }

        let _submitValues = {
          'custrecord_sol_etris_mapping_record': etrismapRecId,
          'custrecord_sol_etris_status': _status,
          'custrecord_sol_etris_status_details': _statusDetails
        };

        if (inv_id) {
          _submitValues.custrecord_sol_etris_process_invid = inv_id;
        }

        if (cpay_id) {
          _submitValues.custrecord_sol_etris_process_cpid = cpay_id;
        }

        if (vb_id) {
          _submitValues.custrecord_sol_etris_process_vbid = vb_id;
        }

        if (vbp_id) {
          _submitValues.custrecord_sol_etris_process_bpid = vbp_id;
        }

        if (je_id) {
          _submitValues.custrecord_sol_etris_process_jeid = je_id;
        }

        if (cn_id) {
          _submitValues.custrecord_sol_etris_process_cnid = cn_id;
        }

        if (vc_id) {
          _submitValues.custrecord_sol_etris_process_vcid = vc_id;
        }

        if (dn_id) {
          _submitValues.custrecord_sol_etris_process_dnid = dn_id;
        }

        record.submitFields({
          type: 'customrecord_sol_etris_json',
          id: statusRecId,
          values: _submitValues
        });
      } else {
        record.submitFields({
          type: 'customrecord_sol_etris_json',
          id: statusRecId,
          values: {
            'custrecord_sol_etris_status': 'FAIL',
            'custrecord_sol_etris_status_details': "Mapping details were not found."
          }
        });
      }

      return JSON.stringify({
        "success": {
          "message": "Data has been received by NetSuite"
        }
      });
    } catch (ex) {
      log.error(ex.name, ex);

      record.submitFields({
        type: 'customrecord_sol_etris_json',
        id: statusRecId,
        values: {
          'custrecord_sol_etris_status': 'FAIL',
          'custrecord_sol_etris_status_details': _statusDetails + "(" + ex.name + ")"
        }
      });

      /*return JSON.stringify({
          "error": {
              "code": ex.name,
              "message": "There was some error while processing the data"
          }
       });*/
      return JSON.stringify({
        "success": {
          "message": "Data has been received by NetSuite"
        }
      });
    }
  }

  function _put(context) {

  }

  function _delete(context) {

  }

  /**
   *
   * @param {Number} intType
   * @param {Object} jsonData
   */
  function searchEtrisMapper(intType, processName, isCancel, isrefund, scheme) {
    var _filters = [
      ["custrecord_sol_etris_file_fmt", "anyof", intType],
      "AND",
      ["name", "contains", processName] //Procee Name
    ];

    //If refund or cancel is not null then by filter by Tagging
    if (isCancel) {
      _filters.push("AND", ["custrecord_sol_etris_tagging", "anyof", 1]);
    } else {
      _filters.push("AND", ["custrecord_sol_etris_tagging", "noneof", 1]);
    }

    if (isrefund) {
      _filters.push("AND", ["custrecord_sol_etris_tagging", "anyof", 2]);
    } else {
      _filters.push("AND", ["custrecord_sol_etris_tagging", "noneof", 2]);
    }

    //If scheme is not null then filter by Scheme
    // if(scheme || scheme != ''){
    //     _filters.push("AND",["custrecord_sol_etris_scheme", "is", scheme]);
    // }
    log.debug('_filters', _filters);

    //finding the eTris mapper to create the necessary transactions
    var eTrisMapperSearchObj = search.create({
      type: 'customrecord_sol_etris_map',
      filters: _filters,
      columns: [
        search.createColumn({
          name: "internalid",
          label: "Internal ID"
        }),
        search.createColumn({
          name: "name",
          sort: search.Sort.ASC,
          label: "Name"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_scheme",
          label: "Scheme"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_special_function",
          label: "Special Function"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_inv",
          label: "Invoice"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_inv_gl",
          label: "Invoice GL"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_cp",
          label: "Customer Payment"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_cp_gl",
          label: "Customer Payment GL"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_vb",
          label: "Vendor BIll"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_vb_gl",
          label: "Vendor Bill GL"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_vp",
          label: "Bill Payment"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_vp_gl",
          label: "Bill Payment GL"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_jv",
          label: "Journal"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_jv_gl",
          label: "Journal GL"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_cn",
          label: "Credit Note"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_cn_gl",
          label: "Credit Note GL"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_vc",
          label: "Vendor Credit"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_vc_gl",
          label: "Vendor Credit GL"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_dn",
          label: "Debit Note"
        }),
        search.createColumn({
          name: "custrecord_sol_etris_dn_gl",
          label: "Debit NoteGL"
        })
      ]
    }).run().getRange(0, 1);

    return eTrisMapperSearchObj;
  }

  /**
   *
   * @param {Object} customerSearchObj
   * @param {Object} eTrisMapperSearchObj
   * @param {Date} _trandate
   * @param {Number} arAccount
   * @param {Object} jsonData
   */
  function invoiceProcess(customerSearchObj, eTrisMapperSearchObj, _trandate, arAccount, jsonData) {

  }

  return {
    // get: _get,
    post: _post,
    // put: _put,
    // delete: _delete
  }
});