/***************************************************************************************
 ** Copyright (c) 2020 ABJ Cloud Solutions, Inc.
 ** A1-13-2 Arcoris Business Suite, 10, Jalan Kiara, Mont Kiara, 50480 Kuala Lumpur, Malaysia
 ** All Rights Reserved.
 ** This software is the confidential and proprietary information of ABJ Cloud Solutions. ("Confidential Information").
 ** You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement you entered into with ABJ Cloud Solutions.
 ***************************************************************************************/

/*******************************************************************************
 * **Copyright (c) 2020 ABJ Cloud Solutions, Inc.
 * @Client        :  Hoolah
 * @Script Name   :  abj_mr_stripe_refund.js
 * @script Record :  - ABJ MR | Stripe Refund
 * @Trigger Type  :  Scheduled
 * @Release Date  :
 * @Author        :  Prasad Adari
 * @Description   :  This Script finds the stripe records where type is refund and where CM are empty and INV are empty
 *                   and apply the newly created INV and apply on the CM and update both CM and INV details on the stripe record.
 * @Enhancement   : <Enhancement description related to latest script version>
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 *
 ******************************************************************************/
define(['N/search', 'N/record', 'N/file', 'N/runtime', 'N/format'], function(search, record, file, runtime, format) {

  function getInputData() {
    try {
      return search.create({
        type: "customrecord_stripe_balance_transactions",
        filters: [
          ["custrecord_payout_type", "is", "refund"],
          "AND",
          ["custrecord_stripe_related_invoice", "anyof", "@NONE@"],
          "AND",
          ["custrecord_posting_trx", "anyof", "@NONE@"],
          "AND",
          ["isinactive", "is", "F"],
          "AND",
          ["custrecord_abj_error_message", "isempty", ""]
          //"AND",
          //["internalid", "is", 1004]
        ],
        columns: [
          "internalid",
          "custrecord_payout_id",
          "custrecord_payout_amount",
          "custrecord_payout_created",
          "custrecord_payout_description"
        ]
      });
    } catch (ex) {
      log.error(ex.name, "getInputData: " + ex);
    }
  }

  function map(context) {
    try {
      var mapObj = JSON.parse(context.value);
      //log.debug("MAP - Context Key: "+context.key, mapObj);

      var scriptObj = runtime.getCurrentScript();
      var item_id = scriptObj.getParameter({
        name: 'custscript_abj_stripe_refund_item_id'
      });

      var map_data = {
        stripe_id: mapObj.id,
        stripe_date: mapObj.values.custrecord_payout_created,
        stripe_desc: mapObj.values.custrecord_payout_description,
        stripe_amount: mapObj.values.custrecord_payout_amount,
        item_id: item_id,
        stripe_ref_num: mapObj.values.custrecord_payout_id
      };
      log.debug("Required Details @" + context.key, map_data);
      var stripe_cm_docno = (map_data.stripe_desc).split(' ')[3].substr(1);
      log.debug("CM DOC # from stripe description", stripe_cm_docno);

      //Required details from Credit Memo using Stripe Desription String
      var cm_data = getCMDetails(stripe_cm_docno);

      if (cm_data.data_found == true) {
        log.debug("Required Details From Credit Memo", cm_data);

        try {
          var inv_id = createInvoice(cm_data.customer, map_data);
          log.debug("inv_id", inv_id);
        } catch (ex) {
          log.error(ex.name, ex.message);
          record.submitFields({
            type: "customrecord_stripe_balance_transactions",
            id: map_data.stripe_id,
            values: {
              'custrecord_abj_error_message': "Error Ocuured: " + ex.name + " - " + ex.message
            }
          });
        }

        if (inv_id) {
          //Applying Invoice on the found related Credit Memo from the Stripe Record
          var is_applied = applyCreditMemoOntheInvoice(cm_data.cmid, inv_id);

          if (is_applied == true) {
            var stripe_id = record.submitFields({
              type: "customrecord_stripe_balance_transactions",
              id: map_data.stripe_id,
              values: {
                'custrecord_stripe_related_invoice': cm_data.cmid,
                'custrecord_posting_trx': inv_id
              }
            });
            log.debug("Stripe Record has been updated Successfully", stripe_id);
          } else {
            var stripe_id = record.submitFields({
              type: "customrecord_stripe_balance_transactions",
              id: map_data.stripe_id,
              values: {
                'custrecord_stripe_related_invoice': cm_data.cmid,
                'custrecord_posting_trx': inv_id,
                'custrecord_abj_error_message': "Something Went Wrong while applying Credit Memo on the Created Invoice"
              }
            });
            log.debug("Stripe Record has been updated Successfully", stripe_id);
          }
        }
      } else {
        log.debug("Related CM Not Found with the given Description from Stripe", map_data.stripe_desc + " - " + stripe_cm_docno);
        record.submitFields({
          type: "customrecord_stripe_balance_transactions",
          id: map_data.stripe_id,
          values: {
            'custrecord_abj_error_message': "Related CM Not Found with the given Description from Stripe" + map_data.stripe_desc + " - " + stripe_cm_docno
          }
        });
      }

      log.debug("Remaining Usage", runtime.getCurrentScript().getRemainingUsage());
    } catch (ex) {
      log.error(ex.name + ' map = ' + context.key, ex);
    }
  }

  function reduce(context) {

  }

  function summarize(summary) {
    log.debug('summary', summary);

  }

  /**
   *
   * @param {String} strpeString - Document Number from Stripe Record
   * @returns {Object}
   */
  function getCMDetails(strpeString) {
    var cm_details = {
      "data_found": false,
      "cmid": '',
      "customer": '',
      "cmdocno": ''
    };
    var creditmemoSearchObj = search.create({
      type: "creditmemo",
      filters: [
        ["type", "anyof", "CustCred"],
        "AND",
        ["formulatext: {number}", "contains", strpeString],
        "AND",
        ["mainline", "is", "T"]
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          label: "Internalid"
        }),
        search.createColumn({
          name: "trandate",
          label: "Date"
        }),
        search.createColumn({
          name: "tranid",
          label: "Document Number"
        }),
        search.createColumn({
          name: "entity",
          label: "Name"
        })
      ]
    }).run().getRange(0, 2);

    if (creditmemoSearchObj.length > 0) {
      cm_details.data_found = true;
      cm_details.cmid = creditmemoSearchObj[0].getValue('internalid');
      cm_details.customer = creditmemoSearchObj[0].getValue('entity');
      cm_details.cmdocno = creditmemoSearchObj[0].getValue('tranid');
    }

    return cm_details;
  }

  /**
   *
   * @param {String} customer
   * @param {Object} data
   * @returns {String} Internalid
   */
  function createInvoice(customer, data) {
    var invRecObj = record.create({
      type: record.Type.INVOICE,
      isDynamic: true
    });

    var parseDate = format.parse({
      value: data.stripe_date,
      type: format.Type.DATE
    });

    invRecObj.setValue('tranid', data.stripe_ref_num); //From Stripe custom record - custrecord_payout_id
    invRecObj.setValue('entity', customer); //From related credit memo - entity
    invRecObj.setValue('trandate', parseDate); //From Stripe custom record - custrecord_payout_created

    //Setting lines
    for (var i = 0; i < 1; i++) {
      invRecObj.selectNewLine('item');
      invRecObj.setCurrentSublistValue('item', 'item', data.item_id); //ITEM - from script parameter - generic item for refund
      invRecObj.setCurrentSublistValue('item', 'quantity', 1); //QUANTITY - always 1
      invRecObj.setCurrentSublistValue('item', 'rate', -parseFloat(data.stripe_amount)); //From Stripe custom record - custrecord_payout_amount
      invRecObj.commitLine('item');
    }

    var inv_internalid = invRecObj.save({
      ignoreMandatoryFields: true,
      enableSourcing: true
    });

    return inv_internalid;
  }

  /**
   *
   * @param {String} cmid - Credit Memo internalid
   * @param {String} invid - Invoice internalid
   * @returns {Boolean}
   */
  function applyCreditMemoOntheInvoice(cmid, invid) {
    var is_applied = false;

    var cmRecObj = record.load({
      type: record.Type.CREDIT_MEMO,
      id: cmid
    });

    var apply_count = cmRecObj.getLineCount('apply');
    log.debug('apply_count: ', apply_count);
    for (var i = 0; i < apply_count; i++) {
      var tran_id = cmRecObj.getSublistValue('apply', 'internalid', i);
      var type = cmRecObj.getSublistValue('apply', 'trantype', i);
      if (tran_id == invid && type == "CustInvc") {
        log.debug("Ref #: ", cmRecObj.getSublistValue('apply', 'refnum', i));
        cmRecObj.setSublistValue('apply', 'apply', i, true);
        is_applied = true;
      }
    }

    if (is_applied == true) {
      cmRecObj.save({
        ignoreMandatoryFields: true,
        enableSourcing: true
      });
    }

    return is_applied;
  }

  return {
    getInputData: getInputData,
    map: map,
    //reduce: reduce,
    summarize: summarize
  };
});