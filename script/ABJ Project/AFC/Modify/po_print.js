/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
  function(render, search, record, log, file, http, config, format, email, runtime) {
    function onRequest(context) {
      var recid = context.request.parameters.id;
      var isEmail = context.request.parameters.isEmail;
      log.debug("isEmail", isEmail);
      var poRecord = record.load({
        type: record.Type.PURCHASE_ORDER,
        id: recid,
        isDynamic: false,
      });

      var approval_Status = poRecord.getValue('approvalstatus');
      log.debug("approval_Status", approval_Status);
      log.debug("recid", recid);
      var urlapprover2_signage = '';
      var urlapprover1_signage = '';
      var isapproved = approval_Status == '2';
      if (isapproved) {
        var approver1_signage = null;
        var approver2_signage = null;

        var po_approvers = search.load({
          id: 'customsearchafc_po_approver',
        });
        po_approvers.filters.push(search.createFilter({
          name: 'custrecord_sas_history_record_id',
          operator: search.Operator.EQUALTO,
          values: recid
        }));
        var po_approverset = po_approvers.run();
        po_approvers = po_approverset.getRange(0, 2);
        log.debug("po_approvers", po_approvers);

        var approver1_sign_name = '';
        var approver2_sign_name = '';

        for (var i in po_approvers) {
          po_approver = po_approvers[i];
          if (i == 0) {
            approver2_signage = po_approver.getValue(po_approverset.columns[5]);
            approver2_sign_name = po_approver.getText(po_approverset.columns[3]);
          } else {
            approver1_signage = po_approver.getValue(po_approverset.columns[5]);
            approver1_sign_name = po_approver.getText(po_approverset.columns[3]);
          }
        }

        var fileimage = null;
        if (approver2_signage) {
          fileimage = file.load({
            id: approver2_signage
          });
          urlapprover2_signage = fileimage.url.replace(/&/g, "&amp;");
        }
        log.debug("urlapprover2_signage", urlapprover2_signage);

        if (approver1_signage) {
          fileimage = file.load({
            id: approver1_signage
          });
          urlapprover1_signage = fileimage.url.replace(/&/g, "&amp;");
        }
        log.debug("urlapprover1_signage", urlapprover1_signage);
      }

      var companyInfo = config.load({
        type: config.Type.COMPANY_INFORMATION
      });

      var legalname = companyInfo.getValue('legalname');
      var mainaddress_text = companyInfo.getValue('mainaddress_text');
      var phone = 'Tel : ' + (companyInfo.getValue('custrecord_abj_phone') || '-');
      var logo = companyInfo.getValue('formlogo');
      var filelogo;
      var urlLogo = '';
      if (logo) {
        filelogo = file.load({
          id: logo
        });
        //get url
        urlLogo = filelogo.url.replace(/&/g, "&amp;");
        log.debug("urlLogo", urlLogo);
      }
      var fax = 'Fax : ' + companyInfo.getValue('fax');
      var url = companyInfo.getValue('url');
      var appurl = companyInfo.getValue('appurl');

      var subsidiary = poRecord.getText("subsidiary");
      var vendor = poRecord.getText("entity");
      var vendor_id = poRecord.getValue("entity");
      var trandate = poRecord.getValue("trandate");
      trandate = format.format({
        value: trandate,
        type: format.Type.DATE
      });
      var tranid = poRecord.getValue("tranid");
      var memo = poRecord.getValue("memo") || '';
      var po_rfq_no = poRecord.getValue("custbody_abj_rfq_no") || '';
      var po_rfq_date = poRecord.getValue("custbody_abj_rfq_date") || '';
      if (po_rfq_date)
        po_rfq_date = format.format({
          value: po_rfq_date,
          type: format.Type.DATE
        });
      var po_rfq_proj_name = poRecord.getText("custbody_abj_po_proj_name") || '';
      var po_rfq_quote_refno = poRecord.getValue("custbody_abj_quot_refno") || '';
      var po_rfq_quote_refdate = poRecord.getValue("custbody_abj_quot_ref_date") || '';
      var po_buyer = poRecord.getValue("custbody_abj_po_buyer");
      if (po_rfq_quote_refdate)
        po_rfq_quote_refdate = format.format({
          value: po_rfq_quote_refdate,
          type: format.Type.DATE
        });

      var vendorRecord = record.load({
        type: record.Type.VENDOR,
        id: vendor_id,
        isDynamic: false,
      });
      var entity_phone = vendorRecord.getValue('phone') || '';
      var vendor_email = vendorRecord.getValue('email') || '';

      var poshipto = poRecord.getText("custbody_abj_po_ship_to") || '';
      var deliveryAddress = poRecord.getText("custbody_abj_po_ship_add") || '';
      if (deliveryAddress)
        poshipto += '<br/>' + deliveryAddress;

      var entityname = vendorRecord.getText("companyname") || vendor || '';

      var attention = vendorRecord.getText("custentity_abj_attn") || '';
      var billaddress = vendorRecord.getText("defaultaddress") || poRecord.getValue("billaddress") || '';

      billaddress = split_line(billaddress);
      billaddress = billaddress[0].str;

      log.debug("billaddress", billaddress);

      if (!attention && (vendorRecord.getLineCount({
          sublistId: 'addressbook'
        }) > 0))
        attention = vendorRecord.getSublistValue({
          sublistId: 'addressbook',
          fieldId: 'attention_initialvalue',
          line: 0
        });

      var currency = poRecord.getText("currency");
      var po_version = poRecord.getText("custbody_abj_version");
      var duedate = poRecord.getValue("duedate");
      if (duedate)
        duedate = format.format({
          value: duedate,
          type: format.Type.DATE
        });
      var terms = poRecord.getText("terms");
      var subtotal = poRecord.getValue("subtotal");
      subtotal = format.format({
        value: subtotal,
        type: format.Type.CURRENCY
      });
      var taxtotal = poRecord.getValue("taxtotal");
      taxtotal = format.format({
        value: taxtotal,
        type: format.Type.CURRENCY
      });
      var total = poRecord.getValue("total");
      total = format.format({
        value: total,
        type: format.Type.CURRENCY
      });

      var response = context.response;
      var xml = "";
      var header = "";
      var body = "";
      var headerHeight = '7%';
      var style = "";
      var footer = "";

      style += "<style type='text/css'>";
      style += ".tg {border-collapse:collapse;border-spacing:10;width:100%;}";
      style += ".tg2 {border-collapse:collapse;border-spacing:10;width:100%;height:100%;max-height: 100%;overflow: auto;}";
      style += ".tg1 {border-spacing:1;width:100%;}";

      style += ".tg td{border-color:black;border-style:solid;border-width:0.5px;font-family:Arial, sans-serif;font-size:9px;overflow:hidden;word-break:normal;}";
      style += ".tg2 td{border-color:black;border-style:solid;border-width:0.5px;font-family:Arial, sans-serif;font-size:9px;overflow:auto;word-break:normal;}";
      style += ".tg .tg-headerlogo{border-right: none;border-left: none;border-top: none;}";
      style += ".tg .tg-headerrow_bold_big_font{font-size:24px;font-weight: bold;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
      style += ".tg .tg-headerrow{padding-right:20px;font-size:11px;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
      style += ".tg .tg-headerrow_address{padding-right:40px;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
      style += ".tg .tg-noborder_bigfont{font-size:17px;font-weight: bold;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
      style += ".tg .tg-noborder_12font{width:30%;font-size:12px;font-weight: bold;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
      style += ".tg .tg-noborder_12font_nobold{width:40%;font-size:12px;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
      style += ".tg .tg-noborder{font-size:10px;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
      style += ".tg .tg-kolomnomorpo{width:15%;font-size:12px;font-weight: bold;align: right;vertical-align:center;}";
      style += ".tg .tg-headershipto{font-size:12px;font-weight: bold;align: center;}";
      style += ".tg .tg-headeritemtable{font-size:12px;font-weight: bold;align: center;border-bottom: none;}";
      style += ".tg .tg-judultotal{font-size:11px;font-weight: bold;align: left;}";
      style += ".tg .tg-kolomtotal{font-size:11px;font-weight: bold;align: right;}";
      style += ".tg .tg-blankrow{font-size:10px;align: right;border-top: none;border-bottom: none;}";
      style += ".tg .tg-lastblankrow{font-size:10px;align: right;border-top: none;}";
      style += ".tg .tg-kolomdatapo{width:25%;align: left;font-size:10px;}";
      style += ".tg .tg-kolomshipto{align: center;font-size:10px;}";
      style += ".tg .tg-bottomborder{font-size:11px;font-weight: bold;border-right: none;border-left: none;border-top: none;}";
      style += "</style>";

      header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
      header += "<tbody>";
      header += "<tr>";
      if (urlLogo) {
        header += "<td class='tg-headerlogo' style='width:17%;vertical-align:center;' rowspan='3'><img src='" +
          urlLogo +
          '\' width="100px" height="50px" ></img> </td>';
      }
      header += "<td class='tg-headerrow_bold_big_font'>" +
        legalname + "</td>";

      header += "</tr>";

      header += "<tr>";
      header += "<td class='tg-headerrow'>" +
        mainaddress_text + "</td>";

      //header += "<td>2</td>";
      header += "</tr>";
      header += "<tr>";
      header += "<td class='tg-headerlogo'>" +
        phone + "&nbsp;&nbsp;&nbsp;&nbsp;" + fax + "&nbsp;&nbsp;&nbsp;" + url + "</td>";

      header += "</tr>";

      header += "</tbody>";
      header += "</table>";

      body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
      body += "<tbody>";

      body += "<tr>";
      body += "<td class='tg-headerrow_bold_big_font' style='align:right;' colspan='4'>Purchase Order</td>";
      body += "</tr>";
      body += "</tbody>";
      body += "</table>";

      body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
      body += "<tbody>";
      body += "<tr colspan='4'>";
      body += "<td class='tg-noborder_12font'>Order From :</td>";
      body += "<td class='tg-noborder_12font'>Deliver and Invoice To :</td>"
      body += "<td class='tg-kolomnomorpo'>Purchase No.</td>"
      body += "<td class='tg-kolomdatapo'>" + tranid + "</td>"
      body += "</tr>";
      body += "<tr colspan='4'>";
      body += "<td class='tg-headerrow' >" + entityname + "</td>";
      body += "<td class='tg-headerrow' rowspan = '4'>" + poshipto + "</td>"
      body += "<td class='tg-kolomnomorpo'>Date</td>"
      body += "<td class='tg-kolomdatapo'>" + trandate + "</td>"
      body += "</tr>";
      body += "<tr>";
      body += "<td class='tg-headerrow' rowspan = '4'>" + billaddress + "</td>";
      body += "<td class='tg-kolomnomorpo'>Page</td>"
      body += "<td class='tg-kolomdatapo'>1</td>"
      body += "</tr>";
      body += "<tr>";
      body += "<td class='tg-kolomnomorpo'>Version</td>"
      body += "<td class='tg-kolomdatapo'>" + po_version + "</td>"
      body += "</tr>";
      body += "<tr>";
      body += "<td class='tg-kolomnomorpo'>Currency</td>"
      body += "<td class='tg-kolomdatapo'>" + currency + "</td>"
      body += "</tr>";
      body += "</tbody>";
      body += "</table>";

      //===================================================================//
      //body += "<br/>";
      //===================================================================//

      body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
      body += "<tbody>";
      //space
      body += "<tr>";
      body += "<td class='tg-noborder_12font' style='width:30%'></td>";
      body += "<td class='tg-noborder' style='width:30%'></td>";
      body += "<td class='tg-noborder' style='width:40%'></td>";
      body += "</tr>";
      body += "<tr>";
      body += "<td class='tg-noborder_12font_nobold'><b>ATTN:</b> " + attention + "</td>";
      body += "<td class='tg-noborder' ></td>";
      body += "<td class='tg-noborder' ></td>";
      body += "</tr>";
      //2
      body += "<tr>";
      body += "<td class='tg-headeritemtable'>DELIVERY DATE</td>";
      body += "<td class='tg-headeritemtable'>TERMS</td>"
      body += "<td class='tg-headeritemtable'>MEMO</td>"
      body += "</tr>";
      //3
      body += "<tr>";
      body += "<td class='tg-kolomshipto'>" + duedate + "</td>";
      body += "<td class='tg-kolomshipto'>" + terms + "</td>"
      body += "<td class='tg-kolomshipto'>" + memo + "</td>"
      body += "</tr>";
      body += "</tbody>";
      body += "</table>";

      //===================================================================//
      //body += "<br/>";
      //===================================================================//
      body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
      body += "<tbody>";
      //1
      //space
      body += "<tr>";
      body += "<td class='tg-noborder' style='width:40%'></td>";
      body += "<td class='tg-noborder' style='width:15%'></td>";
      body += "<td class='tg-noborder' style='width:10%'></td>";
      body += "<td class='tg-noborder' style='width:15%'></td>";
      body += "<td class='tg-noborder' style='width:20%'></td>";
      body += "</tr>";
      body += "<tr>";
      body += "<td class='tg-noborder' ></td>";
      body += "<td class='tg-noborder' ></td>";
      body += "<td class='tg-noborder' ></td>";
      body += "<td class='tg-noborder' ></td>";
      body += "<td class='tg-noborder' ></td>";
      body += "</tr>";
      //tabel
      body += "<tr >";
      body += "<td class='tg-headeritemtable' >ITEM</td>";
      body += "<td class='tg-headeritemtable' >QUANTITY</td>"
      body += "<td class='tg-headeritemtable' >UOM</td>"
      body += "<td class='tg-headeritemtable' >UNIT PRICE</td>"
      body += "<td class='tg-headeritemtable' >AMOUNT</td>"
      body += "</tr>";
      body = body.replace(/&/g, "&amp;");

      var item_str = getSublistItem(context, poRecord);
      var item_str_cnt = item_str[0].line_cnt;
      body += item_str[0].str;

      var expense_str = getSublistExpense(context, poRecord);
      var expense_str_cnt = expense_str[0].line_cnt;
      body += expense_str[0].str;
      /*body += "<tr style='height:35%'> ";
      body += "<td class='tg-kolomtotal' style='width:40%'></td>";
      body += "<td class='tg-kolomtotal' style='width:15%'></td>";
      body += "<td class='tg-kolomtotal' style='width:10%'></td>";
      body += "<td class='tg-kolomtotal' style='width:15%'></td>";
      body += "<td class='tg-kolomtotal' style='width:20%'></td>";
      body += "</tr>";*/
      //body += "</tbody>";
      //body += "</table>";


      //body += "<table class='tg' style=\"table-layout:fixed;\">";
      //body += "<tbody style='height:100%'>";
      var blankrow_cnt = 25 - item_str_cnt - expense_str_cnt;
      for (var index = 0; index < blankrow_cnt; index++) {
        body += "<tr> ";
        var xmlclass = 'tg-blankrow';
        if (index + 1 == blankrow_cnt) {
          xmlclass = 'tg-lastblankrow';
        }
        body += "<td class='" + xmlclass + "' style='width:40%'>&nbsp;</td>";
        body += "<td class='" + xmlclass + "' style='width:15%'>&nbsp;</td>";
        body += "<td class='" + xmlclass + "' style='width:10%'>&nbsp;</td>";
        body += "<td class='" + xmlclass + "' style='width:15%'>&nbsp;</td>";
        body += "<td class='" + xmlclass + "' style='width:20%'>&nbsp;</td>";
        body += "</tr>";
      }
      body += "</tbody>";
      body += "</table>";

      body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
      body += "<tbody>";
      body += "<tr> ";
      body += "<td class='tg-noborder' style='width:53%'></td>";
      body += "<td class='tg-noborder' style='width:2%'></td>";
      body += "<td class='tg-noborder' style='width:25%'></td>";
      body += "<td class='tg-noborder' style='width:20%'></td>";
      body += "</tr>";
      /*body += "<tr>";
      body += "<td class='tg-noborder' ></td>";
      body += "<td class='tg-noborder' ></td>";
      body += "<td class='tg-noborder' ></td>";
      body += "<td class='tg-noborder' ></td>";
      body += "</tr>";*/

      body += "<tr>";
      body += "<td rowspan='4' class='tg-noborder' style='width:70%'>* All official invoices shall have a PO number indicated or otherwise will be rejected.<br/>" +
        "* All signed DO and Invoice must be submitted directly to Finance Department (financedept@the-afc.com)<br/>" +
        "* Unless specifically stated otherwise, the attached terms and conditions shall form part of the Purchase Order.<br/>" +
        "E. & O.E" +
        "</td>";
      body += "<td class='tg-noborder'></td>";
      body += "<td class='tg-judultotal'>SUBTOTAL</td>"
      body += "<td class='tg-kolomtotal'>" + subtotal + "</td>";
      body += "</tr>";

      //3
      body += "<tr>";
      body += "<td class='tg-noborder'></td>";
      //body += "<td></td>";
      body += "<td class='tg-judultotal'>SALES TAX</td>"
      body += "<td class='tg-kolomtotal'>" + taxtotal + "</td>";
      body += "</tr>";

      //5
      body += "<tr>";
      body += "<td class='tg-noborder'></td>";
      // body += "<td></td>";
      body += "<td class='tg-judultotal'>TOTAL AMOUNT</td>"
      body += "<td class='tg-kolomtotal'>" + total + "</td>";
      body += "</tr>";
      //6

      // body += "<tr>";
      //body += "<td></td>";
      // body += "<td class='tg-noborder'></td>";
      // body += "<td class='tg-noborder'>&nbsp;</td>"
      // body += "<td class='tg-noborder_12font'>AUTHORISED BY</td>";
      // body += "</tr>";
      body += "</tbody>";
      body += "</table>";

      //9
      footer += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
      footer += "<tbody>";
      footer += "<tr>";
      footer += "<td colspan='3' class='tg-noborder' style='text-align:center;'> <b><i>This is a computer generated document, no signature required.</i></b> </td>"
      // footer += "<td class='tg-noborder'> </td>";
      // footer += "<td class='tg-noborder'> </td>";
      // if (urlapprover1_signage)
      //   footer += "<td class='tg-bottomborder'><img src='" +
      //   urlapprover1_signage +
      //   '\' width="100px" height="50px" ></img> <br/> ' + approver1_sign_name + ' </td>';
      // else
      //   footer += "<td class='tg-bottomborder'> </td>";
      //
      // if (urlapprover2_signage)
      //   footer += "<td class='tg-bottomborder'><img src='" +
      //   urlapprover2_signage +
      //   '\' width="100px" height="50px" ></img> <br/> ' + approver2_sign_name + ' </td>';
      // else
      //   footer += "<td class='tg-bottomborder'> </td>";

      footer += "</tr>";
      footer += "</tbody>";
      footer += "</table>";

      var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
      xml += "<pdfset>";
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

      if (!isapproved) {
        xml += "<macrolist>";
        xml += "<macro id=\"watermark\">";
        xml += "<p rotate=\"-45\" font-size=\"178pt\" color=\"#C0C0C0\">";
        xml += "DRAFT";
        xml += "</p>";
        xml += "</macro>";
        xml += "</macrolist>";
      }

      xml += "</head>"
      //
      xml += "<body font-size='9' style='font-family: Tahoma,sans-serif;height: 29.7cm;width: 21cm;' " +
        "header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='7%' ";
      if (!isapproved) {
        xml += "background-macro=\'watermark\' ";
      }
      xml += ">";
      xml += body;
      xml += "\n</body>\n</pdf>";

      xml = xml.replace(/ & /g, ' &amp; ');

      /*function replaceAll(str, find, replace) {
      	function escapeRegExp(string) {
      		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
      	}
      	return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
      }*/

      //xml = replaceAll(xml,'&','&amp;');//xml.replace('&','&amp');

      //log.debug("xml", xml);
      /*var objTxtFile = file.create({
      							  name : 'test.xml',
      							  fileType : file.Type.XMLDOC,
      							  contents : xml
      					});
      objTxtFile.folder = 1213;
      objTxtFile.isOnline = false;
      var intFileId = objTxtFile.save();
      var objTxtFile = file.load({id : intFileId});*/


      var filepdf1 = file.load({
        id: 'PO Term/PO Term & Condition.pdf'
      });
      var urlpdf1 = appurl + filepdf1.url.replace(/&/g, "&amp;");
      log.debug("urlpdf1", urlpdf1);

      if (urlpdf1) {
        xml += "<pdf>";
        xml += "<body font-size='9' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' >";
        xml += "\n</body>\n</pdf>";
        xml += '<pdf src="' + urlpdf1 + '"></pdf>';
      }

      xml += "</pdfset>";

      //xml = xml.replace(/&/g, '&amp;');

      if (isEmail == 1) {
        var pdfFiletoEmail = render.xmlToPdf({
          xmlString: xml
        });
        pdfFiletoEmail.name = 'Purchase Order #' + recid + ' - ' + entityname + '.pdf';
        //pdfFiletoEmail.save();

        var recEmailTemplate = search.create({
          type: 'emailtemplate',
          columns: ['subject', 'internalid'],
          filters: [{
            name: 'name',
            operator: search.Operator.IS,
            values: 'PO Awarded Email Template'
          }],
        }).run().getRange({
          start: 0,
          end: 1
        });

        var Email_subject = recEmailTemplate[0].getValue('subject') || '';

        var emailtmplid = recEmailTemplate[0].getValue('internalid');
        var emailtmplRecord = record.load({
          type: 'emailtemplate',
          id: emailtmplid,
          isDynamic: true,
        });
        /*Date.prototype.addDays = function(days) {
        	var date = new Date(this.valueOf());
        	date.setDate(date.getDate() + days);
        	return date;
        }

        */
        var today = new Date();
        today.setDate(today.getDate() + 2);

        var hari = today.getDate();
        var bulan = today.getMonth() + 1;
        var tahun = today.getFullYear();
        var dayslater = hari + '/' + bulan + '/' + tahun;

        log.debug("dayslater", dayslater);

        log.debug("recEmailTemplate", recEmailTemplate);
        var Email_content = emailtmplRecord.getValue('content') || '';
        Email_content = Email_content.replace('${vendor.companyName}', entityname);
        Email_content = Email_content.replace('${vendor.companyName}', entityname);
        Email_content = Email_content.replace('${transaction.custbody_abj_rfq_no}', po_rfq_no);
        Email_content = Email_content.replace('${transaction.custbody_abj_rfq_date}', po_rfq_date);
        Email_content = Email_content.replace('${transaction.custbody_abj_po_proj_name}', po_rfq_proj_name);
        Email_content = Email_content.replace('${transaction.custbody_abj_quot_refno}', po_rfq_quote_refno);
        Email_content = Email_content.replace('${transaction.custbody_abj_quot_ref_date}', po_rfq_quote_refdate);
        Email_content = Email_content.replace('${transaction.currency}', currency);
        Email_content = Email_content.replace('${transaction.total}', total);
        Email_content = Email_content.replace("{2 days from today's date}", dayslater);

        Email_subject = Email_subject.replace("${companyInformation.companyName}", legalname);
        Email_subject = Email_subject.replace("${transaction@title}", 'Purchase Order');
        Email_subject = Email_subject.replace("${transaction.tranId}", recid);
        //${companyInformation.companyName}: ${transaction@title} #${transaction.tranId}

        var html = '<html> <body><h2>Process Email PO Result</h2>';
        var currentuser = runtime.getCurrentUser().id;
        var err_msg = '';
        po_buyer = po_buyer ? po_buyer : null;
        log.debug("po_buyer", po_buyer);
        try {
          if (vendor_email) {
            var emailSend = email.send({
              author: currentuser,
              recipients: vendor_email,
              cc: [po_buyer],
              subject: Email_subject,
              body: Email_content,
              attachments: [pdfFiletoEmail],
              relatedRecords: {
                transactionId: recid,
              }
            });
            html += '<h3>Succesfully Email PO #' + recid + ' to Vendor: ' + entityname + '</h3>';
          } else {
            err_msg = 'Vendor ' + entityname + ' has no defined email';
          }
        } catch (e) {
          err_msg = 'Failed to email po #' + recid + ' ' + e.name + ': ' + e.message + '<br/>';
          log.debug("Error messages", err_msg);
        }
        if (err_msg) {
          html += '<h3>Failed to email PO #' + recid + '</h3>';
          html += '<h3>Error Messages:<br/> ' + err_msg + '</h3>';
        }

        html += '<input type="button" value="OK" onclick="history.back()">';
        html += '</body></html>';
        context.response.write(html);

        log.debug("send email", emailSend);

      } else {
        response.renderPdf({
          xmlString: xml
        });
      }

    }

    function split_line(str) {
      var eachLine = str.split('\n');
      var str_split = '';
      var return_var = [];
      for (var i = 0, l = eachLine.length; i < l; i++) {
        if (str_split) str_split += '<br/>';
        str_split += eachLine[i];
      }
      return_var.push({
        str: str_split,
        line_cnt: eachLine.length,
      });
      return return_var;
    }

    function getSublistItem(context, poRecord) {
      var itemCount = poRecord.getLineCount({
        sublistId: 'item'
      });
      var amountTotal = 0;
      var body = "";
      var ln_count = itemCount;
      var return_var = [];
      for (var index = 0; index < itemCount; index++) {
        var item_id = poRecord.getSublistText({
          sublistId: 'item',
          fieldId: 'item',
          line: index
        });
        var item_desc = poRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'description',
          line: index
        });
        var desc = split_line(item_desc);
        item_desc = desc[0].str;
        var desc_line_cnt = desc[0].line_cnt;

        var custcol_abj_del_address = poRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_abj_del_address',
          line: index
        }) || '';
        if (custcol_abj_del_address)
          custcol_abj_del_address = 'Delivery Address: ' + custcol_abj_del_address;
        var custcol_abj_del_date = poRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_abj_del_date',
          line: index
        }) || '';
        if (custcol_abj_del_date)
          custcol_abj_del_date = 'Delivery Date: ' + format.format({
            value: custcol_abj_del_date,
            type: format.Type.DATE
          });

        var quantity = poRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: index
        });
        quantity = format.format({
          value: quantity,
          type: format.Type.FLOAT
        });

        var units = poRecord.getSublistText({
          sublistId: 'item',
          fieldId: 'units',
          line: index
        });
        var rate = poRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          line: index
        });
        rate = format.format({
          value: rate,
          type: format.Type.CURRENCY
        });
        var amount = poRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          line: index
        });
        amount = format.format({
          value: amount,
          type: format.Type.CURRENCY
        });
        //2
        body += "<tr>";
        var description = item_id;
        if (item_desc) {
          description += '<br/>' + item_desc;
          ln_count += desc_line_cnt;
        }
        if (custcol_abj_del_address) {
          description += '<br/>' + custcol_abj_del_address;
          ln_count++;
        }
        if (custcol_abj_del_date) {
          description += '<br/>' + custcol_abj_del_date;
          ln_count++;
        }
        body += "<td style=\"align: left;font-size:10px;border-bottom: none;\">" + description + "&nbsp;</td>";
        body += "<td style=\"align: right;font-size:10px;border-bottom: none;\">" + quantity + "&nbsp;</td>";
        body += "<td style=\"align: right;font-size:10px;border-bottom: none;\">" + units + "&nbsp;</td>";
        body += "<td style=\"align: right;font-size:10px;border-bottom: none;\">" + rate + "&nbsp;</td>";
        body += "<td style=\"align: right;font-size:10px;border-bottom: none;\">" + amount + "&nbsp;</td>";
        body += "</tr>";
      }
      log.debug("ln_count item", ln_count);
      return_var.push({
        str: body,
        line_cnt: ln_count,
      });
      return return_var;
    }

    function getSublistExpense(context, poRecord) {
      var expenseCount = poRecord.getLineCount({
        sublistId: 'expense'
      });
      var amountTotal = 0;
      var body = "";
      var ln_count = expenseCount;
      var return_var = [];
      for (var index = 0; index < expenseCount; index++) {
        var expense_id = poRecord.getSublistText({
          sublistId: 'expense',
          fieldId: 'category',
          line: index
        });
        var expense_desc = poRecord.getSublistValue({
          sublistId: 'expense',
          fieldId: 'memo',
          line: index
        });
        var desc = split_line(expense_desc);
        expense_desc = desc[0].str;
        var desc_line_cnt = desc[0].line_cnt;

        var quantity = 1;
        var units = '';
        var rate = poRecord.getSublistValue({
          sublistId: 'expense',
          fieldId: 'amount',
          line: index
        });
        rate = format.format({
          value: rate,
          type: format.Type.CURRENCY
        });
        var amount = poRecord.getSublistValue({
          sublistId: 'expense',
          fieldId: 'amount',
          line: index
        });
        amount = format.format({
          value: amount,
          type: format.Type.CURRENCY
        });
        //2
        body += "<tr>";
        var description = expense_id;
        if (expense_desc) {
          description += '<br/>' + expense_desc;
          ln_count += desc_line_cnt;
        }
        body += "<td style=\"align: left;font-size:10px;border-bottom: none;\">" + description + "&nbsp;</td>";
        body += "<td style=\"align: right;font-size:10px;border-bottom: none;\">" + quantity + "&nbsp;</td>";
        body += "<td style=\"align: right;font-size:10px;border-bottom: none;\">" + units + "&nbsp;</td>";
        body += "<td style=\"align: right;font-size:10px;border-bottom: none;\">" + rate + "&nbsp;</td>";
        body += "<td style=\"align: right;font-size:10px;border-bottom: none;\">" + amount + "&nbsp;</td>";
        body += "</tr>";
      }
      log.debug("ln_count expense", ln_count);
      return_var.push({
        str: body,
        line_cnt: ln_count,
      });
      return return_var;
    }

    // function getTotal(context, poRecord){
    // var itemCount = poRecord.getLineCount({sublistId : 'item'});
    // var amountTotal = 0;
    // var body = "";
    // // var arr = new Array();
    // // var subArr = new Array();
    // for(var index = 0; index < itemCount; index++){
    // var description = poRecord.getSublistValue({sublistId : 'item', fieldId : 'item_display', line : index});
    // var custcol_abj_del_address = poRecord.getSublistValue({sublistId : 'item' , fieldId : 'custcol_abj_del_address', line : index});
    // var custcol_abj_del_date = poRecord.getSublistValue({sublistId : 'item', fieldId : 'custcol_abj_del_date', line : index});
    // var quantity = poRecord.getSublistValue({sublistId : 'item', fieldId : 'quantity', line : index});
    // var units = poRecord.getSublistValue({sublistId : 'item', fieldId : 'units', line : index});
    // var rate = poRecord.getSublistValue({sublistId : 'item', fieldId : 'rate', line : index});
    // var amount = poRecord.getSublistValue({sublistId : 'item', fieldId : 'amount', line : index});

    // amountTotal += parseFloat(amount);
    // }
    // var arr = [amountTotal];
    // return arr;
    // }
    return {
      onRequest: onRequest,
    };
  });