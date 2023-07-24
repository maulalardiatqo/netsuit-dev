/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
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
], function (
  serverWidget,
  search,
  record,
  message,
  url,
  redirect,
  xml,
  file,
  encode
) {
  function onRequest(context) {
    var contextRequest = context.request;
    if (contextRequest.method === "GET") {
      var form = serverWidget.createForm({
        title: "Project Tracking Report",
      });

      var optionfield = form.addFieldGroup({
        id: "optionfieldid",
        label: "REPORT PROJECT",
      });

      var filteroption = form.addFieldGroup({
        id: "filteroption",
        label: "FILTER PERIOD",
      });

      form.addSubmitButton({
        label: "Generate Report",
      });

      var custpage_project_id = form
        .addField({
          id: "custpage_project_id",
          label: "Project ID",
          type: serverWidget.FieldType.SELECT,
          source: "customrecord453",
          container: "optionfieldid",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      var custpage_accounting_period_from = form
        .addField({
          id: "custpage_accounting_period_from",
          label: "Accounting Period From",
          type: serverWidget.FieldType.SELECT,
          source: "accountingperiod",
          container: "filteroption",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      var custpage_accounting_period_to = form
        .addField({
          id: "custpage_accounting_period_to",
          label: "Accounting Period To",
          type: serverWidget.FieldType.SELECT,
          source: "accountingperiod",
          container: "filteroption",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY,
        });

      custpage_project_id.isMandatory = true;
      custpage_accounting_period_from.isMandatory = true;
      custpage_accounting_period_to.isMandatory = true;

      context.response.writePage(form);
    } else {
      try {
        function format_date_for_save_search(vDate) {
          var vDate = new Date(vDate);
          var hari = vDate.getDate();
          var bulan = vDate.getMonth() + 1;
          var tahun = vDate.getFullYear();
          var vDate = hari + "/" + bulan + "/" + tahun;
          return vDate;
        }
        var projectId = contextRequest.parameters.custpage_project_id;
        var periodFrom = contextRequest.parameters.custpage_accounting_period_from;
        var periodTo = contextRequest.parameters.custpage_accounting_period_to;
        log.debug("Data Input", {
          periodFrom: periodFrom,
          periodTo: periodTo,
          projectId: projectId
        });
        // load search project
          var datatranss = search.load({
            id: "customsearch795",
          });
          datatranss.filters.push(
            search.createFilter({
              name: "custcol_sol_prj",
              operator: search.Operator.IS,
              values: projectId,
            })
          );

          var range_period = [];
          for (var i = periodFrom; i <= periodTo; i++) {
            range_period.push(i);
          }

          datatranss.filters.push(
            search.createFilter({
              name: "internalid",
			  join: 'accountingperiod',
              operator: search.Operator.ANYOF,
			  values: range_period,
            })
          );

          var datatransset = datatranss.run();
          datatranss = datatransset.getRange(0, 999);
        // end load search project
          log.debug("datatranss", datatranss);
        // end load search budget

        // load search budget
          var data_budget = search.load({
            id: "customsearch_budgetsubmission",
          });


          data_budget.filters.push(
            search.createFilter({
              name: "custrecord_sol_budsub_pp",
              operator: search.Operator.ANYOF,
              values: range_period,
            })
          );

          var data_budget_set = data_budget.run();
          data_budget = data_budget_set.getRange(0, 999);
        // end load search budget

        // load search PO

          var recPeriodFrom = record.load({
            type: record.Type.ACCOUNTING_PERIOD, 
            id: periodFrom,
          });

          var recPeriodTo = record.load({
            type: record.Type.ACCOUNTING_PERIOD, 
            id: periodTo,
          });

          var periodNameFrom = recPeriodFrom.getValue({
            fieldId:'periodname'
          });
          var startDateFrom = recPeriodFrom.getValue({
            fieldId:'startdate'
          });
          var endDateFrom = recPeriodFrom.getValue({
            fieldId: 'enddate'
          });

          var periodNameTo = recPeriodTo.getValue({
            fieldId:'periodname'
          });
          var startDateTo = recPeriodTo.getValue({
            fieldId:'startdate'
          });
          var endDateTo = recPeriodTo.getValue({
            fieldId: 'enddate'
          });
          var starDateModFrom = format_date_for_save_search(startDateFrom);
          // var endDateModFrom = format_date_for_save_search(endDateFrom);
          // var starDateModTo = format_date_for_save_search(startDateTo);
          var endDateModTo = format_date_for_save_search(endDateTo);

          var data_po = search.load({
            id: "customsearch801",
          });

          data_po.filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.ONORAFTER,
              values: starDateModFrom,
            })
          );

          data_po.filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.ONORBEFORE,
              values: endDateModTo,
            })
          );

          var data_po_set = data_po.run();
          data_po = data_po_set.getRange(0, 999);

          log.debug("DATA PO", data_po);
        // end load search budget

        // data list budget
          var list_budget = [];
          data_budget.forEach(function (resultBudget) {
            var gl_account = resultBudget.getValue({
              name: data_budget_set.columns[0],
            });
            var departement = resultBudget.getValue({
              name: data_budget_set.columns[1],
            });
            var budget_amount = resultBudget.getValue({
              name: data_budget_set.columns[2],
            });

            list_budget.push({
              glAccount: gl_account,
              departement: departement,
              budgetAmount: budget_amount,
            });
          });
        // end data list budget

        // data PO
          var list_po = [];
          data_po.forEach(function (resultPo) {
            var gl_account_po = resultPo.getValue({
              name: data_po_set.columns[5],
            });
            var departement_po = resultPo.getValue({
              name: data_po_set.columns[4],
            });
            var po_amount = resultPo.getValue({
              name: data_po_set.columns[3],
            });

            list_po.push({
              glAccount: gl_account_po,
              departement: departement_po,
              poAmount: po_amount,
            });
          });
        // end data PO

        log.debug("data Trans", datatranss);
        var list_project = [];
        var total_receipt_payment = 0;
        var total_approved_budget = 0;
        var total_amount_po = 0;
        var project_name = "";
        if (datatranss.length <= 0) {
          var html = `<html>
          <h3>No Data for this selection ${periodNameFrom} - ${periodNameTo}! please select another period.</h3>
          <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
          <body></body></html>`;

          var form_result = serverWidget.createForm({
            title: "Result of Tracking Project",
          });
          form_result.addPageInitMessage({
            type: message.Type.ERROR,
            title: "No Data!",
            message: html,
          });
          context.response.writePage(form_result);
        }
        else{
          datatranss.forEach(function (result) {
            var description = result.getValue({ name: datatransset.columns[0] });
            var description_id = result.getValue({
              name: datatransset.columns[6],
            });
            var cost_center = result.getValue({ name: datatransset.columns[1] });
            var gl_code = result.getValue({ name: datatransset.columns[2] });
            var cost_center_text = result.getText({
              name: datatransset.columns[1],
            });
            var account_type = result.getValue({ name: datatransset.columns[3] });
            var receipt_payment = result.getValue({
              name: datatransset.columns[4],
            });
            project_name = result.getText({
              name: datatransset.columns[5],
            });
            total_receipt_payment += parseFloat(receipt_payment);

            // get approved buget
            var approved_budget = 0;
            for (var idx_b in list_budget) {
              var list_budget_data = list_budget[idx_b];
              var gl_account_to_check = list_budget_data.glAccount;
              var departement_to_check = list_budget_data.departement;
              if ( gl_account_to_check == description_id && departement_to_check == cost_center ) {
                approved_budget = list_budget_data.budgetAmount;
              }
            }
            total_approved_budget += parseFloat(approved_budget);
            // end get approved budget

            // get po amount
            var amount_po = 0;
            for (var idx_c in list_po) {
              var list_po_data = list_po[idx_c];
              var gl_account_to_check = list_po_data.glAccount;
              var departement_to_check = list_po_data.departement;
              if ( gl_account_to_check == description_id && departement_to_check == cost_center ) {
                amount_po = list_po_data.poAmount;
              }
            }
            total_amount_po += parseFloat(amount_po);
            // end po amount
            list_project.push({
              description: description,
              costCenter: cost_center_text,
              glCode: gl_code,
              accountType: account_type,
              receiptPayment: receipt_payment,
              totalReceiptPayment: total_receipt_payment,
              approvedBudget: approved_budget,
              totalApprovedBudget: total_approved_budget,
              amountPo: amount_po,
              totalAmountPo: total_amount_po,
            });
          });
          log.debug("Array : ", list_project);

          //var filter_income = {
          //  accountType: "Income",
          //};

          var list_project_income = list_project.filter(function (item) {
            // for (var key1 in filter_income) {
              // if (item[key1] === undefined || item[key1] != filter_income[key1])
                // return false;
            // }
 			return item.accountType =="Income" ||
				   item.accountType =="OthIncome";
            //return true;
          });

          // log.debug("Log Debug Project : ", list_project);
          log.debug("Log Debug Project Income : ", list_project_income);
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
          xmlStr += "<Style ss:ID='S57'>";
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
          xmlStr += "<Interior ss:Color='#002060' ss:Pattern='Solid' />";
          xmlStr += "</Style>";
          xmlStr += "<Style ss:ID='S57NC'>";
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
          xmlStr += "<Interior ss:Color='#002060' ss:Pattern='Solid' />";
	      xmlStr += '<NumberFormat ss:Format="Standard"/>';
          xmlStr += "</Style>";
          xmlStr += "<Style ss:ID='S58'>";
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
          xmlStr += "<Font ss:Bold='1' ss:FontName='Calibri' ss:Size='12' />";
          xmlStr += "</Style>";
          xmlStr += "<Style ss:ID='S58NC'>";
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
          xmlStr += "<Font ss:Bold='1' ss:FontName='Calibri' ss:Size='12' />";
	      xmlStr += '<NumberFormat ss:Format="Standard"/>';
          xmlStr += "</Style>";
          xmlStr += "<Style ss:ID='S59'>";
          xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
          xmlStr += "<Borders>";
          xmlStr +=
            "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
          xmlStr += "</Borders>";
          xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
          xmlStr += "</Style>";
          xmlStr += "<Style ss:ID='S59NC'>";
          xmlStr += "<Alignment />";
          xmlStr += "<Borders>";
          xmlStr +=
            "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
          xmlStr += "</Borders>";
          xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
	      xmlStr += '<NumberFormat ss:Format="Standard"/>';
          xmlStr += "</Style>";
          xmlStr += "</Styles>";
          //   End Styles

          xmlStr += '<Worksheet ss:Name="Sheet1">';

          // Kolom excel
          xmlStr +=
            "<Table>" +
            "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='320' />" +
            "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='129' />" +
            "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='112' />" +
            "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='157' />" +
            "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='177' />" +
            "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='180' />" +
            "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='230' />" +
            "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='130' />" +
            "<Row ss:Index='1' ss:Height='16'>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="String">Project Name: '+project_name+'</Data></Cell>' +
          //  '<Cell ss:StyleID="S58NC"><Data ss:Type="String">'+project_name+'</Data></Cell>' +
            "</Row>" +
            "<Row ss:Index='2' ss:Height='16'>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="String">Project ID: '+projectId+'</Data></Cell>' +
          //  '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">'+projectId+'</Data></Cell>' +
            "</Row>" +
            "<Row ss:Index='3' ss:Height='16'>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="String">Accounting Period: '+periodNameFrom+' - '+periodNameTo+'</Data></Cell>' +
          //  '<Cell ss:StyleID="S58NC"><Data ss:Type="String">'+periodNameFrom+' - '+periodNameTo+'</Data></Cell>' +
            "</Row>" +
            "<Row ss:Index='4' ss:Height='16'>" +
            '<Cell ss:StyleID="S57"><Data ss:Type="String">Descriptions</Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> Cost Centre </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> GL Code </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> Approved Budget </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> Total Receipt / Payment  </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> Open Purchase Order (PO) </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> Total Utilisation (Total Payment + Open PO) </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> Budget Balance </Data></Cell>' +
            "</Row>" +
            "<Row ss:Index='5' ss:Height='16'>" +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> RM </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> RM  </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> RM </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> RM </Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"> RM </Data></Cell>' +
            "</Row>" +
            "<Row ss:Index='6' ss:Height='16'>" +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String">Income:</Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            "</Row>";

          var income_total_receipt_payment = 0;
          var income_total_approved_budget = 0;
          var income_total_amount_po = 0;
          var income_total_utilisation = 0;
          var income_total_budget_balance = 0;
          var income_sum_utilisation = 0;
          var income_sum_budget_balance = 0;
          list_project_income.forEach((data, index) => {
            income_total_receipt_payment += parseFloat(data.receiptPayment);
            income_total_approved_budget += parseFloat(data.approvedBudget);
            income_total_amount_po += parseFloat(data.amountPo);
            income_total_utilisation = parseFloat(data.receiptPayment)+parseFloat(data.amountPo);
            income_total_budget_balance = parseFloat(data.approvedBudget)-income_total_utilisation;
            income_sum_utilisation += income_total_utilisation;
            income_sum_budget_balance += income_total_budget_balance;
            xmlStr +=
              "<Row>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="String">' +
              data.description +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59"><Data ss:Type="String">' +
              data.costCenter +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59"><Data ss:Type="String">' +
              data.glCode +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              data.approvedBudget +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              data.receiptPayment +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              data.amountPo +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              income_total_utilisation +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              income_total_budget_balance +
              "</Data></Cell>" +
              "</Row>";
          });

          var totalIncomeReceipt = 0;
          var totalIncomeBudget  = 0;
          var totalIncomePo  = 0;
          if (list_project_income.length > 0) {
            totalIncomeReceipt = income_total_receipt_payment;
            totalIncomeBudget = income_total_approved_budget;
            totalIncomePo = income_total_amount_po;
          }

          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="String">Total Income</Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            totalIncomeBudget +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            totalIncomeReceipt +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            totalIncomePo +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            income_sum_utilisation +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            income_sum_budget_balance +
            "</Data></Cell>" +
            "</Row>";

          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            "</Row>";

          var list_project_expense = list_project.filter(function (item) 
		   {
 			return item.accountType =="Expense" ||
				   item.accountType =="OthExpense";
          });

          log.debug("Log Debug Project Expense : ", list_project_expense);

          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String">(-) Expenses:</Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            "</Row>";

          var expense_total_receipt_payment = 0;
          var expense_total_approved_budget = 0;
          var expense_total_amount_po = 0;
          var expense_total_utilisation = 0;
          var expense_total_budget_balance = 0;
          var expense_sum_utilisation = 0;
          var expense_sum_budget_balance = 0;
          list_project_expense.forEach((data, index) => {
            expense_total_receipt_payment += parseFloat(data.receiptPayment);
            expense_total_approved_budget += parseFloat(data.approvedBudget);
            expense_total_amount_po += parseFloat(data.amountPo);
            expense_total_utilisation = parseFloat(data.receiptPayment)+parseFloat(data.amountPo);
            expense_total_budget_balance = parseFloat(data.approvedBudget)-expense_total_utilisation;
            expense_sum_utilisation += expense_total_utilisation;
            expense_sum_budget_balance += expense_total_budget_balance;
            xmlStr +=
              "<Row>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="String">' +
              data.description +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59"><Data ss:Type="String">' +
              data.costCenter +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59"><Data ss:Type="String">' +
              data.glCode +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              data.approvedBudget +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              data.receiptPayment +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              data.amountPo +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              expense_total_utilisation +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              expense_total_budget_balance +
              "</Data></Cell>" +
              "</Row>";
          });

          var totalExpenseReceipt = 0;
          var totalExpenseBudget  = 0;
          var totalExpensePo  = 0;
          if (list_project_expense.length > 0) {
            totalExpenseReceipt = expense_total_receipt_payment;
            totalExpenseBudget = expense_total_approved_budget;
            totalExpensePo = expense_total_amount_po;
          }

          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="String">Total Expense</Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            totalExpenseBudget +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            totalExpenseReceipt +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            totalExpensePo +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            expense_sum_utilisation +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            expense_sum_budget_balance +
            "</Data></Cell>" +
            "</Row>";

          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            "</Row>";

          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String">Profit</Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="Number">' +
            Number(totalIncomeBudget - totalExpenseBudget) +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="Number">' +
            Number(totalIncomeReceipt - totalExpenseReceipt) +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="Number">' +
            Number(totalIncomePo - totalExpensePo) +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String"></Data></Cell>' +
            "</Row>";

          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            "</Row>";

          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String">Capital expenditure (CAPEX):</Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S57NC"><Data ss:Type="String"></Data></Cell>' +
            "</Row>";

          var filter_fixed_asset = {
            accountType: "FixedAsset",
          };

          var list_project_fixed_asset = list_project.filter(function (item) {
            for (var key3 in filter_fixed_asset) {
              if (item[key3] === undefined || item[key3] != filter_fixed_asset[key3]) {
                return false;
              }
            }
            return true;
          });

          log.debug("Log Debug Project Fixed Asset : ", list_project_fixed_asset);

          var fixed_total_receipt_payment = 0;
          var fixed_total_approved_budget = 0;
          var fixed_total_amount_po = 0;
          var fixed_total_utilisation = 0;
          var fixed_total_budget_balance = 0;
          var fixed_sum_utilisation = 0;
          var fixed_sum_budget_balance = 0;
          list_project_fixed_asset.forEach((data, index) => {
            fixed_total_receipt_payment += parseFloat(data.receiptPayment);
            fixed_total_approved_budget += parseFloat(data.approvedBudget);
            fixed_total_amount_po += parseFloat(data.amountPo);
            fixed_total_utilisation = parseFloat(data.receiptPayment)+parseFloat(data.amountPo);
            fixed_total_budget_balance = parseFloat(data.approvedBudget)-fixed_total_utilisation;
            fixed_sum_utilisation += fixed_total_utilisation;
            fixed_sum_budget_balance += fixed_total_budget_balance;
            xmlStr +=
              "<Row>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="String">' +
              data.description +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59"><Data ss:Type="String">' +
              data.costCenter +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59"><Data ss:Type="String">' +
              data.glCode +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              data.approvedBudget +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              data.receiptPayment +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              data.amountPo +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              fixed_total_utilisation +
              "</Data></Cell>" +
              '<Cell ss:StyleID="S59NC"><Data ss:Type="Number">' +
              fixed_total_budget_balance +
              "</Data></Cell>" +
              "</Row>";
          });

          var totalFixedAssetReceipt = 0;
          var totalFixedAssetBudget = 0;
          var totalFixedAssetPo  = 0;
          if (list_project_fixed_asset.length > 0) {
            totalFixedAssetReceipt = fixed_total_receipt_payment;
            totalFixedAssetBudget = fixed_total_approved_budget;
            totalFixedAssetPo = fixed_total_amount_po;
          }

          xmlStr +=
            "<Row>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="String">Total CAPEX</Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58"><Data ss:Type="String"></Data></Cell>' +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            totalFixedAssetBudget +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            totalFixedAssetReceipt +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            totalFixedAssetPo +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            fixed_sum_utilisation +
            "</Data></Cell>" +
            '<Cell ss:StyleID="S58NC"><Data ss:Type="Number">' +
            fixed_sum_budget_balance +
            "</Data></Cell>" +
            "</Row>";

          xmlStr += "</Table></Worksheet></Workbook>";

          var strXmlEncoded = encode.convert({
            string: xmlStr,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64,
          });
		  
		  /*var form_result = serverWidget.createForm({
            title: "Result of Tracking Project",
          });
          form_result.addPageInitMessage({
            type: message.Type.ERROR,
            title: "Success generating report",
            message: html,
          });
          context.response.writePage(form_result);*/
	
          project_name.replace(/ /g,"_");
          var objXlsFile = file.create({
            name: "Project_Tracking_"+project_name+".xls",
            fileType: file.Type.EXCEL,
            contents: strXmlEncoded,
          });

          context.response.writeFile({
            file: objXlsFile,
          });
        }
      } catch (error) {
        log.debug("error in get report", error.name + ": " + error.message);
      }
    }
  }

  return {
    onRequest: onRequest,
  };
});
