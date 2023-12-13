/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
  function(render, search, record, log, file, http, config, format, email, runtime) {
    function onRequest(context) {
      var recid = context.request.parameters.id;
      log.debug('recid', recid);
      log.debug('masuk')
      // load SO
      var cmRecord = record.load({
        type: "creditmemo",
        id: recid,
        isDynamic: false,
      });
      var subsidiari = cmRecord.getValue('subsidiary');
      // load subsidiarie
      if (subsidiari) {
        var subsidiariRec = record.load({
          type: "subsidiary",
          id: subsidiari,
          isDynamic: false,
        });
        // load for header
        var legalName = subsidiariRec.getValue('legalname');
        var addresSubsidiaries = subsidiariRec.getValue('mainaddress_text');
        var addresSubsidiaries = addresSubsidiaries.replace(new RegExp('\r?\n', 'g'), '<br />');
        var addresSubsidiaries = addresSubsidiaries.substring(addresSubsidiaries.indexOf('<br />') + 6);
        var retEmailAddres = subsidiariRec.getValue('email');
        var Npwp = subsidiariRec.getValue('federalidnumber');

        var bankName = subsidiariRec.getValue('custrecord_fcn_sub_bank_name');
        var swiftCode = subsidiariRec.getValue('custrecord_fcn_sub_swift_code');
        var bankBranch = subsidiariRec.getValue('custrecord_fcn_sub_bank_branch');
        var accountNo = subsidiariRec.getValue('custrecord_fcn_sub_account_number');
        var paymentReferences = subsidiariRec.getValue('custrecord_fcn_sub_payment_reference');
        var logo = subsidiariRec.getValue('logo');
        var filelogo;
        var urlLogo = '';
        if (logo) {
          filelogo = file.load({
            id: logo
          });
          //get url
          urlLogo = filelogo.url.replace(/&/g, "&amp;");
        }
      }

      // load vendor
      var customer_id = cmRecord.getValue('entity');
      if (customer_id) {
        var customerRecord = record.load({
          type: "customer",
          id: customer_id,
          isDynamic: false,
        });
        var custName = customerRecord.getText('entityid');
        var custAddres = customerRecord.getValue('defaultaddress');
        var custAddres = custAddres.replace(new RegExp('\r?\n', 'g'), '<br />');
        var custAddres = custAddres.substring(custAddres.indexOf('<br />') + 6);
        var custEmail = customerRecord.getValue('email');
        var taxRegNo = customerRecord.getValue('custentity1');
        var count = customerRecord.getLineCount({
          sublistId: 'submachine'
        });
        for (var i = 0; i < count; i++) {
          var subsidiary = customerRecord.getSublistValue({
            sublistId: 'submachine',
            fieldId: 'subsidiary',
            line: i
          });

          if (subsidiary == subsidiari) {
            var balance = customerRecord.getSublistValue({
              sublistId: 'submachine',
              fieldId: 'balance',
              line: i
            });
            break;
          }
        }
      }
      log.debug('balancebfr', balance)
      if (balance) {
        balance = format.format({
          value: balance,
          type: format.Type.CURRENCY
        });
      }
      log.debug('balance', balance);
      // PO data
      var tandId = cmRecord.getValue('tranid');
      var InvDate = cmRecord.getValue('trandate');
      var terms = cmRecord.getText('terms');
      var subTotal = cmRecord.getValue('subtotal');
      var poTotal = cmRecord.getValue('total');
      var taxtotal = cmRecord.getValue('taxtotal');
      var total = cmRecord.getValue('total');
      var duedate = cmRecord.getValue('duedate') || 0;
      var discount = cmRecord.getValue('discounttotal')
      var jobNumber = cmRecord.getValue('custbody_abj_custom_jobnumber');
      var otehrRefNum = cmRecord.getValue('otherrefnum')
      log.debug('jobNumber', jobNumber)
      var subtotalB = subTotal
      var totalB = total
      var taxtotalB = taxtotal
      var totalToCount = total
      var totalWhTaxamount = 0;
      var totalWhTaxamountItem = 0;
      var whtaxammountItem = 0;

      var countItem = cmRecord.getLineCount({
        sublistId: 'item'
      });
      if (countItem > 0) {
        for (var i = 0; i < countItem; i++) {
          whtaxammountItem = cmRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_4601_witaxamount',
            line: i
          });
          var taxItem = cmRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'taxrate1',
            line: i
          })
          var tamount = whtaxammountItem
          whtaxammountItem = Math.abs(tamount);
          totalWhTaxamountItem += whtaxammountItem
        }
      }
      var whtaxToCount = whtaxammountItem;
      totalWhTaxamount = totalWhTaxamountItem;
      if (totalWhTaxamount) {
        totalWhTaxamount = format.format({
          value: totalWhTaxamount,
          type: format.Type.CURRENCY
        });
      }
      poTotal = format.format({
        value: poTotal,
        type: format.Type.CURRENCY
      });
      subTotal = format.format({
        value: subTotal,
        type: format.Type.CURRENCY
      });
      if (taxtotal) {
        taxtotal = format.format({
          value: taxtotal,
          type: format.Type.CURRENCY
        });
      }

      total = format.format({
        value: total,
        type: format.Type.CURRENCY
      });
      if (duedate) {
        function sysDate() {
          var date = duedate;
          var tdate = date.getUTCDate();
          var month = date.getUTCMonth() + 1; // jan = 0
          var year = date.getUTCFullYear();
          return tdate + '/' + month + '/' + year;
        }
        duedate = sysDate();
      }
      if (InvDate) {
        InvDate = format.format({
          value: InvDate,
          type: format.Type.DATE
        });
      }
      var amountRecieved = Number(subtotalB) - Number(discount) + Number(taxtotalB) / Number(totalB);
      log.debug('subtotal', subtotalB);
      log.debug('discount', discount);
      log.debug('total', totalB);
      log.debug('taxtotal', taxtotalB);
      log.debug('amountR', amountRecieved);
      amountRecieved = format.format({
        value: amountRecieved,
        type: format.Type.CURRENCY
      });
      discount = format.format({
        value: discount,
        type: format.Type.CURRENCY
      });
      var response = context.response;
      var xml = "";
      var header = "";
      var body = "";
      var headerHeight = '27%';
      var style = "";
      var footer = "";
      var pdfFile = null;

      style += "<style type='text/css'>";
      style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
      style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
      style += ".tg .tg-img-logo{height: 130px; width:150px; object-fit:cover;}"
      style += ".tg .tg-headerrow{align: right;font-size:12px;}";
      style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
      style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
      style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
      style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
      style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
      style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
      style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
      style += "</style>";


      body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
      body += "<tbody>";
      body += "<tr>";
      if (urlLogo) {
        body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img> </td>";
      }
      body += "<td>";
      body += "<p class='tg-headerrow_legalName' style='margin-top: 10px; margin-bottom: 10px;'>" + legalName + "</p>";
      body += "<p class='tg-headerrow' style='margin-top: 1px; margin-bottom: 1px;'>" + addresSubsidiaries + "<br/>";
      body += "" + retEmailAddres + "<br/>"
      body += "NPWP : " + Npwp + "</p>";
      body += "</td>";
      body += "</tr>";
      body += "<tr style='height:10px;'>";
      body += "</tr>";
      body += "<tr>";
      body += "<td>";
      body += "<p class='tg-headerrow_left'>" + custName + "<br/>"
      body += "<span>" + custAddres + "</span><br/>"
      body += "<span>" + custEmail + "</span><br/>"
      body += "NPWP : " + taxRegNo + "</p>"
      body += "</td>"
      body += "<td>"
      body += "<p class='tg-headerrow_legalName'> Credit Memo # : " + tandId + "<br/>"
      body += "" + InvDate + "</p>"
      body += "<p class='tg-headerrow' style='font-size:11px'> Terms : " + terms + "<br/>"
      body += "Due Date :" + duedate + "</p>"
      body += "<p class='tg-headerrow_Total'> Rp." + balance + "</p>"
      body += "</td>"
      body += "</tr>"
      body += "</tbody>";
      body += "</table>";

      body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
      body += "<thead>"
      body += "<tr>"
      body += "<td class='tg-head_body' style='width:20%'> QTY </td>"
      body += "<td class='tg-head_body' style='width:20%'> DESCRIPTION </td>"
      body += "<td class='tg-head_body' style='align:right' width='20%'> UNIT PRICE (Rp.) </td>"
      body += "<td class='tg-head_body' style='align:right' width='20%'> TAXED </td>"
      body += "<td class='tg-head_body' style='align:right' width='20%'> AMOUNT (Rp.) </td>"
      body += "</tr>"
      body += "</thead>"
      body += "<tbody>";
      body += getPOItem(context, cmRecord);
      body += "<tr>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-f_body' colspan='2'>SUBTOTAL</td>"
      body += "<td class='tg-f_body'>" + subTotal + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-f_body'></td>"
      body += "<td class='tg-f_body'>Discount " + taxItem + " %</td>"
      body += "<td class='tg-f_body'>" + discount + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-f_body'></td>"
      body += "<td class='tg-f_body'>PPN " + taxItem + " %</td>"
      body += "<td class='tg-f_body'>" + taxtotal + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-f_body'></td>"
      body += "<td class='tg-f_body'>TOTAL</td>"
      body += "<td class='tg-f_body'>" + total + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td style='align: right;font-size:14px;border-top: solid black 2px; font-weight: bold;' colspan='2'>AMOUNT RECEIVED</td>"
      body += "<td style='align: right;font-size:14px;border-top: solid black 2px; font-weight: bold;'>" + amountRecieved + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td style='align: right;font-size:14px;' colspan='2'>BALANCE DUE</td>"
      body += "<td style='align: right;font-size:14px;'>" + balance + "</td>"
      body += "</tr>"
      body += "</tbody>"
      body += "</table>"
      body += "<table class='tg' width=\"100%\">";
      body += "<tr style='height:30px;'></tr>"
      body += "<tr>"
      body += "<td style='align:left; font-weight: bold;'>Payment Detail</td>"
      body += "<td width='10'></td>"
      body += "<td></td>"
      body += "<td style='align:left; font-weight: bold;' colspan='2'>Other Information</td>"
      body += "<td></td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td style='align:left;'>Bank Name</td>"
      body += "<td width='10'>:</td>"
      body += "<td style='align:left;'>" + bankName + "</td>"
      body += "<td style='align:left;' colspan='2'>Customer References :</td>"
      body += "<td style='align:left;'>" + otehrRefNum + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td style='align:left;'>Bank Branch</td>"
      body += "<td width='10'>:</td>"
      body += "<td style='align:left;'>" + bankBranch + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td style='align:left;'>Bank/Seift Code</td>"
      body += "<td width='10'>:</td>"
      body += "<td style='align:left;'>" + swiftCode + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td style='align:left;'>Acount Name</td>"
      body += "<td width='10'>:</td>"
      body += "<td style='align:left;' colspan='2'>" + legalName + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td style='align:left;'>Acount Number</td>"
      body += "<td width='10'>:</td>"
      body += "<td style='align:left;' colspan='2'>" + accountNo + "</td>"
      body += "</tr>"
      body += "<tr>"
      body += "<td style='align:left;'>Payment References</td>"
      body += "<td width='10'>:</td>"
      body += "<td style='align:left;' colspan='2'>" + paymentReferences + "</td>"
      body += "</tr>"
      body += "<tr style='height:30px;'></tr>"
      body += "<tr>"
      body += "<td style='align:left; font-size:14px; font-weight: bold;' colspan='5'>" + jobNumber + "</td>"
      body += "</tr>"
      body += "</table>";

      footer += "<table class='tg' style='table-layout: fixed;'>";
      footer += "<tbody>";
      footer += "<tr class='tg-foot'>";
      footer += "<td style='align:left'>Credit Memo # " + tandId + "</td>"
      footer += "<td style='align:right'></td>"
      footer += "</tr>";
      footer += "</tbody>";
      footer += "</table>";

      var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
      xml += "<pdf>";
      xml += "<head>";
      xml += style;
      xml += "<macrolist>";
      xml += "<macro id=\"nlheader\">";
      xml += header;
      xml += "</macro>";
      xml += "<macro id=\"nlfooter\">";
      xml += footer;
      xml += "</macro>";
      xml += "</macrolist>";
      xml += "</head>"
      xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' footer='nlfooter' footer-height='3%'>";
      xml += body;
      xml += "\n</body>\n</pdf>";

      xml = xml.replace(/ & /g, ' &amp; ');
      response.renderPdf({
        xmlString: xml
      });
    }

    function getPOItem(context, cmRecord) {
      var itemCount = cmRecord.getLineCount({
        sublistId: 'item'
      });
      log.debug('itemCount', itemCount);

      if (itemCount > 0) {
        var body = "";
        for (var index = 0; index < itemCount; index++) {
          var qty = cmRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: index
          });
          var description = cmRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item_display',
            line: index
          });
          var unit = cmRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'units',
            line: index
          });
          var rate = cmRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: index
          });
          rate = format.format({
            value: rate,
            type: format.Type.CURRENCY
          });
          var taxAmt = cmRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'tax1amt',
            line: index
          });
          taxAmt = format.format({
            value: taxAmt,
            type: format.Type.CURRENCY
          });
          var ammount = cmRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'grossamt',
            line: index
          });
          ammount = format.format({
            value: ammount,
            type: format.Type.CURRENCY
          });
          body += "<tr>";
          body += "<td class='tg-b_body'>" + qty + " - " + unit + "Pcs</td>";
          body += "<td class='tg-b_body'>" + description + "</td>";
          body += "<td class='tg-b_body' style='align:right'>" + rate + "</td>";
          body += "<td class='tg-b_body' style='align:right'>" + taxAmt + "</td>";
          body += "<td class='tg-b_body' style='align:right;'>" + ammount + "</td>";
          body += "</tr>";
        }
        return body;
      }

    }
    return {
      onRequest: onRequest,
    };
  });