/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/runtime", "N/format"], function(
  search,
  record,
  runtime,
  format,
) {
  function execute(context) {
    // var searchId = "customsearchdnd_run_no_gen";
    var ReportAsofDate = runtime.getCurrentScript().getParameter("custscript_rpt_as_of_date");
    var SrcStartRange = runtime.getCurrentScript().getParameter("custscript_start_range_data");
    var SrcEndRange = runtime.getCurrentScript().getParameter("custscript_end_data_range");

    function formatDate(inputDate) {
      //var datearray = inputDate.toString().split("/");
      //var newdate =
      //	datearray[1] + "/" + datearray[0] + "/" + datearray[2];
      return inputDate ? format.parse({
        value: inputDate,
        type: format.Type.DATE
      }) : false; //newdate;
      //return newdate;
    }

    ReportAsofDate = formatDate(ReportAsofDate);
    //log.debug("ReportAsofDate1", ReportAsofDate);
    function format_date_for_save_search(vDate) {
      var vDate = new Date(vDate);
      var hari = vDate.getDate();
      var bulan = vDate.getMonth() + 1;
      var tahun = vDate.getFullYear();
      var vDate = hari + "/" + bulan + "/" + tahun;
      return vDate;
    }

    function days(date_1, date_2) {
      function format_date_for_gettime(vDate) {
        var vDate = new Date(vDate);
        var hari = vDate.getDate();
        var bulan = vDate.getMonth() + 1;
        var tahun = vDate.getFullYear();
        var vDate = bulan + "/" + hari + "/" + tahun;
        return new Date(vDate);
      }
      date_1 = format_date_for_gettime(date_1);
      //log.debug("date_1", date_1);
      date_2 = format_date_for_gettime(date_2);
      //log.debug("date_2", date_2);
      let difference = date_1.getTime() - date_2.getTime();
      let TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
      return TotalDays;
    }

    // load save search all data
    var data_invst_1_all = search.load({
      id: "customsearch_sol_invst_fd_to_calculate",
    });
    data_invst_1_all.filters.push(
      search.createFilter({
        name: "isinactive",
        operator: search.Operator.IS,
        values: 'F',
      })
    );

    var data_invst_1_all_set = data_invst_1_all.run();
    data_invst_1_all = data_invst_1_all_set.getRange(0, 1000);
    // end load save search all data

    // load save search
    var data_invst_1 = search.load({
      id: "customsearch_sol_invst_fd_to_calculate",
    });
    data_invst_1.filters.push(
      search.createFilter({
        name: "isinactive",
        operator: search.Operator.IS,
        values: 'F',
      })
    );

    //data_invst_1.filters.push(search.createFilter(
    //	{name: 'internalid',operator: search.Operator.IS,values: 412},
    //));

    var data_invst_1_set = data_invst_1.run();
    data_invst_1 = data_invst_1_set.getRange(SrcStartRange, SrcEndRange);
    // end load save search

    // loop for get total
    var grand_total_invest_amount = 0;
    var total_invest_amount_arr = [];
    data_invst_1_all.forEach(function(result) {
      var fsearch_14 =
        result.getValue({
          name: data_invst_1_all_set.columns[8],
        }) || 0;
      var maturity_date = formatDate(
        result.getValue({
          name: data_invst_1_all_set.columns[12],
        }) || ""
      );
      var maturity_date_row = new Date(maturity_date);
      var maturity_date_month = maturity_date_row.getMonth() + 1;
      var maturity_date_year = maturity_date_row.getFullYear();
      grand_total_invest_amount += parseFloat(fsearch_14);
      total_invest_amount_arr.push({
        amount: parseFloat(fsearch_14),
        date: maturity_date,
        month: maturity_date_month,
        year: maturity_date_year,
      });
    });
    // end loop for get total

    // group by month and year and sum amount
    var amount_group = Object.values(
      total_invest_amount_arr.reduce(function(r, e) {
        var key = e.month + "|" + e.year;
        if (!r[key]) r[key] = e;
        else {
          r[key].amount += e.amount;
        }
        return r;
      }, {})
    );
    // end group by month and year and sum amount

    log.debug("Total Invst Amount", amount_group);
    log.debug("Grand Total Invst Amount", grand_total_invest_amount);
    log.debug("ReportAsofDate", ReportAsofDate);

    var accured = ReportAsofDate; //new Date("12/31/2021");
    var upon_maturity = ReportAsofDate; //new Date("12/31/2021");
    var last_year = new Date(ReportAsofDate).setFullYear(new Date(ReportAsofDate).getFullYear() - 1);
    //var last_year = new Date("12/31/2020");
    var z7 = ReportAsofDate; //new Date("12/31/2021");
    var FirstDateInYear = new Date(ReportAsofDate.getFullYear(), 0, 1);

    var z6 = FirstDateInYear; //new Date("1/1/2021");
    log.debug("z7", z7);
    log.debug("z6", z6);
    var z14 = days(z7, z6);
    var calc_z14 = parseInt(z14) + 1;
    var total_execute = 0;
    data_invst_1.forEach(function(result) {
      try {
        var internal_id = result.getValue({
          name: data_invst_1_set.columns[0],
        });
        // log.debug("internal_id", internal_id);
        var investrecord = record.load({
          type: "customrecord_sol_invst_fixed_deposits",
          id: internal_id,
          isDynamic: true,
        });

        var j_14 = format_date_for_save_search(
          investrecord.getValue("custrecord_sol_invtr_fd_start_date")
        );
        var k_14 = format_date_for_save_search(
          investrecord.getValue(
            "custrecord_sol_invtr_fd_maturity_date"
          )
        );
        var j_14_formated = formatDate(j_14);
        var k_14_formated = formatDate(k_14);

        // get total amount monthly
        var invest_amount_monthly = 0;
        var k14_row = new Date(k_14_formated);
        var k14_month = k14_row.getMonth() + 1;
        var k14_year = k14_row.getFullYear();
        for (var idx_c in amount_group) {
          var invest_amount = amount_group[idx_c];
          var invest_amount_month_to_check = invest_amount.month;
          var invest_amount_year_to_check = invest_amount.year;
          if (
            invest_amount_month_to_check == k14_month ||
            invest_amount_year_to_check == k14_year
          ) {
            invest_amount_monthly = invest_amount.amount;
          }
        }
        // end get total amount monthly

        var calc_x14 = days(accured, new Date(j_14_formated));
        var calc_v14 = calc_x14 < calc_z14 ? calc_x14 : calc_z14;
        var f_14 =
          investrecord.getValue(
            "custrecord_sol_invtr_fd_invst_amt_thisyr"
          ) || 0;
        var h_14 =
          investrecord.getValue(
            "custrecord_sol_invst_fd_int_profit_rate"
          ) || 0;
        var n_14 =
          investrecord.getValue(
            "custrecord_sol_invtr_fd_intal_invst_amt_"
          ) || 0;
        var calc_g14 =
          (parseFloat(f_14) / parseFloat(invest_amount_monthly)) *
          parseFloat(h_14);
        var calc_i14 =
          (parseFloat(f_14) / grand_total_invest_amount) *
          parseFloat(h_14);
        var calc_p14 =
          (parseFloat(f_14) * (parseFloat(h_14) / 100) * calc_v14) /
          365;
        var calc_q14 =
          (parseFloat(f_14) * (parseFloat(h_14) / 100) * calc_x14) /
          365;
        var calc_w14 = days(new Date(k_14_formated), upon_maturity);
        var calc_r14 =
          (parseFloat(f_14) * (parseFloat(h_14) / 100) * calc_w14) /
          365;
        var calc_s14 = parseFloat(calc_q14) + parseFloat(calc_r14);
        var l_14 =
          investrecord.getValue(
            "custrecord_sol_invtr_fd_intst_prfit_fy"
          ) || 0;
        var t_14 =
          investrecord.getValue(
            "custrecord_sol_invtr_fd_proft_last_yr"
          ) || 0;
        var days_t4_j14 = days(last_year, new Date(j_14_formated));
        if (days_t4_j14 < 0) days_t4_j14 = 0;
        // log.debug("days_t4_j14", days_t4_j14);
        // log.debug("n_14", n_14);
        // log.debug("h_14", h_14);

        var calc_t14 =
          (parseFloat(h_14) / 365) *
          (parseFloat(days_t4_j14) / 100) *
          parseFloat(n_14);
        // log.debug("calc_t14", calc_t14);

        // var lt_14 = parseFloat(l_14) - parseFloat(calc_t14);
        var qt_14 = parseFloat(calc_q14) - parseFloat(calc_t14);
        // var calc_u14 = lt_14 < qt_14 ? qt_14 : lt_14;
        // var calc_u14 = lt_14;
        var calc_y14 = days(
          new Date(k_14_formated),
          new Date(j_14_formated)
        );
        var interest_profit_daily =
          ((parseFloat(h_14) / 365) * calc_y14) / 100;
        var calc_l14 = parseFloat(n_14) * interest_profit_daily;
        var lt_14 = parseFloat(calc_l14) - parseFloat(calc_t14);
        var calc_u14 = lt_14;
        // investrecord.setValue({
        // 	fieldId: "custrecord_sol_invtr_fd_weghted_avg_rate",
        // 	value: calc_g14.toFixed(2),
        // 	ignoreFieldChange: true,
        // });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_weghted_avg_rate",
          value: calc_i14.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_intst_prfit_fy",
          value: calc_l14.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_acrued_inst_fy",
          value: calc_p14.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_accured_interest",
          value: calc_q14.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_intst_maturty_dt",
          value: calc_r14.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_proft_maturty_dt",
          value: calc_s14.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_proft_last_yr",
          value: calc_t14.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_net_int_thisfy",
          value: calc_u14.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_total_days_up",
          value: calc_v14,
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_upon_maturity",
          value: calc_w14,
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_accured_thisfy",
          value: calc_x14,
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_total_days",
          value: calc_y14,
          ignoreFieldChange: true,
        });
        var process_date = new Date();
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_process_date",
          value: process_date,
          ignoreFieldChange: true,
        });

        var investrecord_id = investrecord.save({
          enableSourcing: false,
          ignoreMandatoryFields: true,
        });
        // log.debug("save record invest", investrecord_id);
        total_execute++;
        return true;
      } catch (e) {
        log.debug(e.name, e);
      }
    });
    // total execute
    log.debug("Total Execute :", total_execute);

    // cek usage
    var scriptObj = runtime.getCurrentScript();
    log.debug({
      title: "Remaining usage units: ",
      details: scriptObj.getRemainingUsage(),
    });
  }
  return {
    execute: execute,
  };
});