/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */

define(["N/record", "N/https", "N/search", 'N/format', 'N/runtime', 'SuiteScripts/moment'], function(record, https, search, format, runtime, moment) {



  function getLastObj() {
    var payout_search = search.create({
      type: "customrecord_stripe_balance_transactions",
      filters: [],
      columns: ["custrecord_payout_id"]
    });

    var res = payout_search.run().getRange({
      start: 0,
      end: 1
    });

    if (res.length > 0)
      return res[0].getValue({
        name: "custrecord_payout_id"
      })
  }


  function getObj(recid) {
    var payout_search = search.create({
      type: "customrecord_stripe_balance_transactions",
      filters: [
        ["custrecord_payout_id", "is", recid]
      ],
      columns: ["custrecord_payout_id"]
    });

    var res = payout_search.run().getRange({
      start: 0,
      end: 1
    });

    if (res.length > 0) {
      return res[0].id
    } else {
      return null;
    }

  }


  function getInputData() {
    var scriptObj = runtime.getCurrentScript();
    var getApiKey = scriptObj.getParameter("custscript_api_key");
    log.debug("getApiKey", getApiKey);

    const API_KEY = getApiKey;
    var data = [];
    var payouts_url = "https://api.stripe.com/v1/balance_transactions?limit=100";
    //var starting_after = getLastObj();
    var starting_after;
    log.debug("starting_after", starting_after)

    if (starting_after)
      payouts_url += "&starting_after=" + starting_after

    var headers = {
      "Authorization": API_KEY,
      "content-type": "application/json"
    }

    var res = https.get({
      url: payouts_url,
      headers: headers
    });


    log.debug("raw res", res);

    var response = JSON.parse(res.body);

    log.debug("parsed res", response);

    data = data.concat(response.data);

    while (response.has_more) {

      var starting_after = data[data.length - 1].id;

      log.debug("last key", starting_after);

      payouts_url = payouts_url + "&starting_after=" + starting_after;

      log.debug("payouts_url", payouts_url);

      var scriptObj = runtime.getCurrentScript();
      log.debug({
        title: "Remaining usage units: ",
        details: scriptObj.getRemainingUsage()
      });
      var getUsage = scriptObj.getRemainingUsage();
      if (getUsage < 50) {
        log.debug("Inside the break", getUsage);
        break;
      }

      res = https.get({
        url: payouts_url,
        headers: headers
      });
      log.debug("100 Res", res);

      if (res.code == '200') {

        response = JSON.parse(res.body);

        data = data.concat(response.data)
      }

    }

    log.debug("data count", data.length);
    return data;
    //return data.slice(0, 10);
  }

  function map(context) {

    try {

      var scriptObj = runtime.getCurrentScript();

      var getApiCurrency = scriptObj.getParameter("custscript_currency");
      // log.debug("getApiCurrency", getApiCurrency);

      var getSubsidiary = scriptObj.getParameter("custscript_subsidiary");

      var row = JSON.parse(context.value);
      // log.debug('row', row);
      //log.debug("row id", row.id);

      var id_exist = getObj(row.id);

      //log.debug("id_exists", id_exist);

      var payload_rec;
      if (id_exist) {


        payload_rec = record.load({
          type: 'customrecord_stripe_balance_transactions',
          id: id_exist,
          isDynamic: true
        });
      } else {
        payload_rec = record.create({
          type: 'customrecord_stripe_balance_transactions',
          isDynamic: true,
        });

      }
      payload_rec.setValue({
        fieldId: "custrecord_balance_payload",
        value: context.value
      });

      payload_rec.setValue({
        fieldId: "custrecord_payout_id",
        value: row.id
      });

      var getAmount = (parseFloat(row.amount)) / 100;
      //   log.debug('getAmount', getAmount);

      // log.debug('context.value', context.value);
      payload_rec.setValue({
        fieldId: "custrecord_payout_amount",
        value: getAmount
      });
      //  log.debug('row.available_on', row.available_on);

      var dateString = moment(row.available_on, 'X').toDate();
      // log.debug('dateString', dateString);


      payload_rec.setValue({
        fieldId: "custrecord_payout_available_on",
        value: dateString
      });


      var dateStringCreatedOn = moment(row.created, 'X').toDate();

      payload_rec.setValue({
        fieldId: "custrecord_payout_created",
        value: dateStringCreatedOn
      });

      payload_rec.setValue({
        fieldId: "custrecord_payout_currency",
        value: getApiCurrency
      });


      payload_rec.setValue({
        fieldId: "custrecord_payout_subsidiary",
        value: getSubsidiary
      });


      payload_rec.setValue({
        fieldId: "custrecord_payout_description",
        value: row.description
      });

      payload_rec.setValue({
        fieldId: "custrecord_payout_exchange_rate",
        value: row.exchange_rate
      });


      payload_rec.setValue({
        fieldId: "custrecord_payout_fee",
        value: row.fee
      });

      payload_rec.setValue({
        fieldId: "custrecord_payout_net",
        value: (parseFloat(row.net)) / 100
      });

      payload_rec.setValue({
        fieldId: "custrecord_payout_reporting_category",
        value: row.reporting_category
      });

      payload_rec.setValue({
        fieldId: "custrecord_payout_source",
        value: row.source
      });

      payload_rec.setValue({
        fieldId: "custrecord_payout_status",
        value: row.status
      });

      payload_rec.setValue({
        fieldId: "custrecord_payout_type",
        value: row.type
      });
      // log.debug('fee details Nor', row.fee_details);
      // log.debug('fee details', JSON.stringify(row.fee_details));

      for (var i = 0; i < row.fee_details.length; i++) {
        // log.debug('row.fee_details[i]', row.fee_details[i]);

        // log.debug('amount', row.fee_details[i].amount);
        var child = row.fee_details[i];


        payload_rec.selectNewLine({
          sublistId: 'recmachcustrecord_stripe_bal_child_link'
        });

        var getChildAmount = (parseFloat(child.amount)) / 100;


        payload_rec.setCurrentSublistValue({
          sublistId: "recmachcustrecord_stripe_bal_child_link",
          fieldId: "custrecord_fee_details_amount",
          value: getChildAmount
        });

        payload_rec.setCurrentSublistValue({
          sublistId: "recmachcustrecord_stripe_bal_child_link",
          fieldId: "custrecord__fee_details_type",
          value: JSON.stringify(child.type)
        });

        payload_rec.setCurrentSublistValue({
          sublistId: "recmachcustrecord_stripe_bal_child_link",
          fieldId: "custrecord_fee_details_currency",
          value: getApiCurrency
        });

        payload_rec.setCurrentSublistValue({
          sublistId: "recmachcustrecord_stripe_bal_child_link",
          fieldId: "custrecord_fee_details_description",
          value: JSON.stringify(child.description)
        });

        payload_rec.setCurrentSublistValue({
          sublistId: "recmachcustrecord_stripe_bal_child_link",
          fieldId: "custrecord_fee_details_application",
          value: JSON.stringify(child.application)
        });

        payload_rec.commitLine({
          sublistId: "recmachcustrecord_stripe_bal_child_link"
        })
      }

      var save_id = payload_rec.save();


      log.audit("saved", save_id);
    } catch (e) {
      log.error('Map Error:', JSON.stringify(e));
    }


  }



  return {
    getInputData: getInputData,
    map: map
    //  reduce: reduce,
    //  summarize: summarize
  }
});