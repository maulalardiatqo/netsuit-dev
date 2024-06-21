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
      var soRecord = record.load({
        type: "salesorder",
        id: recid,
        isDynamic: false,
      });
      var subsidiari = soRecord.getValue('subsidiary');
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
        var name = subsidiariRec.getValue('name');
        var retEmailAddres = subsidiariRec.getValue('email');
        var Npwp = subsidiariRec.getValue('federalidnumber');

        var bankName = subsidiariRec.getValue('custrecord_msa_sub_bank_name');
        var swiftCode = subsidiariRec.getValue('custrecord_msa_sub_swift_code');
        var bankBranch = subsidiariRec.getValue('custrecord_msa_sub_bank_branch');
        var accountNo = subsidiariRec.getValue('custrecord_msa_sub_account_number');
        var paymentReferences = subsidiariRec.getValue('custrecord_msa_sub_payment_reference');
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
      if(addresSubsidiaries.includes("<br>")){
        addresSubsidiaries = addresSubsidiaries.replace(/<br>/g, "");
      }
      if(name){
          addresSubsidiaries = addresSubsidiaries.replace(name, "");
      }
      // load vendor
      var customer_id = soRecord.getValue('entity');
      if (customer_id) {
        var customerRecord = record.load({
          type: "customer",
          id: customer_id,
          isDynamic: false,
        });
        var custName = customerRecord.getText('altname');
        var custAddres = customerRecord.getValue('defaultaddress');
        var custAddres = custAddres.replace(new RegExp('\r?\n', 'g'), '<br />');
        var custAddres = custAddres.substring(custAddres.indexOf('<br />') + 6);
        var custEmail = customerRecord.getValue('email');
        var taxRegNo = customerRecord.getValue('vatregnumber');

        

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
      var tandId = soRecord.getValue('tranid');
      var InvDate = soRecord.getValue('trandate');
      var terms = soRecord.getText('terms');
      var subTotal = soRecord.getValue('subtotal')||0;
      var poTotal = soRecord.getValue('total')||0;
      var taxtotal = soRecord.getValue('taxtotal')||0;
      var total = soRecord.getValue('total')||0;
      var duedate = soRecord.getValue('duedate') || 0;
      var discount = soRecord.getValue('discounttotal');
      var jobNumber = soRecord.getValue('custbody_abj_custom_jobnumber');
      var otehrRefNum = soRecord.getValue('otherrefnum')
      log.debug('jobNumber', jobNumber)
      var subtotalB = subTotal
      var totalB = total
      var taxtotalB = taxtotal
      var totalToCount = total
      var totalWhTaxamount = 0;
      var totalWhTaxamountItem = 0;
      var whtaxammountItem = 0;

      var countItem = soRecord.getLineCount({
        sublistId: 'item'
      });
      if (countItem > 0) {
        var taxpphList = [];
        for (var i = 0; i < countItem; i++) {
          var taxpph = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_4601_witaxrate',
            line: i
          });
          whtaxammountItem = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_4601_witaxamount',
            line: i
          });
          var taxItem = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'taxrate1',
            line: i
          })
          var tamount = whtaxammountItem
          whtaxammountItem = Math.abs(tamount);
          totalWhTaxamountItem += whtaxammountItem

          if (taxpph && taxpphList.indexOf(taxpph) === -1) {
            taxpphList.push(taxpph);
          }
        }
      }
      if (taxpphList.length > 0) {
        var taxpphToPrint = taxpphList.join(' & ');
        log.debug('taxpphToPrint', taxpphToPrint);
      }
      var whtaxToCount = whtaxammountItem;
      totalWhTaxamount = totalWhTaxamountItem;
      
      if (totalWhTaxamount) {
        totalWhTaxamount = format.format({
          value: totalWhTaxamount,
          type: format.Type.CURRENCY
        });
      }
      if(poTotal){
        poTotal = format.format({
          value: poTotal,
          type: format.Type.CURRENCY
        });
      }
      if(subTotal){
        subTotal = format.format({
          value: subTotal,
          type: format.Type.CURRENCY
        });
      }
      
      if (taxtotal) {
        taxtotal = format.format({
          value: taxtotal,
          type: format.Type.CURRENCY
        });
      }
      if(total){
        total = format.format({
          value: total,
          type: format.Type.CURRENCY
        });
      }
      
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
      
      if(taxpphToPrint){
        amountRecieved = amountRecieved - totalWhTaxamount;
      }
      if(amountRecieved){
        amountRecieved = format.format({
          value: amountRecieved,
          type: format.Type.CURRENCY
        });
      }
      log.debug('amountR', amountRecieved);
      if(discount){
        discount = format.format({
          value: discount,
          type: format.Type.CURRENCY
        });
      }
      
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
            if(subsidiari == 1){
                style += ".tg .tg-img-logo{width:150px; height:111px; object-vit:cover;}";
            }else{
                style += ".tg .tg-img-logo{width:195px; height:90px; object-vit:cover;}";
            }
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
        body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left;'><div style='display: flex; height:150px; width:150px;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
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
      body += "<p class='tg-headerrow_legalName'> Sales Quotation # : " + tandId + "<br/>"
      body += "" + InvDate + "</p>"
      body += "<p class='tg-headerrow' style='font-size:11px'> Terms : " + terms + "<br/>"
      body += "Due Date :" + duedate + "</p>"
      body += "</td>"
      body += "</tr>"
      body += "<tr style='height:10px;'>";
      body += "</tr>";
      body += "</tbody>";
      body += "</table>";

      body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
      body += "<thead>"
      body += "<tr>"
      body += "<td class='tg-head_body' style='width:20%'> QTY </td>"
      body += "<td class='tg-head_body' style='width:20%'> ITEM </td>"
      body += "<td class='tg-head_body' style='align:right' width='20%'> UNIT PRICE (Rp.) </td>"
      body += "<td class='tg-head_body' style='align:right' width='20%'> TAXED </td>"
      body += "<td class='tg-head_body' style='align:right' width='20%'> AMOUNT (Rp.) </td>"
      body += "</tr>"
      body += "</thead>"
      body += "<tbody>";
      body += getPOItem(context, soRecord);
      body += "<tr>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-f_body' colspan='2'>SUBTOTAL</td>"
      body += "<td class='tg-f_body'>" + subTotal + "</td>"
      body += "</tr>"
      if(discount !== 0){
        body += "<tr>"
        body += "<td class='tg-headerrow_left'></td>"
        body += "<td class='tg-headerrow_left'></td>"
        body += "<td class='tg-f_body'></td>"
        body += "<td class='tg-f_body'>Discount " + taxItem + " %</td>"
        body += "<td class='tg-f_body'>" + discount + "</td>"
        body += "</tr>"
      }
      
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
      if(taxpphToPrint){
        body += "<tr>"
        body += "<td class='tg-headerrow_left'></td>"
        body += "<td class='tg-headerrow_left'></td>"
        body += "<td style='align: right;font-size:12px;border-bottom: solid black 2px;' colspan='2'>PPH "+ taxpphToPrint +" % </td>"
        body += "<td class='tg-f_body'>"+totalWhTaxamount+"</td>"
        body += "</tr>"
      }
      
      body += "<tr>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td class='tg-headerrow_left'></td>"
      body += "<td style='align: right;font-size:14px;border-top: solid black 2px; font-weight: bold;' colspan='2'>AMOUNT RECEIVED</td>"
      body += "<td style='align: right;font-size:14px;border-top: solid black 2px; font-weight: bold;'>" + amountRecieved + "</td>"
      body += "</tr>"
      body += "</tbody>"
      body += "</table>"
     

      footer += "<table class='tg' style='table-layout: fixed;'>";
      footer += "<tbody>";
      footer += "<tr class='tg-foot'>";
      footer += "<td style='align:left'> Sales Order # " + tandId + "</td>"
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

    function getPOItem(context, soRecord) {
      var itemCount = soRecord.getLineCount({
        sublistId: 'item'
      });
      log.debug('itemCount', itemCount);

      if (itemCount > 0) {
        var body = "";
        for (var index = 0; index < itemCount; index++) {
          var qty = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: index
          });
          var description = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item_display',
            line: index
          });
          if (description.includes('&')) {
            description = description.replace(/&/g, '&amp;');
        }
          var unit = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'units',
            line: index
          });
          var rate = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: index
          });
          if(rate){
            rate = format.format({
              value: rate,
              type: format.Type.CURRENCY
            });
          }
          
          var taxAmt = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'tax1amt',
            line: index
          });
          if(taxAmt){
            taxAmt = format.format({
              value: taxAmt,
              type: format.Type.CURRENCY
            });
          }
          
          var ammount = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'grossamt',
            line: index
          });
          if(ammount){
            ammount = format.format({
              value: ammount,
              type: format.Type.CURRENCY
            });
          }
          
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