/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// PRINT RFQ to PDF
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config',
    'N/format', 'N/url', 'N/runtime', 'N/email', 'N/error'
  ],
  function(render, search, record, log, file, http, config, format, url, runtime, email, error) {

    function onRequest(context) {
      var rfqId = context.request.parameters.id;
      var isEmail = context.request.parameters.isemail;
      var isemailunawarded = context.request.parameters.isemailunawarded;

      log.debug("rfqId", rfqId);
      log.debug("isemailunawarded", isemailunawarded);

      var html = PrintAndEmail(rfqId, isEmail, context, isemailunawarded);

      context.response.write(html);
    }

    function PrintAndEmail(rfqId, isEmail, context, var_isemailunawarded) {
      var rfqRecord = record.load({
        type: 'customrecord_abj_rfq',
        id: rfqId,
        isDynamic: true,
      });
      var rfqNo = rfqRecord.getValue('custrecord_abj_rfq_id') || rfqId;
      var rfqProjName = rfqRecord.getText('custrecord_abj_rfq_projname') || '';
      var rfqProjDesc = rfqRecord.getValue('custrecord_abj_rfq_projdesc') || '';
      var rfqBidCloseDateTime = rfqRecord.getValue('custrecord_abj_rfq_bidclose_date');
      if (rfqBidCloseDateTime)
        rfqBidCloseDateTime = format.format({
          value: rfqBidCloseDateTime,
          type: format.Type.DATETIME
        });
      var Buyerid = rfqRecord.getValue('custrecord_abj_rfq_buyer');
      var rfqVersion = rfqRecord.getValue('custrecord_abj_rfq_version');
      var rfqAttchmntFileId = rfqRecord.getValue('custrecord_abj_rfq_attachment_blast');
      var rfqAttchmntFile;
      if(!Buyerid){
        var html = '<html> <body><h2>Insufficient Data</h2>';
        html += '<h3>Please input Buyer in RFQ record #'+rfqNo+ '</h3>';
        html += '<input type="button" value="OK" onclick="history.back()">';
        html += '</body></html>';    
		   return html;
      }
        if (rfqAttchmntFileId)
        rfqAttchmntFile = file.load({
          id: rfqAttchmntFileId
        });

      var todaydate = new Date();
      todaydate = format.format({
        value: todaydate,
        type: format.Type.DATE
      });

      var empRecord = record.load({
        type: 'employee',
        id: Buyerid,
        isDynamic: true,
      });
      var Buyer_email = empRecord.getValue('email');

      var companyInfo = config.load({
        type: config.Type.COMPANY_INFORMATION
      });
      var isemailunawarded = var_isemailunawarded;

      var legalname = companyInfo.getValue('legalname');
      var logo = companyInfo.getValue('formlogo');
      var filelogo = file.load({
        id: logo
      });
      //get url
      var comp_email = companyInfo.getValue('custrecord_abj_quotation_email');
      var urlLogo = filelogo.url.replace(/&/g, "&amp;");
      var appurl = companyInfo.getValue('appurl');
      var err_messages = '';

      var vendor_line_count = rfqRecord.getLineCount({
        sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq'
      });

      log.debug("vendor_line_count", vendor_line_count);

      //		if (vendor_line_count == 0) {
      //			var alert_notmore = {title: 'Vendor validation', message: 'No Vendor in vendor list,please input some vendor(s) before print/email'};
      //			dialog.alert(alert_notmore);
      //			window.alert('No Vendor in vendor list,please input some vendor(s) before print/email');
      //			return;
      //		}

      var recFolder = search.create({
        type: 'folder',
        columns: ['internalid'],
        filters: [{
          name: 'name',
          operator: search.Operator.IS,
          values: 'RFQ Print Out'
        }],
      }).run().getRange({
        start: 0,
        end: 1
      });

      var folderid = 0;
      if (recFolder)
        folderid = recFolder[0].getValue('internalid');
      var success_create_count = 0;
      var failed_count = 0;
      log.debug("recFolder", recFolder);

      var emailtemplatename = 'RFQ Blast email template';
      if (isemailunawarded)
        emailtemplatename = 'RFQ Rejected Email Template';

      var recBlastEmailTemplate = search.create({
        type: 'emailtemplate',
        columns: ['subject', 'internalid'],
        filters: [{
          name: 'name',
          operator: search.Operator.IS,
          values: emailtemplatename
        }],
      }).run().getRange({
        start: 0,
        end: 1
      });
      log.debug("recBlastEmailTemplate", recBlastEmailTemplate);

      var blastEmail_subject = '';
      var blastEmail_content = '';
      if (recBlastEmailTemplate) {
        blastEmail_subject = recBlastEmailTemplate[0].getValue('subject') || '';
        if (blastEmail_subject) {
          if (isemailunawarded)
            blastEmail_subject = blastEmail_subject.replace('{custrecord_abj_rfq_id}', rfqNo);
          if (isEmail)
            blastEmail_subject = blastEmail_subject.replace('{custrecord_abj_rfq_projname}', rfqProjName);
          blastEmail_subject = blastEmail_subject.replace('${companyInformation.companyName}', legalname);
        }
        var emailtmplid = recBlastEmailTemplate[0].getValue('internalid');
        var emailtmplRecord = record.load({
          type: 'emailtemplate',
          id: emailtmplid,
          isDynamic: true,
        });
      }

      var printStr = 'Print';
      if (isEmail)
        printStr = 'Email';
      if (isemailunawarded)
        printStr = 'Email Unawarded Vendor';
      var listvendor = [];
      var text_for_vendor_url = '';

      for (var i = 0; i < vendor_line_count; i++) {
        try {

          blastEmail_content = emailtmplRecord.getValue('content') || '';

          isemailunawarded = var_isemailunawarded;

          var vendor_id = rfqRecord.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
            fieldId: 'custrecord_abj_rfq_vdr',
            line: i
          });

          if (!vendor_id) {
            var error_no_vendor = error.create({
              name: 'Send RFQ ' + printStr,
              message: 'No vendor id in vendor line ' + i,
              notifyOff: false
            });
            throw error_no_vendor;
          }


          var vendorRecord = record.load({
            type: record.Type.VENDOR,
            id: vendor_id,
            isDynamic: false,
          });
          var vendor_name = vendorRecord.getValue('companyname') || vendor || '';
          vendor_name = vendor_name.replace(/&/g, "&amp;");

          var vendor_phone = rfqRecord.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
            fieldId: 'custrecord_abj_rfq_vdr_phone',
            line: i
          }) || vendorRecord.getValue('phone') || '';

          var vendor_altphone = vendorRecord.getValue('altphone');

          var vendor_email = rfqRecord.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
            fieldId: 'custrecord_abj_rfq_vdr_email',
            line: i
          }) || vendorRecord.getValue('email') || '';

          var vendor_attention = rfqRecord.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
            fieldId: 'custrecord_abj_rfq_vdr_attn',
            line: i
          }) || vendorRecord.getValue('custentity_abj_attn') || '';

          var vendor_memo = rfqRecord.getSublistText({
            sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
            fieldId: 'custrecord_abj_rfq_vdr_memo',
            line: i
          });

          var currency = rfqRecord.getText("custrecord_abj_rfq_currency");

          var rfqQtRefNo = rfqRecord.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
            fieldId: 'custrecord_abj_rfq_vdr_qtno',
            line: i
          }) || '';
          var rfqQtDate = rfqRecord.getSublistValue({
            sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
            fieldId: 'custrecord_abj_rfq_qtdate',
            line: i
          }) || '';
          log.debug('rfqQtDate', rfqQtDate);
          if (rfqQtDate)
            rfqQtDate = format.format({
              value: rfqQtDate,
              type: format.Type.DATE
            });
          log.debug('rfqQtDate2', rfqQtDate);

          var response = context.response;
          var xml = "";
          var header = "";
          var body = "";
          var headerHeight = '15%';
          var style = "";
          var footer = "";
          var pdfFile = null;
          if (!isemailunawarded) {
            style += "<style type='text/css'>";
            style += ".tg  {border-collapse:collapse;border-spacing:10;width:100%;}";
            style += ".tg td{border-color:black;border-style:solid;border-width:0.5px;font-family:Arial, sans-serif;font-size:9px;overflow:hidden;word-break:normal;}";
            style += ".tg-body  {border-collapse:collapse;border-spacing:10;width:100%;height:520px;overflow:hidden;border-bottom:1px solid black;}";
            style += ".tg-body td{border-color:black;border-style:solid;border-width:0.5px;font-family:Arial, sans-serif;font-size:9px;overflow:hidden;word-break:normal;}";
            // style += ".tg-body tr:not:(last-child) {height:1px;}";
            // style += ".tg-body tr:last-child {height:auto;}";
            style += ".tg-body .tg-baris_right{font-size:10px;align: right;border-top: none;}";
            style += ".tg-body .tg-baris_left{font-size:10px;align: left;border-top: none;}";
            style += ".tg-body .tg-noborder{font-size:10px;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg-body .tg-headershipto{font-size:12px;font-weight: bold;align: center;border-color:black;border-style:solid;border-width:0.5px}";
            style += ".tg .tg-headerlogo{border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-headerrow_bold_big_font{font-size:24px;font-weight: bold;border-right: none;border-left: none;border-top: none;border-bottom: none;vertical-align:bottom;}";
            style += ".tg .tg-headerrow{align: left;font-size:11px;word-break:break-all;}";
            style += ".tg .tg-noborder_bigfont{font-size:17px;font-weight: bold;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-noborder_12font{font-size:12px;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-noborder{font-size:10px;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-noborder_right{align: right;font-size:10px;color:red;border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-kolomnomorpo{width:15%;font-size:12px;font-weight: bold;align: right;vertical-align:center;}";
            style += ".tg .tg-headershipto{font-size:12px;font-weight: bold;align: center;}";
            style += ".tg .tg-judultotal{font-size:11px;font-weight: bold;align: left;}";
            style += ".tg .tg-kolomtotal{font-size:11px;font-weight: bold;align: right;}";
            style += ".tg .tg-baris_right{font-size:10px;align: right;border-top: none;}";
            style += ".tg .tg-baris_left{font-size:10px;align: left;border-top: none;}";
            style += ".tg .tg-baris_left_border{font-size:11px;align: left;}";
            style += ".tg .tg-kolomdatapo{width:25%;align: left;font-size:10px;}";
            style += ".tg .tg-kolomshipto{align: center;font-size:10px;}";
            style += ".tg .tg-bottomborder{border-right: none;border-left: none;border-top: none;}";
            style += ".tg .tg-blankrow{font-size:10px;align: right;border-top: none;border-bottom: none;}";
            style += ".div .d-word_rap{word-break:break-all;}";
            style += "</style>";

            header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            header += "<tbody>";

            header += "<tr>";
            header += "<td class='tg-headerlogo' style='width:15%;vertical-align:bottom;'><img src='" + urlLogo +
              '\' width="100px" height="50px" ></img> </td>';
            header += "<td class='tg-headerrow_bold_big_font' colspan='3'>" + legalname + "</td>";
            header += "</tr>";

            header += "<tr>";
            header += "<td class='tg-headerrow' >Company:</td>";
            header += "<td class='tg-headerrow' colspan='3'>" + vendor_name + "</td>";
            header += "</tr>";
            header += "<tr>";
            header += "<td class='tg-headerrow'>Attn.To:</td>";
            header += "<td class='tg-headerrow' colspan='3'>" + vendor_attention + "</td>";
            header += "</tr>";
            header += "<tr>";
            header += "<td class='tg-headerrow' >Hp No:</td>";
            header += "<td class='tg-headerrow' style='width:20%'>" + vendor_phone + "</td>";
            header += "<td class='tg-headerrow' style='width:20%'>Tel No: " + vendor_altphone + "</td>";
            header += "<td class='tg-headerrow' style='width:43%'>Email: " + vendor_email + "</td>";
            header += "</tr>";
            header += "<tr>";
            header += "<td class='tg-noborder_12font' colspan='3'><u>REQUEST FOR QUOTATION FOR " + rfqProjName + "</u></td>";
            header += "<td class='tg-noborder_right' >(Version " + rfqVersion + ")</td>";
            header += "</tr>";
            header += "<tr>";
            header += "<td class='tg-noborder' colspan='3'>Refer to above mentioned, please quote us the following: -</td>";
            header += "</tr>";

            header += "</tbody>";
            header += "</table>";

            //===================================================================//
            body += "<table class='tg-body' width=\"100%\" style=\"table-layout:fixed;\">";
            
            //1
            //space
            // body += "<tr>";
            // body += "<td class='tg-noborder' style='width:5%'></td>";
            // body += "<td class='tg-noborder' style='width:48%'></td>";
            // body += "<td class='tg-noborder' style='width:12%'></td>";
            // body += "<td class='tg-noborder' style='width:15%'></td>";
            // body += "<td class='tg-noborder' style='width:20%'></td>";
            // body += "</tr>";
            // body += "<tr>";
            // body += "<td class='tg-noborder' ></td>";
            // body += "<td class='tg-noborder' ></td>";
            // body += "<td class='tg-noborder' ></td>";
            // body += "<td class='tg-noborder' ></td>";
            // body += "<td class='tg-noborder' ></td>";
            // body += "</tr>";
            //tabel
            body += "<thead>";
            body += "<tr style='height:1px;'>";
            body += " <th class='tg-headershipto' style='width:5%'>No.</th>";
            body += " <th class='tg-headershipto' style='width:48%'>Description</th>";
            body += " <th class='tg-headershipto' style='width:12%'>quantity</th>"
            body += " <th class='tg-headershipto' style='width:15%'>Unit Price<br/>(" + currency + ")</th>"
            body += " <th class='tg-headershipto' style='width:20%'>Total Price<br/>(" + currency + ")</th>"
            body += "</tr>";
            body += "</thead>";
            body += "<tbody>";
            body += getSublistItem(context, rfqRecord);
            body += getSublistExpenses(context, rfqRecord);
            // var item_str = getSublistItem(context, rfqRecord);
            // var item_str_cnt = item_str[0].line_cnt;
            // body += item_str[0].str;
            //
            // var expense_str = getSublistExpenses(context, rfqRecord);
            // var expense_str_cnt = expense_str[0].line_cnt;
            // body += expense_str[0].str;
            //
            // var blankrow_cnt = 25 - item_str_cnt - expense_str_cnt;
            // for (var index = 0; index < blankrow_cnt; index++) {
            //   body += "<tr> ";
            //   var xmlclass = 'tg-blankrow';
            //   if (index + 1 == blankrow_cnt) {
            //     xmlclass = 'tg-lastblankrow';
            //   }
            //   body += "<td class='" + xmlclass + "' style='width:40%'>&nbsp;</td>";
            //   body += "<td class='" + xmlclass + "' style='width:15%'>&nbsp;</td>";
            //   body += "<td class='" + xmlclass + "' style='width:10%'>&nbsp;</td>";
            //   body += "<td class='" + xmlclass + "' style='width:15%'>&nbsp;</td>";
            //   body += "<td class='" + xmlclass + "' style='width:20%'>&nbsp;</td>";
            //   body += "</tr>";
            // }

            body += "</tbody>";
            body += "</table>";
            //===================================================================//

            //===================================================================//
            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<tbody>";

            body += getSublistAdtInfo(context, rfqRecord);
            body += "</tbody>";
            body += "</table>";
            //===================================================================//

            footer += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            footer += "<tbody>";

            footer += "<tr>";
            footer += "<td class='tg-noborder_12font' style='width:65%'><br/>*Kindly e-mail your quotation to:<br/>" + Buyer_email +
              "<br/><br/>Submission Deadline : " + rfqBidCloseDateTime + "</td>";
            footer += "<td class='tg-judultotal' style='width:35%'>Price Confirm By:<br/>" +
              "Sign:<br/> " +
              "<br/> " +
              "<br/> " +
              "<br/> " +
              "<br/> " +
              "Full Name:<br/> " +
              "Date:<br/> " +
              "Comp. Stamp:<br/> " +
              "<br/> " +
              "<br/> " +
              "</td>";
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
            xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='15%'>";
            xml += body;
            xml += "\n</body>\n</pdf>";

            //response.renderPdf({ xmlString : xml });
            xml = xml.replace(/ & /g, ' &amp; ');

            pdfFile = render.xmlToPdf({
              xmlString: xml
            });

            pdfFile.name = 'Request for Quotation #' + rfqId + ' - ' + vendor_name + '.pdf';
            pdfFile.folder = folderid;
            pdfFile.isOnline = true;
            var fileId = pdfFile.save();
            /*var fileRecord = record.load({
            	type : 'file',
            	id : fileId,
            	isDynamic : false,
            });*/
            var fileObj = file.load({
              id: fileId
            });

            log.debug('save pdf file to file', fileId);
            var urlfile = appurl + fileObj.url;
            log.debug('urlfile', urlfile);
            //log.debug('attached record to rfq', file_attch_id);
            /*var file_attch_id = record.attach({
            record: {
            	type: 'file',
            	id: fileId
            },
            to: {
            	  type: 'customrecord_abj_rfq',
            	  id: rfqId
            	}
            });*/
            rfqRecord.selectLine({
              sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
              line: i
            });
            rfqRecord.setCurrentSublistValue({
              sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq',
              fieldId: 'custrecord_abj_rfq_print_out_file',
              value: urlfile
            });
            rfqRecord.commitLine({
              sublistId: 'recmachcustrecord_abj_rfq_vdr_rfq'
            });
            //log.debug('attached record to rfq', file_attch_id);
          }

          if (var_isemailunawarded) {
            log.debug('vendor_name', vendor_name);
            var findvendorunawarded = rfqRecord.findSublistLineWithValue({
              sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
              fieldId: 'custrecord_abj_rfq_item_award_vdr',
              value: vendor_id,
            });
            log.debug('findvendorunawarded item', findvendorunawarded);

            isemailunawarded = findvendorunawarded < 0;

            if (isemailunawarded) {
              findvendorunawarded = rfqRecord.findSublistLineWithValue({
                sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
                fieldId: 'custrecord_abj_rfq_exp_award_vdr',
                value: vendor_id,
              });
              log.debug('findvendorunawarded exps', findvendorunawarded);

              isemailunawarded = findvendorunawarded < 0;
            }
            log.debug('isemailunawarded', isemailunawarded);

            if (!isemailunawarded) continue;
          };

          log.debug('isEmail', isEmail);
          if (isEmail || isemailunawarded) {
            if (!vendor_email) {
              var error_no_email = error.create({
                name: 'Send RFQ Email',
                message: 'No email for vendor ' + vendor_name,
                notifyOff: false
              });
              throw error_no_email;
            }
            var currentuser = runtime.getCurrentUser().id;
            log.debug("currentuser", currentuser);
            log.debug('pdf file to email', pdfFile);
            if (isemailunawarded) {
              blastEmail_content = blastEmail_content.replace('${vendor.companyName}', vendor_name);
              //if (rfqQtRefNo)
              blastEmail_content = blastEmail_content.replace('{custrecord_abj_rfq_vdr_qtno}', rfqQtRefNo);
              if (!rfqQtRefNo)
                blastEmail_content = blastEmail_content.replace('ref. no.', '');
              //if (rfqQtDate)
              blastEmail_content = blastEmail_content.replace('{custrecord_abj_rfq_vdr_qtdate}', rfqQtDate);
              if (!rfqQtDate)
                blastEmail_content = blastEmail_content.replace('dated', '');
              //if (rfqProjName)
              blastEmail_content = blastEmail_content.replace('{custrecord_abj_rfq_projname}', rfqProjName);
              if (!rfqProjName)
                blastEmail_content = blastEmail_content.replace('for the', '');
            }
            if (isEmail) {
              blastEmail_content = blastEmail_content.replace('${vendor.companyName}', vendor_name);
              if (rfqNo)
                blastEmail_content = blastEmail_content.replace('{custrecord_abj_rfq_id}', rfqNo);
              //if (rfqProjName)
              blastEmail_content = blastEmail_content.replace('{custrecord_abj_rfq_projname}', rfqProjName);
              if (!rfqProjName)
                blastEmail_content = blastEmail_content.replace('for the project', '');
              //if (rfqProjDesc)
              blastEmail_content = blastEmail_content.replace('{custrecord_abj_rfq_projdesc}', rfqProjDesc);
              if (!rfqProjDesc)
                blastEmail_content = blastEmail_content.replace('Project Description :', '');

              if (rfqBidCloseDateTime)
                blastEmail_content = blastEmail_content.replace('{custrecord_abj_rfq_bidclose_date}', rfqBidCloseDateTime);
              log.debug("Buyer_email", Buyer_email);
              if (Buyer_email)
                blastEmail_content = blastEmail_content.replace("{Buyer's Email Address}", Buyer_email);
                blastEmail_content = blastEmail_content.replace("${user.email}", Buyer_email);
              blastEmail_content = blastEmail_content.replace("{today}", todaydate);
            }
            log.debug("blastEmail_content", blastEmail_content);
            log.debug("blastEmail_subject", blastEmail_subject);
            log.debug("vendor_email", vendor_email);
            var emailSend = null
            var emailattchments = [];
            if (pdfFile)
              emailattchments.push(pdfFile);
            if (rfqAttchmntFile)
              emailattchments.push(rfqAttchmntFile);
            if (emailattchments.length > 0)
              emailSend = email.send({
                author: currentuser,
                recipients: vendor_email,
                subject: blastEmail_subject,
                body: blastEmail_content,
                attachments: emailattchments //[pdfFile]
              });
            else
              emailSend = email.send({
                author: currentuser,
                recipients: vendor_email,
                subject: blastEmail_subject,
                body: blastEmail_content
              });

            log.debug("send email", emailSend);
          };
          listvendor.push({
            vendor: vendor_name,
          });

          success_create_count += 1;

          if (text_for_vendor_url) {
            text_for_vendor_url += '05';
          }
          text_for_vendor_url += vendor_id + '%';

        } catch (e) {
          var err_msg = 'Failed to ' + printStr + ' RFQ #' + rfqId + ' for vendor ' + vendor_name + ' ' + e.name + ': ' + e.message + '<br/>';
          log.debug("Error messages", err_msg);
          failed_count += 1;
          err_messages += '&nbsp;' + err_msg;
        }
      }

      if (!isemailunawarded)
        rfqRecord.save();

      text_for_vendor_url = text_for_vendor_url.slice(0, -1) + '&';

      var rfqURL = appurl + "/app/common/search/searchresults.nl?rectype=";
      //24%0525%0559&
      rfqURL += "484&searchtype=Custom&Custom_INTERNALID=" + rfqId + "&BEV_CUSTRECORD_ABJ_RFQ_VDR=" + text_for_vendor_url;
      rfqURL += "style=NORMAL&report=&grid=&searchid=749&sortcol=Custom_ID_raw&sortdir=ASC&csv=";
      rfqURL += "HTML&OfficeXML=F&pdf=&size=50&_csrf=l_L5pW7_D08Cy2yMo8eaaMQgUVkfO1XypMX52zNCavx6UfrKCATvBALowix7";
      rfqURL += "gyKT2MxP0MbZmJ_wue-m25aGzziekXRbQV-0CXeBhu_8ZV9bKf3DB_bzZhAt8fxXa6DDCE4tmFLNTup6Jj8-QUUcsT6CdYXp";
      rfqURL += "5lZ8_E2LLizjLxM%3D&twbx=F";

      /*var rfqURL = appurl+"/app/common/search/searchresults.nl?rectype=484&searchtype=";
      rfqURL += "Custom&Custom_INTERNALID="+rfqId+"&style=NORMAL&report=&grid=&searchid=724&sortcol=Custom_ID_raw&sortdir=";
      rfqURL += "ASC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=C6Jaa09ATlpIZdWhEFxOslCH7wuDjl411fsRdxNP7Jdxm7NpNZoU3knUmPO8yyIAB8URAjplI5m-";
      rfqURL += "73otYHAKlPapDIBEDqUeNKtexo1myRH9MyCLdWsmJG1aJtUVYkMe6TsDr0Z1RAIY5b0EZg8Ww2Ho2drCofXwzTb9rqN0Ics%3D&twbx=F";
      */
      var html = '<html> <body><h2>Process RFQ ' + printStr + '</h2>';

      for (var i in listvendor) {
        html += "<h3>Process " + printStr + " for Vendor: " + listvendor[i].vendor + " </h3>";
      }

      if (success_create_count) {
        html += '<h3>Succesfully ' + printStr + ' RFQ for <a href="' + rfqURL + '">' + success_create_count + '</a> Vendor(s)</h3>';
      }
      if (failed_count > 0) {
        html += '<h3>Failed to ' + printStr + ' ' + failed_count + ' RFQ record</h3>';
        html += '<h3>Error Messages:<br/> ' + err_messages + '</h3>';
      }

      rfqUrl = url.resolveRecord({
        recordId: rfqId,
        recordType: 'customrecord_abj_rfq'
      });

      html += '<input type="button" value="OK" onclick="history.back()">';
      //html += '<input type="button" onclick="location.href="' + rfqUrl + '"; value="OK" />';
      html += '</body></html>';

      return html;
    }

    function getSublistItem(context, rfqRecord) {
      var itemCount = rfqRecord.getLineCount({
        sublistId: 'recmachcustrecord_abj_rfq_item_rfq'
      });
      var ExpCount = rfqRecord.getLineCount({
        sublistId: 'recmachcustrecord_abj_rfq_exp_rfq'
      });
      var body = "";
      for (var index = 0; index < itemCount; index++) {
        var line_No = index + 1 + '.';
        var item_id = rfqRecord.getSublistText({
          sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
          fieldId: 'custrecord_abj_rfq_item_name',
          line: index
        });
        var item_desc = rfqRecord.getSublistValue({
          sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
          fieldId: 'custrecord_abj_rfq_item_desc',
          line: index
        });
        item_desc = split_line(item_desc);

        var quantity = rfqRecord.getSublistValue({
          sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
          fieldId: 'custrecord_abj_rfq_item_qty',
          line: index
        });
        var units = rfqRecord.getSublistText({
          sublistId: 'recmachcustrecord_abj_rfq_item_rfq',
          fieldId: 'custrecord_abj_rfq_item_units',
          line: index
        });
        var styleTR ='height:1px;';
        if((ExpCount == 0) && (index == (itemCount - 1))){
          styleTR = 'height:auto;';
        }
        body += "<tr style='"+styleTR+"'>";
        var description = item_id;
        if (item_desc)
          description += '<br/>' + item_desc;
        body += "<td class='tg-baris_left'>" + line_No + "&nbsp;</td>";
        body += "<td class='tg-baris_left'>" + description + "&nbsp;</td>";
        body += "<td class='tg-baris_right'>" + quantity + "&nbsp;</td>";
        var pricecomment = 'Please quote your price in the listing according to the item required';
        if (index > 0)
          pricecomment = '';
        var no_border_bottom = "style='border-bottom: none;'";
        if ((ExpCount == 0) && (index == itemCount - 1)) no_border_bottom = '';
        body += "<td class='tg-baris_left' " + no_border_bottom + ">" + pricecomment + "</td>";
        body += "<td class='tg-baris_left' " + no_border_bottom + ">&nbsp;</td>";
        body += "</tr>";
      }
      return body;
    }

    function split_line(str) {
      var eachLine = str.split('\n');
      var str_split = '';
      for (var i = 0, l = eachLine.length; i < l; i++) {
        if (str_split) str_split += '<br/>';
        str_split += eachLine[i];
      }
      return str_split;
    }

    function getSublistExpenses(context, rfqRecord) {
      var ExpCount = rfqRecord.getLineCount({
        sublistId: 'recmachcustrecord_abj_rfq_exp_rfq'
      });
      var itemCount = rfqRecord.getLineCount({
        sublistId: 'recmachcustrecord_abj_rfq_item_rfq'
      });
      var body = "";
      for (var index = 0; index < ExpCount; index++) {
        var line_No = itemCount + index + 1 + '.';
        var item_id = rfqRecord.getSublistText({
          sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
          fieldId: 'custrecord_abj_rfq_exp_cat',
          line: index
        });
        var item_desc = rfqRecord.getSublistValue({
          sublistId: 'recmachcustrecord_abj_rfq_exp_rfq',
          fieldId: 'custrecord_abj_rfq_exp_desc',
          line: index
        });
        item_desc = split_line(item_desc);
        log.debug("item_desc", item_desc);
        var quantity = 1;
        var units = '';
        var styleTR ='height:1px;';
        if((index == (ExpCount - 1))){
          styleTR = 'height:auto;';
        }
        body += "<tr style='"+styleTR+"'>";
        var description = item_id;
        if (item_desc)
          description += '<br/>' + item_desc;
        body += "<td class='tg-baris_left'>" + line_No + "&nbsp;</td>";
        body += "<td class='tg-baris_left'>" + description + "&nbsp;</td>";
        body += "<td class='tg-baris_right'>" + quantity + "&nbsp;</td>";
        var pricecomment = 'Please quote your price in the listing according to the item required';
        if ((index + itemCount) > 0)
          pricecomment = '';
        var no_border_bottom = "style='border-bottom: none;'";
        if (index == ExpCount - 1) no_border_bottom = '';
        body += "<td class='tg-baris_left' " + no_border_bottom + ">" + pricecomment + "</td>";
        body += "<td class='tg-baris_left' " + no_border_bottom + ">&nbsp;</td>";
        body += "</tr>";
      }
      return body;
    }

    function getSublistAdtInfo(context, rfqRecord) {
      var AdtInfoCount = rfqRecord.getLineCount({
        sublistId: 'recmachcustrecord_abj_rfq_addinfo_rfq'
      });
      var body = "";
      for (var index = 0; index < AdtInfoCount; index++) {
        var AdtInfoName = rfqRecord.getSublistText({
          sublistId: 'recmachcustrecord_abj_rfq_addinfo_rfq',
          fieldId: 'custrecord_abj_rfq_addinfo_name',
          line: index
        });
        var AdtInfoDesc = rfqRecord.getSublistValue({
          sublistId: 'recmachcustrecord_abj_rfq_addinfo_rfq',
          fieldId: 'custrecord_abj_rfq_addinfo_desc',
          line: index
        });
        body += "<tr>";
        body += "<td class='tg-baris_left_border' style='width:53%'>" + AdtInfoName + "&nbsp;</td>";
        body += "<td class='tg-baris_left_border' style='width:47%'>" + AdtInfoDesc + "&nbsp;</td>";
        body += "</tr>";
      }
      return body;
    }

    return {
      onRequest: onRequest,
    };
  });