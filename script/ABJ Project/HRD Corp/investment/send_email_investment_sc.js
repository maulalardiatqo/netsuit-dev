/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define([
  "N/ui/serverWidget",
  "N/search",
  "N/record",
  "N/ui/message",
  "N/url",
  "N/redirect",
  "N/xml",
  "N/file",
  "N/encode",
  "N/email",
  "N/runtime",
], function(
  serverWidget,
  search,
  record,
  message,
  url,
  redirect,
  xml,
  file,
  encode,
  email,
  runtime
) {
  function execute(context) {

    try {
      // load data invest 1
      log.debug("in", "in");

      var data_invst_1 = search.load({
        id: "customsearch_sol_invst_1_fd",
      });
      data_invst_1.filters.push(
        search.createFilter({
          name: "isinactive",
          operator: search.Operator.IS,
          values: 'F',
        })
      );

      var data_invst_1_set = data_invst_1.run();
      data_invst_1 = data_invst_1_set.getRange(0, 100);
      // end load invest 1

      // load data invest 2
      var data_invst_2 = search.load({
        id: "customsearch_sol_invst_2_ta",
      });
      data_invst_2.filters.push(
        search.createFilter({
          name: "isinactive",
          operator: search.Operator.IS,
          values: 'F',
        })
      );

      var data_invst_2_set = data_invst_2.run();
      data_invst_2 = data_invst_2_set.getRange(0, 100);
      // end load invest 2

      // load data invest 3
      var data_invst_3 = search.load({
        id: "customsearch_sol_invst_3_cw",
      });
      data_invst_3.filters.push(
        search.createFilter({
          name: "isinactive",
          operator: search.Operator.IS,
          values: 'F',
        })
      );

      var data_invst_3_set = data_invst_3.run();
      data_invst_3 = data_invst_3_set.getRange(0, 100);
      // end load invest 3

      // load data invest 4
      var data_invst_4 = search.load({
        id: "customsearch_sol_invst_4_ut",
      });
      data_invst_4.filters.push(
        search.createFilter({
          name: "isinactive",
          operator: search.Operator.IS,
          values: 'F',
        })
      );

      var data_invst_4_set = data_invst_4.run();
      data_invst_4 = data_invst_4_set.getRange(0, 100);
      // end load invest 4

      // load data invest 5
      var data_invst_5 = search.load({
        id: "customsearch_sol_invst_5_fi",
      });
      data_invst_5.filters.push(
        search.createFilter({
          name: "isinactive",
          operator: search.Operator.IS,
          values: 'F',
        })
      );

      var data_invst_5_set = data_invst_5.run();
      data_invst_5 = data_invst_5_set.getRange(0, 100);
      // end load invest 5

      // load data invest 6
      var data_invst_6 = search.load({
        id: "customsearch_sol_invst_6_ef",
      });
      data_invst_6.filters.push(
        search.createFilter({
          name: "isinactive",
          operator: search.Operator.IS,
          values: 'F',
        })
      );

      var data_invst_6_set = data_invst_6.run();
      data_invst_6 = data_invst_6_set.getRange(0, 100);
      // end load invest 6

      var list_investment = [];

      // list investment 1
      data_invst_1.forEach(function(result) {
        var label_summary = result.getValue({
          name: data_invst_1_set.columns[0],
        });
        var at_cost =
          result.getValue({
            name: data_invst_1_set.columns[1],
          }) || 0;
        var at_market_value =
          result.getValue({
            name: data_invst_1_set.columns[2],
          }) || 0;
        var income_earned =
          result.getValue({
            name: data_invst_1_set.columns[3],
          }) || 0;
        var accrual_income =
          result.getValue({
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
        var at_cost =
          result.getValue({
            name: data_invst_2_set.columns[1],
          }) || 0;
        var at_market_value =
          result.getValue({
            name: data_invst_2_set.columns[2],
          }) || 0;
        var income_earned =
          result.getValue({
            name: data_invst_2_set.columns[3],
          }) || 0;
        var accrual_income =
          result.getValue({
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
        var at_cost =
          result.getValue({
            name: data_invst_3_set.columns[1],
          }) || 0;
        var at_market_value =
          result.getValue({
            name: data_invst_3_set.columns[2],
          }) || 0;
        var income_earned =
          result.getValue({
            name: data_invst_3_set.columns[3],
          }) || 0;
        var accrual_income =
          result.getValue({
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
        var at_cost =
          result.getValue({
            name: data_invst_4_set.columns[1],
          }) || 0;
        var at_market_value =
          result.getValue({
            name: data_invst_4_set.columns[2],
          }) || 0;
        var income_earned =
          result.getValue({
            name: data_invst_4_set.columns[3],
          }) || 0;
        var accrual_income =
          result.getValue({
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
        var at_cost =
          result.getValue({
            name: data_invst_5_set.columns[1],
          }) || 0;
        var at_market_value =
          result.getValue({
            name: data_invst_5_set.columns[2],
          }) || 0;
        var income_earned =
          result.getValue({
            name: data_invst_5_set.columns[3],
          }) || 0;
        var accrual_income =
          result.getValue({
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
        var at_cost =
          result.getValue({
            name: data_invst_6_set.columns[1],
          }) || 0;
        var at_market_value =
          result.getValue({
            name: data_invst_6_set.columns[2],
          }) || 0;
        var income_earned =
          result.getValue({
            name: data_invst_6_set.columns[3],
          }) || 0;
        var accrual_income =
          result.getValue({
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
        var html = `<html>
          <h3>No Data for this selection!.</h3>
          <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
          <body></body></html>`;

        var form_result = serverWidget.createForm({
          title: "Result of Investment Report",
        });
        form_result.addPageInitMessage({
          type: message.Type.ERROR,
          title: "No Data!",
          message: html,
        });
        context.response.writePage(form_result);
      } else {
        // XML content of the file
        var xmlStr =
          '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
        xmlStr +=
          '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
        xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
        xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
        xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
        xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

        // Styles
        xmlStr += "<Styles>";
        xmlStr += "<Style ss:ID='BC'>";
        xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
        xmlStr += "<Borders>";
        xmlStr +=
          "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr += "</Borders>";
        xmlStr +=
          "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
        xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
        xmlStr += "</Style>";
        xmlStr += "<Style ss:ID='BNC'>";
        xmlStr += "<Alignment />";
        xmlStr += "<Borders>";
        xmlStr +=
          "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr += "</Borders>";
        xmlStr +=
          "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
        xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
        xmlStr += "</Style>";
        xmlStr += "<Style ss:ID='BNCN'>";
        xmlStr += "<NumberFormat ss:Format='Standard' />";
        xmlStr += "<Alignment />";
        xmlStr += "<Borders>";
        xmlStr +=
          "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr += "</Borders>";
        xmlStr +=
          "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
        xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
        xmlStr += "</Style>";
        xmlStr += "<Style ss:ID='NB'>";
        xmlStr += "<Alignment />";
        xmlStr += "<Borders>";
        xmlStr +=
          "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr += "</Borders>";
        xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
        xmlStr += "</Style>";
        xmlStr += "<Style ss:ID='NBN'>";
        xmlStr += "<NumberFormat ss:Format='Standard' />";
        xmlStr += "<Alignment />";
        xmlStr += "<Borders>";
        xmlStr +=
          "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr +=
          "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
        xmlStr += "</Borders>";
        xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
        xmlStr += "</Style>";
        xmlStr += "</Styles>";
        //   End Styles

        // Sheet Name
        xmlStr += '<Worksheet ss:Name="Sheet1">';
        // End Sheet Name

        // Kolom Excel Header
        xmlStr +=
          "<Table>" +
          "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='200' />" +
          "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='120' />" +
          "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='120' />" +
          "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='120' />" +
          "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='120' />" +
          "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='120' />" +
          "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='200' />" +
          "<Row ss:Index='1' ss:Height='20'>" +
          '<Cell ss:StyleID="BC"><Data ss:Type="String">SUMMARY</Data></Cell>' +
          '<Cell ss:StyleID="BC"><Data ss:Type="String">At Cost</Data></Cell>' +
          '<Cell ss:StyleID="BC"><Data ss:Type="String">At Market Value</Data></Cell>' +
          '<Cell ss:StyleID="BC"><Data ss:Type="String">INCOME AMOUNT</Data></Cell>' +
          '<Cell ss:StyleID="BC"><Data ss:Type="String">ACCRUAL INCOME</Data></Cell>' +
          '<Cell ss:StyleID="BC"><Data ss:Type="String">ROI</Data></Cell>' +
          '<Cell ss:StyleID="BC"><Data ss:Type="String">TOTAL PERCENTAGE OF INVESTMENT</Data></Cell>' +
          "</Row>";
        // End Kolom Excel Header

        // Body Data
        var at_cost_total = 0;
        var income_earned_total = 0;
        list_investment.forEach((data, index) => {
          at_cost_total += data.atCost;
          income_earned_total += data.incomeEarned;
        });

        var at_market_value_total = 0;
        var accrual_income_total = 0;
        var totalPercen = 0;
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var CurrentNoOfdayInYear = Math.floor(diff / oneDay);
        log.debug("CurrentNoOfdayInYear", CurrentNoOfdayInYear);

        var roi_total =
          ((at_cost_total + income_earned_total) / at_cost_total) **
          (365 / CurrentNoOfdayInYear - 1) *
          100;
        log.debug("roi_total", roi_total);
        var totalRoi = [];

        list_investment.forEach((data, index) => {
          at_market_value_total += data.atMarketValue;
          accrual_income_total += data.accrualincome;
          log.debug("data.atCost", data.atCost);
          log.debug("income_earned_total", income_earned_total);
          var roi = (data.atCost + income_earned_total) / data.atCost;
          log.debug("roi1", roi);
          var roi = roi ** (365 / CurrentNoOfdayInYear - 1) * 100;
          log.debug("roi2", roi);
          totalRoi.push(roi);

          var totalperc_of_investment = (data.atCost / at_cost_total) * 100;
          totalPercen = totalPercen + totalperc_of_investment;
          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="NB"><Data ss:Type="String">' +
            data.labelSummary +
            "</Data></Cell>" +
            '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' +
            data.atCost +
            "</Data></Cell>" +
            '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' +
            data.atMarketValue +
            "</Data></Cell>" +
            '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' +
            data.incomeEarned +
            "</Data></Cell>" +
            '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' +
            data.accrualincome +
            "</Data></Cell>" +
            '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' +
            roi +
            "</Data></Cell>" +
            '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalperc_of_investment + '</Data></Cell>' +
            "</Row>";
        });
        // End Body Data

        log.debug("Roy Total", totalRoi);
        var roiTotal = 0;
        for (var i = 0; i < totalRoi.length; i++) {
          roiTotal += parseFloat(totalRoi[i]);
        }

        var avgRoi = roiTotal / totalRoi.length;
        log.debug("avgRoi", avgRoi);
        log.debug("roiTotal", roiTotal);

        // Footer
        xmlStr +=
          "<Row>" +
          '<Cell ss:StyleID="BNC"><Data ss:Type="String">TOTAL</Data></Cell>' +
          '<Cell ss:StyleID="BNCN"><Data ss:Type="Number">' +
          at_cost_total +
          "</Data></Cell>" +
          '<Cell ss:StyleID="BNCN"><Data ss:Type="Number">' +
          at_market_value_total +
          "</Data></Cell>" +
          '<Cell ss:StyleID="BNCN"><Data ss:Type="Number">' +
          income_earned_total +
          "</Data></Cell>" +
          '<Cell ss:StyleID="BNCN"><Data ss:Type="Number">' +
          accrual_income_total +
          "</Data></Cell>" +
          '<Cell ss:StyleID="BNCN"><Data ss:Type="Number">' +
          avgRoi +
          "</Data></Cell>" +
          '<Cell ss:StyleID="BNCN"><Data ss:Type="Number">' + totalPercen + '</Data></Cell>' +
          "</Row>";
        // End Footer
        log.debug("at_cost_total", at_cost_total);

        xmlStr += "</Table></Worksheet></Workbook>";

        var strXmlEncoded = encode.convert({
          string: xmlStr,
          inputEncoding: encode.Encoding.UTF_8,
          outputEncoding: encode.Encoding.BASE_64,
        });

        var objXlsFile = file.create({
          name: "Investment Amount.xls",
          fileType: file.Type.EXCEL,
          contents: strXmlEncoded,
        });

        log.debug("objXlsFile", objXlsFile);

        var user = runtime.getCurrentUser()
        log.debug("user", user);
        var scriptObj = runtime.getCurrentScript();
        log.debug("scriptObj", scriptObj);

        log.debug('Script parameter of custscript1: ',
          scriptObj.getParameter({
            name: 'custscript_email1'
          }));
        log.debug('Script parameter of custscript3: ',
          scriptObj.getParameter({
            name: 'custscript_email2'
          }));
        log.debug('Script parameter of custscript4: ',
          scriptObj.getParameter({
            name: 'custscript_id_employe'
          }));
        var userID = scriptObj.getParameter({
          name: 'custscript_id_employe'
        });
        var email1 = scriptObj.getParameter({
          name: 'custscript_email_1'
        });
        var email2 = scriptObj.getParameter({
          name: 'custscript_email_2'
        });
        email.send({
          author: userID,
          recipients: [email1, email2],
          subject: "Investment Report " + now,
          cc: null,
          body: "Investment Report" + now,
          attachments: [objXlsFile],
          // relatedRecords: {
          //     transactionId: recID
          // }
        });

        // context.response.writeFile({
        //   file: objXlsFile,
        // });
      }
    } catch (error) {
      log.debug("error in get report", error.name + ": " + error.message);
    }

  }
  return {
    execute: execute,
  };
});