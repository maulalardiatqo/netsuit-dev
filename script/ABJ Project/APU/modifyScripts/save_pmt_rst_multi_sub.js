/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(["N/record", "N/search", "N/runtime"], function(record, search, runtime) {

  function _post(context) {
    try {

      log.debug("request", context);

      var script = runtime.getCurrentScript();

      var acc_mappings = getMappings(script);

      var journal = createJE(context, acc_mappings);

      log.debug("journal created", journal)

      var payments = createPayments(context, acc_mappings, journal);

      return {
        success: true,
        journal: journal,
        payments: payments
      };

    } catch (e) {
      log.error("Err", e);
      return {
        success: false,
        error: e
      }
    }
  }


  function createPayments(req, mappings, journal) {
    var response = []
    for (var i = 0; i < req.apply.length; i++) {

      try {
        var row = req.apply[i];

        var cus_pmt = record.transform({
          fromType: "invoice",
          fromId: row.invoice,
          toType: "customerpayment",
          isDynamic: true
        })

        cus_pmt.setValue({
          fieldId: "payment",
          value: row.amount
        })

        cus_pmt.setValue({
          fieldId: "custbody_abj_std_payment_method",
          value: row.payment_method
        })

        cus_pmt.setValue({
          fieldId: "checknum",
          value: row.reference
        })

        cus_pmt.setValue({
          fieldId: "cseg_abj_cc",
          value: row.costcenter
        })

        var journal_rec = record.load({
          type: 'journalentry',
          id: journal
        })

        cus_pmt.setValue({
          fieldId: "checknum",
          value: journal_rec.getValue({
            fieldId: "tranid"
          })
        })

        cus_pmt.setValue({
          fieldId: "undepfunds",
          value: "F"
        })

        cus_pmt.setValue({
          fieldId: "account",
          value: mappings[row.subsidiary]
        })

        var count = cus_pmt.getLineCount("apply");

        for (var j = 0; j < count; j++) {



          cus_pmt.selectLine({
            sublistId: "apply",
            line: j
          })

          var apply_flag = cus_pmt.getCurrentSublistValue({
            fieldId: "apply",
            sublistId: "apply",
            line: j
          })


          var internalid = cus_pmt.getCurrentSublistValue({
            fieldId: "internalid",
            sublistId: "apply",
            line: j
          })

          log.debug("invoice_id:cusp", internalid)
          log.debug("invoice:req", row.invoice)

          if (apply_flag)
            cus_pmt.setCurrentSublistValue({
              sublistId: "apply",
              fieldId: "amount",
              value: row.amount
            })

        }

        var id = cus_pmt.save({
          ignoreMandatoryFields: true
        });

        response.push({
          success: true,
          source: row,
          payment: id
        })


      } catch (e) {
        log.error("error", e);

        response.push({
          source: req.apply[i],
          error: e
        })
      }

    }

    return response;

  }


  function createJE(req, mappings) {

    var data_grp = groupBy(req.apply, "subsidiary");

    log.debug("data_grp", data_grp);

    var lines = [];


    var acc = record.load({
      type: "account",
      id: req.debit_account
    });


    var debit_subs = acc.getValue("subsidiary");


    for (var sub in data_grp) {

      var row = {
        credit_sub: sub,
        amount: data_grp[sub].sum("amount"),
        list: data_grp[sub],
        credit_account: mappings[sub],
      };

      lines.push(row);

    }

    log.debug("je lines", lines);

    var JE_rec = record.create({
      type: "journalentry"
    });

    log.debug("subs", debit_subs);



    JE_rec.setValue({
      fieldId: "subsidiary",
      value: debit_subs[0]
    })

    JE_rec.setValue({
      fieldId: "trandate",
      value: new Date()
    })

    // JE_rec.setValue({
    //     fieldId:"memo",
    //     value:"TEST"
    // })

    JE_rec.setValue({
      fieldId: "custbody_abj_je_type",
      value: 1
    })

    var line = 0


    JE_rec.setSublistValue({
      sublistId: "line",
      fieldId: "account",
      value: req.debit_account,
      line: line
    })

    JE_rec.setSublistValue({
      sublistId: "line",
      fieldId: "debit",
      value: req.pay_total,
      line: line
    })

    for (var i = 1; i <= lines.length; i++) {
      // JE_rec.setSublistValue({
      //     sublistId:"line",
      //     fieldId:"linesubsidiary",
      //     value:lines[i-1].credit_sub,
      //     line:i
      // })

      JE_rec.setSublistValue({
        sublistId: "line",
        fieldId: "account",
        value: lines[i - 1].credit_account,
        line: i
      })

      JE_rec.setSublistValue({
        sublistId: "line",
        fieldId: "credit",
        value: lines[i - 1].amount,
        line: i
      })


    }


    return JE_rec.save({
      ignoreMandatoryFields: true
    });
  }



  function getMappings(script) {

    var subsidiary_1 = script.getParameter("custscript_rst_subsidiary_1");
    var account_1 = script.getParameter("custscript_rst_control_account_1");
    var subsidiary_2 = script.getParameter("custscript_rst_subsidiary_2");
    var account_2 = script.getParameter("custscript_rst_control_account_2");
    var subsidiary_3 = script.getParameter("custscript_rst_subsidiary_3");
    var account_3 = script.getParameter("custscript_rst_control_account_3");

    var map = {};

    map[subsidiary_1] = account_1
    map[subsidiary_2] = account_2
    map[subsidiary_3] = account_3


    log.debug("map", map);

    return map;
  }



  return {
    post: _post
  }
});


Array.prototype.sum = function(k) {
  var ar;
  if (k)
    ar = this.map(function(x) {
      return x[k];
    });
  else ar = this;

  return ar.reduce(function(a, b) {
    return toNum(a) + toNum(b);
  });
};


function toNum(s) {

  var res = parseFloat(s);
  if (isNaN(res))
    return 0
  else
    return res;

}


function groupBy(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};