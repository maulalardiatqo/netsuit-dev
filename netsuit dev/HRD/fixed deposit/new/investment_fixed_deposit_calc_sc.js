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
    var SrcStartRange = runtime.getCurrentScript().getParameter("custscript_start_range_data");
    var SrcEndRange = runtime.getCurrentScript().getParameter("custscript_end_data_range");

    function formatDate(inputDate) {
      return inputDate ? format.parse({
        value: inputDate,
        type: format.Type.DATE
      }) : false;
    }

    function toDateFormat(date) {
      let dateSplit = date.split("/");
      return `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}`;
    }

    function getFormattedDate(dateString) {
      var date = new Date(dateString);
      date.setHours(0, 0, 0); // Set hours, minutes and seconds
      return date;
    }

    function getUTCMidnight(dateObjP) {
      let dateObj = new Date(dateObjP);
      let date = `${dateObj.getUTCDate()}`.padStart(2, "0");
      let month = `${dateObj.getUTCMonth() + 1}`.padStart(2, "0");
      let year = dateObj.getUTCFullYear();
      return new Date(`${year}-${month}-${date}T00:00:00Z`);
    }

    function getCurrentUTCMidnight() {
      return getUTCMidnight(new Date());
    }

    function format_date_for_save_search(vDate) {
      var vDate = new Date(vDate);
      var hari = `${vDate.getUTCDate()}`.padStart(2, "0");
      var bulan = `${vDate.getUTCMonth() + 1}`.padStart(2, "0");
      var tahun = vDate.getUTCFullYear();
      var vDate = hari + "/" + bulan + "/" + tahun;
      return vDate;
    }

    function days(date_1, date_2) {
      function format_date_for_gettime(vDate) {
        let dateObj = new Date(vDate);
        let date = `${dateObj.getUTCDate()}`.padStart(2, "0");
        let month = `${dateObj.getUTCMonth() + 1}`.padStart(2, "0");
        let year = dateObj.getUTCFullYear();
        return new Date(`${year}-${month}-${date}T00:00:00Z`);
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
  
    var data_invst_1_all_set = data_invst_1_all.run();
    data_invst_1_all = data_invst_1_all_set.getRange(0, 1000);
    // end load save search all data

    // load save search
    var data_invst_1 = search.load({
      id: "customsearch_sol_invst_fd_to_calculate",
    });

    var data_invst_1_set = data_invst_1.run();
    data_invst_1 = data_invst_1_set.getRange(SrcStartRange, SrcEndRange);
    // end load save search

    // loop for get total
    var grand_total_invest_amount = 0;
    var total_invest_amount_arr = [];
    data_invst_1_all.forEach(function(result) {
      var investment_amount_current_fy =
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
      grand_total_invest_amount += parseFloat(investment_amount_current_fy);
      total_invest_amount_arr.push({
        amount: parseFloat(investment_amount_current_fy),
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

    var todayDateYear = getCurrentUTCMidnight();
    log.debug("todayDateYear", todayDateYear);
    var FirstDateInYear = new Date(todayDateYear.getFullYear(), 0, 1);
    var YesterdayFirstDateInYear = new Date(FirstDateInYear.setDate(FirstDateInYear.getDate() - 1));

    // var todayDateYear = new Date(todayDateYear.setDate(todayDateYear.getDate() + 1));
    var FirstDateInYear = new Date(FirstDateInYear.setDate(FirstDateInYear.getDate() + 1));
    var todayFormatCheck = format_date_for_save_search(todayDateYear);
    var firstDateFormatCheck = format_date_for_save_search(FirstDateInYear);

    // log.debug("date", {
    //   todayDateYear: todayDateYear,
    //   FirstDateInYear: FirstDateInYear,
    //   YesterdayFirstDateInYear: YesterdayFirstDateInYear,
    // });

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

        var fdStartDate = format_date_for_save_search(
          investrecord.getValue("custrecord_sol_invtr_fd_start_date")
        );
        var fdStartDate = toDateFormat(fdStartDate);
        var fdMaturityDate = format_date_for_save_search(
          investrecord.getValue(
            "custrecord_sol_invtr_fd_maturity_date"
          )
        );
        var fdMaturityDate = toDateFormat(fdMaturityDate);
        // log.debug("Start Date & Maturity", {
        //   start_date: fdStartDate,
        //   maturity: fdMaturityDate
        // });
        var fdStartDateFormatted = getUTCMidnight(fdStartDate);
        var fdMaturityDateFormatted = getUTCMidnight(fdMaturityDate);

        // get total amount monthly
        var invest_amount_monthly = 0;
        var fdMaturityDate_row = new Date(fdMaturityDateFormatted);
        var fdMaturityDate_month = fdMaturityDate_row.getMonth() + 1;
        var fdMaturityDate_year = fdMaturityDate_row.getFullYear();
        for (var idx_c in amount_group) {
          var invest_amount = amount_group[idx_c];
          var invest_amount_month_to_check = invest_amount.month;
          var invest_amount_year_to_check = invest_amount.year;
          if (
            invest_amount_month_to_check == fdMaturityDate_month ||
            invest_amount_year_to_check == fdMaturityDate_year
          ) {
            invest_amount_monthly = invest_amount.amount;
          }
        }
        // end get total amount monthly

        var accuredCurrent = days(todayDateYear, fdStartDateFormatted);
        var accuredCurrent = parseFloat(accuredCurrent);

        var fdStartDate_row = new Date(fdStartDateFormatted);
        var fdStartDate_year = fdStartDate_row.getFullYear();
        var todayYear = todayDateYear.getFullYear();

        if (fdStartDate_year < todayYear) {
          var fromDate = YesterdayFirstDateInYear;
        } else {
          var fromDate = fdStartDateFormatted;
        }
        // log.debug("Total Days Up", {
        //   todayDateYear: todayDateYear,
        //   fromDate: fromDate,
        //   YesterdayFirstDateInYear: YesterdayFirstDateInYear,
        //   fdStartDateFormatted: fdStartDateFormatted
        // });
        
        
       var dayCurrent = toDateFormat(todayFormatCheck)
        var dayCek = new Date(dayCurrent);
        var maturiTyCek = new Date(fdMaturityDate);
        log.debug('cekdate', {
          dayCek : dayCek, maturiTyCek : maturiTyCek
        })

        var totalDays = days(todayDateYear, fromDate);
        var getOriInvestAmountThisYear = investrecord.getValue("custrecord_sol_invtr_fd_invst_amt_thisyr") || 0;
        var getOriInitialInvstAmountThisYear = investrecord.getValue("custrecord_sol_invtr_fd_intal_invst_amt_") || 0;
        if (maturiTyCek == dayCek) {
          var getInvestAmountThisYear = getOriInitialInvstAmountThisYear;
        } else {
          var getInvestAmountThisYear = investrecord.getValue("custrecord_sol_invtr_fd_invst_amt_thisyr") || 0;
        }
        var getInterestProfitRate = investrecord.getValue("custrecord_sol_invst_fd_int_profit_rate") || 0;
        var getInvestmentAmountPreviousYear = investrecord.getValue("custrecord_sol_invtr_fd_intal_invst_amt_") || 0;
        var weightedAverageRate = (parseFloat(getInvestAmountThisYear) / grand_total_invest_amount) * parseFloat(getInterestProfitRate);
        var getaccuredInterestCurrent = investrecord.getValue('custrecord_sol_invtr_fd_acrued_inst_fy');



        // if (todayFormatCheck == firstDateFormatCheck) {
        //   var accuredInterestCurrent = 0;
        // } else {
        //   var accuredInterestCurrent = parseFloat(getInvestAmountThisYear) * (parseFloat(getInterestProfitRate) / 100) * (parseFloat(totalDays) / 365);
        // }
        var getAccuredInterest = investrecord.getValue("custrecord_sol_invtr_fd_accured_interest") || 0;
        var name = investrecord.getValue("name");
        // get end date of last year
        var today = new Date(); 
        var lastYear = today.getFullYear() - 1; 
        var lastDayOfYear = new Date(lastYear, 11, 31); 
        lastDayOfYear.setMonth(11);
        if (lastDayOfYear.getDate() !== 31) {
          lastDayOfYear.setDate(0);
        }
        var date = new Date(lastDayOfYear);
        var year = date.getFullYear();
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        var formatlastDayOfYear = year + "-" + month + "-" + day;
        log.debug('formatlastDayOfYear', formatlastDayOfYear);
        var aiPrefiousFY = investrecord.getValue('custrecord_sol_invtr_fd_invst_amt_lastyr') || 0;
        var formatlastDayOfYear =  new Date(formatlastDayOfYear);
        var startDateFd = new Date(fdStartDate);
        var diffInMilliseconds = formatlastDayOfYear.getTime() - startDateFd.getTime();
        var diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
       

        var currDay = new Date();
        log.debug('curday', currDay);
        var year = currDay.getUTCFullYear();
        var month = ("0" + (currDay.getUTCMonth() + 1)).slice(-2);
        var day = ("0" + currDay.getUTCDate()).slice(-2);
        var formattedDate = year + "-" + month + "-" + day;
        log.debug('formattedDate', formattedDate);
        var formatCurDate = new Date(formattedDate);
        var diffInMillisecond = formatCurDate.getTime() - startDateFd.getTime();
        var diffCurrStart = diffInMillisecond / (1000 * 60 * 60 * 24);
        // don't calculate after maturity
        if (maturiTyCek < dayCek) {
          log.debug('not calculate', name);
          var accuredInterestCurrent = getaccuredInterestCurrent;
          var accuredInterest = getAccuredInterest;
        }else{
          log.debug('do calculate', name);
          var accuredInterestCurrent = (diffInDays / 365) * (parseFloat(aiPrefiousFY)) * (parseFloat(getInterestProfitRate));
          var accuredInterest = (diffCurrStart / 365) * (parseFloat(getInterestProfitRate)) * (parseFloat(aiPrefiousFY));
        }
        log.debug('maturitidate', {name: name, fdMaturityDate: fdMaturityDate, accuredInterestCurrent:  accuredInterestCurrent, accuredCurrent: accuredCurrent});

        // old calculate for accured interest
        // var accuredInterest = (parseFloat(getInvestAmountThisYear) * (parseFloat(getInterestProfitRate) / 100) * accuredCurrent) / 365;


        var uponMaturity = days(new Date(fdMaturityDateFormatted), todayDateYear);
        var balanceInterestOnMaturity = (parseFloat(getInvestAmountThisYear) * (parseFloat(getInterestProfitRate) / 100) * uponMaturity) / 365;

        var interestProfitEarnedCurrent = investrecord.getValue("custrecord_sol_invtr_fd_intst_prfit_fy") || 0;
        var accuredInterestProfitLastFy = investrecord.getValue("custrecord_sol_invtr_fd_proft_last_yr") || 0;
        var totalInterestOnMaturity = parseFloat(interestProfitEarnedCurrent) - parseFloat(accuredInterestCurrent);


        if (todayFormatCheck == firstDateFormatCheck) {
          log.debug("today is end date", true);
          var calcAccuredInterestProfitLastFy = accuredInterestCurrent;
        } else {
          var calcAccuredInterestProfitLastFy = accuredInterestProfitLastFy;
        }

        var calcAccured = parseFloat(accuredInterest) - parseFloat(calcAccuredInterestProfitLastFy);
        var calcTotalDays = days(new Date(fdMaturityDateFormatted), new Date(fdStartDateFormatted));
        var interest_profit_daily = ((parseFloat(getInterestProfitRate) / 365) * parseFloat(calcTotalDays)) / 100;

        // log.debug("Tes", {
        //   maturity_date: fdMaturityDate,
        //   todayFormatCheck: todayFormatCheck,
        //   firstDateFormatCheck: firstDateFormatCheck
        // });
        // log.debug("INTEREST/ PROFIT EARNED CURRENT FY CALC", {
        //   maturity_date: fdMaturityDate,
        //   current_date: toDateFormat(todayFormatCheck)
        // });
        // log.debug('fdMaturityDate', fdMaturityDate);
        // log.debug('todayFormatCheck', toDateFormat(todayFormatCheck));

        // Dont calculate if today past the maturity date
        if (maturiTyCek <= dayCek) {
          var calcInterestProfitEarnedCurrent = (parseFloat(calcTotalDays) / 365) * (parseFloat(getInterestProfitRate) / 100) * parseFloat(getInvestmentAmountPreviousYear);
        } else {
          var calcInterestProfitEarnedCurrent = interestProfitEarnedCurrent;
        }

        var calcInterest = parseFloat(calcInterestProfitEarnedCurrent) - parseFloat(calcAccuredInterestProfitLastFy);
        // var netInterestProfitCurrent = calcInterest < calcAccured ? calcAccured : calcInterest;
        // change calculation from Jothee INTEREST/ PROFIT EARNED CURRENT FY - ACCRUED INTEREST/ PROFITAS AT LAST FY = NET INTEREST/ PROFIT CURRENT FY
        var netInterestProfitCurrent = calcInterest;

        // log.debug("Date Debug", {
        //   start_date: fdStartDateFormatted,
        //   maturity_date: fdMaturityDateFormatted,
        //   today_date: todayDateYear,
        //   total_days_up: totalDays,
        //   upon_maturity: uponMaturity,
        //   accured_current: accuredCurrent,
        //   total_days: calcTotalDays,

        // });
        if (maturiTyCek == dayCek) {
          log.debug('in here')
          investrecord.setValue({
            fieldId: "custrecord_sol_invtr_fd_invst_amt_lastyr",
            value: getOriInvestAmountThisYear,
            ignoreFieldChange: true,
          });
          investrecord.setValue({
            fieldId: "custrecord_sol_invtr_fd_invst_amt_thisyr",
            value: getOriInitialInvstAmountThisYear,
            ignoreFieldChange: true,
          });
        }
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_weghted_avg_rate",
          value: weightedAverageRate,
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_proft_last_yr",
          value: calcAccuredInterestProfitLastFy.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_acrued_inst_fy",
          value: accuredInterestCurrent.toFixed(2),
          ignoreFieldChange: true,
        });
        if (fdMaturityDate <= toDateFormat(todayFormatCheck)) {
          investrecord.setValue({
            fieldId: "custrecord_sol_invtr_fd_intst_prfit_fy",
            value: calcInterestProfitEarnedCurrent.toFixed(2),
            ignoreFieldChange: true,
          });
        }
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_accured_interest",
          value: accuredInterest.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_intst_maturty_dt",
          value: balanceInterestOnMaturity.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_proft_maturty_dt",
          value: totalInterestOnMaturity.toFixed(2),
          ignoreFieldChange: true,
        });

        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_net_int_thisfy",
          value: netInterestProfitCurrent.toFixed(2),
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_total_days_up",
          value: totalDays,
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_upon_maturity",
          value: uponMaturity,
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_accured_thisfy",
          value: accuredCurrent,
          ignoreFieldChange: true,
        });
        investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_total_days",
          value: calcTotalDays,
          ignoreFieldChange: true,
        });
        var process_date = new Date();
        log.debug("Process Date", {
          process_date: process_date,
          todayDate: todayDateYear
        });
        var prDate = investrecord.setValue({
          fieldId: "custrecord_sol_invtr_fd_process_date",
          value: process_date,
          ignoreFieldChange: true,
        });
        log.debug("pr date", prDate);

        var investrecord_id = investrecord.save({
          enableSourcing: false,
          ignoreMandatoryFields: true,
        });
        log.debug("save record invest", investrecord_id);
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