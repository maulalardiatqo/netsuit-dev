/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/runtime", "N/format"], function(
  search,
  record,
  runtime,
  format
) {
  function execute(context) {
    // var searchId = "customsearchdnd_run_no_gen";
    try {
      var d = new Date();
      var formattedDateString = format.format({
        value: d,
        type: format.Type.DATETIMETZ
      });
      log.debug("d", d);
      log.debug("formattedDateString", formattedDateString);
      // load data invest 1
      var data_invst_1 = search.load({
        id: "customsearch_sol_invst_1_fd",
      });

      var data_invst_1_set = data_invst_1.run();
      data_invst_1 = data_invst_1_set.getRange(0, 100);
      // end load invest 1

      // load data invest 2
      var data_invst_2 = search.load({
        id: "customsearch_sol_invst_2_ta",
      });

      var data_invst_2_set = data_invst_2.run();
      data_invst_2 = data_invst_2_set.getRange(0, 100);
      // end load invest 2

      // load data invest 3
      var data_invst_3 = search.load({
        id: "customsearch_sol_invst_3_cw",
      });

      var data_invst_3_set = data_invst_3.run();
      data_invst_3 = data_invst_3_set.getRange(0, 100);
      // end load invest 3

      // load data invest 4
      var data_invst_4 = search.load({
        id: "customsearch_sol_invst_4_ut",
      });

      var data_invst_4_set = data_invst_4.run();
      data_invst_4 = data_invst_4_set.getRange(0, 100);
      // end load invest 4

      // load data invest 5
      var data_invst_5 = search.load({
        id: "customsearch_sol_invst_5_fi",
      });

      var data_invst_5_set = data_invst_5.run();
      data_invst_5 = data_invst_5_set.getRange(0, 100);
      // end load invest 5

      // load data invest 6
      var data_invst_6 = search.load({
        id: "customsearch_sol_invst_6_ef",
      });

      var data_invst_6_set = data_invst_6.run();
      data_invst_6 = data_invst_6_set.getRange(0, 100);
      // end load invest 6

      var list_investment = [];

      // list investment 1
      data_invst_1.forEach(function(result) {
        var label_summary = result.getValue({
          name: data_invst_1_set.columns[0],
        });
        var at_cost = result.getValue({
          name: data_invst_1_set.columns[1],
        }) || 0;
        var at_market_value = result.getValue({
          name: data_invst_1_set.columns[2],
        }) || 0;
        var income_earned = result.getValue({
          name: data_invst_1_set.columns[3],
        }) || 0;
        var accrual_income = result.getValue({
          name: data_invst_1_set.columns[4],
        }) || 0;

        list_investment.push({
          labelSummary: label_summary,
          atCost: Number(at_cost),
          atMarketValue: Number(at_market_value),
          incomeEarned: Number(income_earned),
          accrualincome: Number(accrual_income),
        });
      });
      log.debug("Array Data 1", list_investment);
      // end list investment 1

      // list investment 2
      data_invst_2.forEach(function(result) {
        var label_summary = result.getValue({
          name: data_invst_2_set.columns[0],
        });
        var at_cost = result.getValue({
          name: data_invst_2_set.columns[1],
        }) || 0;
        var at_market_value = result.getValue({
          name: data_invst_2_set.columns[2],
        }) || 0;
        var income_earned = result.getValue({
          name: data_invst_2_set.columns[3],
        }) || 0;
        var accrual_income = result.getValue({
          name: data_invst_2_set.columns[4],
        }) || 0;

        list_investment.push({
          labelSummary: label_summary,
          atCost: Number(at_cost),
          atMarketValue: Number(at_market_value),
          incomeEarned: Number(income_earned),
          accrualincome: Number(accrual_income),
        });
      });
      log.debug("Array Data 2", list_investment);
      // end list investment 2

      // list investment 3
      data_invst_3.forEach(function(result) {
        var label_summary = result.getValue({
          name: data_invst_3_set.columns[0],
        });
        var at_cost = result.getValue({
          name: data_invst_3_set.columns[1],
        }) || 0;
        var at_market_value = result.getValue({
          name: data_invst_3_set.columns[2],
        }) || 0;
        var income_earned = result.getValue({
          name: data_invst_3_set.columns[3],
        }) || 0;
        var accrual_income = result.getValue({
          name: data_invst_3_set.columns[4],
        }) || 0;
        list_investment.push({
          labelSummary: label_summary,
          atCost: Number(at_cost),
          atMarketValue: Number(at_market_value),
          incomeEarned: Number(income_earned),
          accrualincome: Number(accrual_income),
        });
      });
      log.debug("Array Data 3", list_investment);
      // end list investment 3

      // list investment 4
      data_invst_4.forEach(function(result) {
        var label_summary = result.getValue({
          name: data_invst_4_set.columns[0],
        });
        var at_cost = result.getValue({
          name: data_invst_4_set.columns[1],
        }) || 0;
        var at_market_value = result.getValue({
          name: data_invst_4_set.columns[2],
        }) || 0;
        var income_earned = result.getValue({
          name: data_invst_4_set.columns[3],
        }) || 0;
        var accrual_income = result.getValue({
          name: data_invst_4_set.columns[4],
        }) || 0;
        list_investment.push({
          labelSummary: label_summary,
          atCost: Number(at_cost),
          atMarketValue: Number(at_market_value),
          incomeEarned: Number(income_earned),
          accrualincome: Number(accrual_income),
        });
      });
      log.debug("Array Data 4", list_investment);
      // end list investment 4

      // list investment 5
      data_invst_5.forEach(function(result) {
        var label_summary = result.getValue({
          name: data_invst_5_set.columns[0],
        });
        var at_cost = result.getValue({
          name: data_invst_5_set.columns[1],
        }) || 0;
        var at_market_value = result.getValue({
          name: data_invst_5_set.columns[2],
        }) || 0;
        var income_earned = result.getValue({
          name: data_invst_5_set.columns[3],
        }) || 0;
        var accrual_income = result.getValue({
          name: data_invst_5_set.columns[4],
        }) || 0;
        list_investment.push({
          labelSummary: label_summary,
          atCost: Number(at_cost),
          atMarketValue: Number(at_market_value),
          incomeEarned: Number(income_earned),
          accrualincome: Number(accrual_income),
        });
      });
      log.debug("Array Data 5", list_investment);
      // end list investment 5

      // list investment 6
      data_invst_6.forEach(function(result) {
        var label_summary = result.getValue({
          name: data_invst_6_set.columns[0],
        });
        var at_cost = result.getValue({
          name: data_invst_6_set.columns[1],
        }) || 0;
        var at_market_value = result.getValue({
          name: data_invst_6_set.columns[2],
        }) || 0;
        var income_earned = result.getValue({
          name: data_invst_6_set.columns[3],
        }) || 0;
        var accrual_income = result.getValue({
          name: data_invst_6_set.columns[4],
        }) || 0;
        list_investment.push({
          labelSummary: label_summary,
          atCost: Number(at_cost),
          atMarketValue: Number(at_market_value),
          incomeEarned: Number(income_earned),
          accrualincome: Number(accrual_income),
        });
      });
      log.debug("Array Data 6", list_investment);
      // end list investment 6

      log.debug("Array Data", list_investment);

      if (list_investment.length <= 0) {
        log.debug("No Data to execute", "No Data to execute");
      } else {
        var at_cost_total = 0;
        var income_earned_total = 0;
        list_investment.forEach((data, index) => {
          at_cost_total += data.atCost;
          income_earned_total += data.incomeEarned;
        });

        var at_market_value_total = 0;
        var accrual_income_total = 0;
        var percenTotal = 0;
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var CurrentNoOfdayInYear = Math.floor(diff / oneDay);
        log.debug("CurrentNoOfdayInYear", CurrentNoOfdayInYear);

        var roi_total = ((at_cost_total + income_earned_total) / at_cost_total) **
          ((365 / CurrentNoOfdayInYear) - 1) * 100;
        log.debug("roi_total", roi_total);
        var totalRoi = [];

        list_investment.forEach((data, index) => {
          at_market_value_total += data.atMarketValue;
          accrual_income_total += data.accrualincome;
          log.debug("data.atCost", data.atCost);
          log.debug("income_earned_total", income_earned_total);
          var roi = ((data.atCost + income_earned_total) / data.atCost);
          log.debug("roi1", roi);
          var roi = (roi ** ((365 / CurrentNoOfdayInYear) - 1)) * 100;
          log.debug("roi2", roi);
          totalRoi.push(roi);

          var totalperc_of_investment = (data.atCost / at_cost_total) * 100;
          percenTotal = percenTotal + totalperc_of_investment;
          log.debug("totalperc_of_investment", totalperc_of_investment);

          var roiData = record.create({
            type: 'customrecord_sol_roi_data',
            isDynamic: true
          });

          roiData.setValue({
            fieldId: 'custrecord_sol_roi_dat',
            value: d,
            ignoreFieldChange: true
          });

          roiData.setValue({
            fieldId: 'custrecord_sol_roi_sum',
            value: data.labelSummary,
            ignoreFieldChange: true
          });

          roiData.setValue({
            fieldId: 'custrecord_sol_roi_atcost',
            value: data.atCost,
            ignoreFieldChange: true
          });

          roiData.setValue({
            fieldId: 'custrecord_sol_roi_atmkt',
            value: data.atMarketValue,
            ignoreFieldChange: true
          });

          roiData.setValue({
            fieldId: 'custrecord_sol_roi_incamt',
            value: data.incomeEarned,
            ignoreFieldChange: true
          });

          roiData.setValue({
            fieldId: 'custrecord_sol_roi_acc_inc',
            value: data.accrualincome,
            ignoreFieldChange: true
          });

          roiData.setValue({
            fieldId: 'custrecord_sol_roi',
            value: roi,
            ignoreFieldChange: true
          });

          roiData.setValue({
            fieldId: 'custrecord_sol_roi_toi',
            value: totalperc_of_investment,
            ignoreFieldChange: true
          });

          var roiDataNo = roiData.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
          });
        });

        log.debug("Roy Total", totalRoi);
        var roiTotal = 0;
        var percentTotal = 0;
        for (var i = 0; i < totalRoi.length; i++) {
          roiTotal += parseFloat(totalRoi[i]);
          percentTotal += parseFloat(totalRoi[i]);
        }

        var avgRoi = roiTotal / totalRoi.length;
        log.debug("avgRoi", avgRoi);
        log.debug("roiTotal", roiTotal);
        var roiDataTotal = record.create({
          type: 'customrecord_sol_roi_data',
          isDynamic: true
        });
        roiDataTotal.setValue({
          fieldId: 'custrecord_sol_roi_dat',
          value: d,
          ignoreFieldChange: true
        });
        roiDataTotal.setValue({
          fieldId: 'custrecord_sol_roi_sum',
          value: 'TOTAL',
          ignoreFieldChange: true
        });
        roiDataTotal.setValue({
          fieldId: 'custrecord_sol_roi_atcost',
          value: at_cost_total,
          ignoreFieldChange: true
        });
        roiDataTotal.setValue({
          fieldId: 'custrecord_sol_roi_atmkt',
          value: at_market_value_total,
          ignoreFieldChange: true
        });
        roiDataTotal.setValue({
          fieldId: 'custrecord_sol_roi_incamt',
          value: income_earned_total,
          ignoreFieldChange: true
        });
        roiDataTotal.setValue({
          fieldId: 'custrecord_sol_roi_acc_inc',
          value: accrual_income_total,
          ignoreFieldChange: true
        });
        roiDataTotal.setValue({
          fieldId: 'custrecord_sol_roi',
          value: avgRoi,
          ignoreFieldChange: true
        });
        roiDataTotal.setValue({
          fieldId: 'custrecord_sol_roi_toi',
          value: percenTotal,
          ignoreFieldChange: true
        });
        var roiDataNoTotal = roiDataTotal.save({
          enableSourcing: true,
          ignoreMandatoryFields: true
        });


        log.debug("SUCESS", roiDataNoTotal);
      }
    } catch (e) {
      log.debug("Error ", e.name + " : " + e.message);
    }
  }
  return {
    execute: execute,
  };
});