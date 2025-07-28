/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", "N/config", "N/format", "N/email", "N/runtime"], function (render, search, record, log, file, http, config, format, email, runtime) {
  function removeDecimalFormat(number) {
    return number.toString().substring(0, number.toString().length - 3);
  }
  function pembulatan(angka) {
    if (angka >= 0) {
      var bulat = Math.floor(angka);
      var desimal = angka - bulat;

      if (desimal >= 0.5) {
        return Math.ceil(angka);
      } else {
        return Math.floor(angka);
      }
    } else {
      return Math.ceil(angka);
    }
  }

  function removeDuplicates(array) {
    return array.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
    return x;
  }
  function numberWithCommasV2(x) {
   return format.format({ value : x, type : format.Type.CURRENCY});
  }

  function formatMonthYear(dateStr) {
    const [day, month, year] = dateStr.split('/'); // Split the string
    const date = new Date(`${year}-${month}-${day}`); // Convert to Date object

    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}
function getRateCard(item,complexityLevel,tier){

    try {
      
      const searchRateCard = search.create({
        type: 'customrecord_abj_ratecard',
        filters: [
          ['custrecord_abj_rate_card_item_name', 'is', item],
          'AND',
          ['custrecord_abj_ratecard_complexity_level', 'is', complexityLevel],
          'AND',
          ['custrecord_abj_rate_hour_type', 'is', tier]
        ],
        columns: [
          search.createColumn({
            join: 'custrecord_abj_ratecard_id',
            name: 'custrecord_abj_ratecard_hours'
          }),
          search.createColumn({
            join: 'custrecord_abj_ratecard_id',
            name: 'custrecord_abj_ratecard_hours_position'
          }),
          search.createColumn({
            join: 'custrecord_abj_ratecard_id',
            name: 'custrecord_abj_ratecard_hours_rate'
          }),
          search.createColumn({
            join: 'custrecord_abj_ratecard_id',
            name: 'custrecord_abj_ratecard_hours_total'
          }),
          search.createColumn({
            join: 'custrecord_abj_ratecard_id',
            name: 'custrecord_catsow_ratecard'
          }),
          search.createColumn({
            join: 'custrecord_abj_ratecard_id',
            name: 'custrecord_desc_hourratecard'
          }),
        ],
      });
  
      let results=[];
      searchRateCard.run().each(dt=>{
        let categorySOW = dt.getValue({join: 'custrecord_abj_ratecard_id',name : 'custrecord_catsow_ratecard'});
        let chekCategorySOW = results.find( res => res.categorySOW == categorySOW);
        let desc = dt.getValue({join: 'custrecord_abj_ratecard_id',name : 'custrecord_desc_hourratecard'});
        let position = dt.getValue({join: 'custrecord_abj_ratecard_id',name : 'custrecord_abj_ratecard_hours_position'});
        let positionText = dt.getText({join: 'custrecord_abj_ratecard_id',name : 'custrecord_abj_ratecard_hours_position'});
        let rate = dt.getValue({join: 'custrecord_abj_ratecard_id',name : 'custrecord_abj_ratecard_hours_rate'});
        let hours = dt.getValue({join: 'custrecord_abj_ratecard_id',name : 'custrecord_abj_ratecard_hours'});
        let total = dt.getValue({join: 'custrecord_abj_ratecard_id',name : 'custrecord_abj_ratecard_hours_total'});
        if(chekCategorySOW){
          chekCategorySOW.items.push({
            desc,
            position,
            positionText,
            rate,
            hours,
            total,
          })
        }else{
          results.push({
            categorySOW : categorySOW,
            categorySOWText : dt.getText({join: 'custrecord_abj_ratecard_id',name : 'custrecord_catsow_ratecard'}),
            items : [{
              desc,
              position,
              positionText,
              rate,
              hours,
              total,
            }]
          });
        }
        return true;
      });
  
      return results;
    } catch (error) {
      log.debug('Err search Rate Card', error);
      throw new Error(error);
    }
  }
  function findEmployee(id){

    if(!id){
      return {
        empName : '',
        jobTitle : '',
      }
    }
    var empRec = record.load({
      type : 'employee',
      id : id,
      isDynamic : true
    });


    return {
      empName : empRec.getValue('altname'),
      jobTitle : empRec.getValue('title'),
    }

  }
  function escapeXmlSymbols(input) {
    if (!input || typeof input !== "string") {
      return input;
    }
    return input.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function onRequest(context) {
    var recid = context.request.parameters.id;
    var version = context.request.parameters.version;

    var dataRec = record.load({
      type: "estimate",
      id: recid,
      isDynamic: false,
    });

    var sendDate = dataRec.getText("trandate");

    var tranId = dataRec.getValue("tranid");
    var brand = dataRec.getText("cseg_abjproj_cust_");


    var subsidiari = dataRec.getValue("subsidiary");
    var discountTotal = dataRec.getValue("discounttotal");
    var employeeName = dataRec.getText("custbody_fcn_sales_employee");
    // load subsidiarie
    if (subsidiari) {
        var subsidiariRec = record.load({
          type: "subsidiary",
          id: subsidiari,
          isDynamic: false,
        });
        // load for header
        var legalName = subsidiariRec.getValue("legalname");
        var addresSubsidiaries = escapeXmlSymbols(subsidiariRec.getValue("mainaddress_text"));
        var retEmailAddres = subsidiariRec.getValue("email");
        var Npwp = subsidiariRec.getValue("federalidnumber");
        var logo = subsidiariRec.getValue("logo");
        var filelogo;
        var urlLogo = "";
        if (logo) {
          filelogo = file.load({
            id: logo,
          });
          //get url
          urlLogo = filelogo.url.replace(/&/g, "&amp;");
        }

        if (addresSubsidiaries.includes("<br>")) {
          addresSubsidiaries = addresSubsidiaries.replace(/<br>/g, "");
        }
    }

    var customerID = dataRec.getValue("entity");
    var pic = dataRec.getText('custbody_so_pic');
    var cpEmail = dataRec.getValue('custbody_abj_cp_email');
    var designation = '';

    if (customerID) {
      var custRecord = record.load({
        type: record.Type.CUSTOMER,
        id: customerID,
        isDynamic: false,
      });

      let contactId = custRecord.getSublistValue({
        sublistId : 'contactroles',
        line : 0,
        fieldId : 'contact'
      });
      if(contactId){
        var contactData = search.lookupFields({
          type: search.Type.CONTACT,
          id: contactId,
          columns: ['title']
        });
        designation = contactData.title;
      }
      pic = custRecord.getSublistValue({
        sublistId : 'contactroles',
        line : 0,
        fieldId : 'contactname'
      }) || '';
      cpEmail = custRecord.getSublistValue({
        sublistId : 'contactroles',
        line : 0,
        fieldId : 'email'
      }) || '';
      var custName;
      var isperson = custRecord.getValue("isperson");
      if (isperson == "T") {
        var firstname = custRecord.getValue("firstname") || "";
        var middleName = custRecord.getValue("middlename") || "";
        var lastname = custRecord.getValue("lastname") || "";
        custName = firstname + " " + middleName + " " + lastname;
      } else {
        var isChecklist = custRecord.getValue("isautogeneratedrepresentingentity");
        if (isChecklist === true) {
          custName = custRecord.getValue("comments");
        } else {
          custName = custRecord.getValue("companyname");
        }
      }
      var custName = escapeXmlSymbols(custName)
      var custAddres = escapeXmlSymbols(custRecord.getValue("billaddr1"));
      if (custAddres === "") {
        custAddres = custRecord.getValue("defaultaddress");
      }

      var taxRegNo = custRecord.getValue("vatregnumber");
      var custEmail = custRecord.getValue("email");
      var custPhone = custRecord.getValue("phone");
      var count = custRecord.getLineCount({
        sublistId: "submachine",
      });
      var contPerson = escapeXmlSymbols(dataRec.getValue('custbody_abj_cp_name'));
      
      var cpPhone = dataRec.getValue('custbody_abj_cp_phone');
      for (var i = 0; i < count; i++) {
        var subsidiary = custRecord.getSublistValue({
          sublistId: "submachine",
          fieldId: "subsidiary",
          line: i,
        });

        if (subsidiary == subsidiari) {
          var balance = custRecord.getSublistValue({
            sublistId: "submachine",
            fieldId: "balance",
            line: i,
          });
          break;
        }
      }
    }

    var project = dataRec.getText('class');
    var preparedByEmpId = dataRec.getValue('custbody_fcn_sales_employee');
    var preparedEmployeData = findEmployee(preparedByEmpId)
    var preparedBy = preparedEmployeData.empName;
    var submittedByEmpId = dataRec.getValue('salesrep');
    var preparedEmployeData = findEmployee(submittedByEmpId);
   
    var statusqout = dataRec.getText('custbody_approvalstatus');
    var memo = dataRec.getValue('custbody_abj_memo_quotation_rate_card');
    if (memo.includes('\n')) {
      log.debug('includes newline');
      memo = memo.replace(/(\r\n|\n)/g, "<br/>");
    }

    var response = context.response;
    var xml = "";
    var header = "";
    var body = "";
    var detailBody = "";
    var headerHeight = "0%";
    var style = "";
    var footer = "";
    var pdfFile = null;
    var terms = "";
    var duedate = "";

    style += "<style type='text/css'>";
    style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
    style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
    style += ".tg .tg-img-logo{width:195px; height:90px; object-vit:cover;}";
    style += ".tg .tg-headerrow{align: right;font-size:10px;}";
    style += ".tg .tg-headerrow_legalName{align: right;font-size:10px;word-break:break-all; font-weight: bold;}";
    style += ".tg .tg-headerrow_legalNameLeft{align: left;font-size:10px;word-break:break-all; font-weight: bold;}";
    style += ".tg .tg-headerrow_quote{align: center;font-size:16px; font-weight: bold;}";
    style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
    style += ".tg .tg-headerrow_left{align: left;font-size:10px;}";
    style += ".tg .tg-headerrow_center{align: center;font-size:10px;}";
    style += ".tg .tg-head_body{align: center;font-size:10px;font-weight: bold; border-top: 1px solid black; border-bottom: 1px solid black; color:#fcfafa}";
    style += ".tg .tg-b_body{align: left;font-size:10px;}";
    style += ".tg .tg-f_body{align: right;font-size:10px;}";
    style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
    style += "</style>";

    header += '<table class=\'tg\' width="100%"  style="table-layout:fixed;">';
    header += "<tbody>";
    header += "</tbody>";
    header += "</table>";
    body += '<table class=\'tg\' width="100%"  style="table-layout:fixed;">';
    body += "<tbody>";

    body += "<tr>";
    body += "<td style='width:15%'></td>"
    body += "<td style='width:35%'></td>"
    body += "<td style='width:17%'></td>"
    body += "<td style='width:33%'></td>"
    body += "</tr>";
    body += "<tr>";
    body += "<td style='color:orange; font-size:25px; font-weight:bold;' colspan='2'>QUOTATION</td>"
    body += "</tr>";
    body += "<tr>";
    body += "<td style='font-weight:bold;' colspan='2'>"+legalName+"</td>"
    body += "</tr>";
    body += "<tr>";
    body += "<td style='' colspan='3'>"+addresSubsidiaries+"</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td style='background-color: #f9e6d4; font-weight: bold;'>Brand</td>"
    body += "<td style='background-color: #f9e6d4; font-weight: bold;'>: "+brand+"</td>"
    body += "<td style='background-color: #f9e6d4; font-weight: bold;'>Project</td>"
    body += "<td style='background-color: #f9e6d4; font-weight: bold;'>: "+project+"</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td style=''>Quote No.</td>"
    body += "<td style=''>: "+tranId+"</td>"
    body += "<td style=''>Client Company</td>"
    body += "<td style=''>: "+custName+"</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td style=''>Date of Issue</td>"
    body += "<td style=''>: "+sendDate+"</td>"
    body += "<td style=''>Person in Charge</td>"
    body += "<td style=''>: "+pic+"</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td style=''>Period</td>"
    body += "<td style=''>: "+formatMonthYear(sendDate)+"</td>"
    body += "<td style=''>Designation</td>"
    body += "<td style=''>: "+designation+"</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td style=''>Prepared By</td>"
    body += "<td style=''>: "+preparedBy+"</td>"
    body += "<td style=''>Contact Info</td>"
    body += "<td style=''>: "+cpEmail+"</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td style=''>Status Qoutation</td>"
    body += "<td style=''>: "+statusqout+"</td>"
    body += "<td style=''></td>"
    body += "<td style=''></td>"
    body += "</tr>";

    // body += "<tr style=''>";
    // body += "</tr>";
    body += "</tbody>";
    body += "</table>";

    body += '<table class=\'tg\' width="100%" style="table-layout:fixed; font-size:11px;">';
    body += "<tbody>";
    body += "<tr style='height:10px'>";
    body += "<td style='width:2%'></td>"
    body += "<td style='width:29%'></td>"
    body += "<td style='width:10%'></td>"
    body += "<td style='width:17%'></td>"
    body += "<td style='width:18%'></td>"
    body += "<td style='width:24%'></td>"
    body += "</tr>";

    body += "<tr style='height:30px; background-color: orange;'>";
    body += "<td style='background-color: orange; font-weight: bold; align: center; vertical-align: middle;'></td>"
    body += "<td style='background-color: orange; font-weight: bold; align: center; vertical-align: middle;'>SCOPE OF WORK</td>";
    body += "<td style='background-color: orange; font-weight: bold; align: center; vertical-align: middle;'>Qty</td>";
    body += "<td style='background-color: orange; font-weight: bold; align: center; vertical-align: middle;'>Units</td>";
    body += "<td style='background-color: orange; font-weight: bold; align: center; vertical-align: middle;'>Currency</td>";
    body += "<td style='background-color: orange; font-weight: bold; align: center; vertical-align: middle;'>Amount</td>";
    body += "</tr>";

    body += getItem(context, dataRec);

    body += "<tr>";
    body += "</tr>";

    
    body += "</tbody>";
    body += "</table>";

    body += '<table class=\'tg\' width="100%" style="table-layout:fixed; font-size:11px;">';
    body += "<tbody>";
    body += "<tr style='margin-top:20px'>";
    body += "<td style='width:100%; font-weight:bold;'>Memo :</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td style='width:100%;'>"+memo+"</td>";
    body += "</tr>";

    body += "<tr>";
    body += `<td style="width:100%;">
    <p style='font-weight:bold; color:black; padding:6px; margin:0;'>TERMS AND CONDITIONS</p>
    <ol style='margin-top:5px; padding-left:18px;'>
        <li style='padding:4px 0;'>Project starts after or an equivalent commercial document is released by Client.</li>
        <li style='padding:4px 0;'>Billed in arrears, after project's Completion Note / Berita Acara Serah Terima Pekerjaan (BASTP) is signed.</li>
        <li style='padding:4px 0;'>Cancellation after quotation approval will incur a penalty as follows:
            <ul style='margin-top:4px; padding-left:20px; list-style-type:disc;'>
                <li style='padding:2px 0;'>100% of the man hours spent to date and 10% of the value of the remaining scope of work.</li>
                <li style='padding:2px 0;'>100% reimbursement for any cost(s) expended at the date of cancellation.</li>
            </ul>
        </li>
        <li style='padding:4px 0;'>Unused quota for deliverables are not eligible to be carried over to the next contracted period, but can be repurposed for other outputs (e.g., value), must be agreed by Client & Agency prior to execution.</li>
    </ol>
</td>`;

    body += "</tr>";
    body += "</tbody>";
    body += "</table>";

    body += '<table class=\'tg\' width="100%" style="table-layout:fixed; font-size:11px;">';
    body += "<tbody>";
    body += "<tr style='margin-top:20px'>";
    body += "<td style='width:35%'></td>"
    body += "<td style='width:30%'></td>"
    body += "<td style='width:35%'></td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td></td>"
    body += "<td></td>"
    body += "<td style='align:left; font-weight:bold;'>Date :</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td style='align:left;'>Submitted By</td>"
    body += "<td></td>"
    body += "<td style='align:left; font-weight:bold;'>Approved By,</td>"
    body += "</tr>";

    body += "<tr style='height:40px;'>";
    body += "<td></td>"
    body += "<td></td>"
    body += "<td style='align:left; font-weight:bold;'></td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td>"+preparedEmployeData.empName+"<br/>"+preparedEmployeData.jobTitle+"<br/>"+legalName+"</td>"
    body += "<td></td>"
    body += "<td style='align:left; font-weight:bold;'>"+custName+"</td>"
    body += "</tr>";

    body += "</tbody>";
    body += "</table>";

    detailBody += '<table class="tg" width="100%" style="table-layout:fixed; font-size:11px;">';
    detailBody += "<tbody>";
    detailBody += "<tr>";
    detailBody += "<td style='width:5%;'></td>";
    detailBody += "<td style='width:45%;'></td>";
    detailBody += "<td style='width:15%;'></td>";
    detailBody += "<td style='width:15%;'></td>";
    detailBody += "<td style='width:5%;'></td>";
    detailBody += "<td style='width:15%;'></td>";
    detailBody += "</tr>";

    detailBody += "<tr>";
    detailBody += "<td style='font-weight:bold; align:center;' colspan='6'>SCOPE OF WORK > COST BREAKDOWN STRUCTURE</td>";
    detailBody += "</tr>";

    detailBody += getItemPembobotan(dataRec);

    detailBody += "</tbody>";
    detailBody += "</table>";

    footer += "<table class='tg' style='table-layout: fixed;'>";
    footer += "<tbody>";
    footer += "<tr class='tg-foot'>";
    footer += "</tr>";
    footer += "</tbody>";
    footer += "</table>";

    var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
    xml += "<pdf xmlns:pdf='http://www.netsuite.com/pdf'>"; // ✅ tambahkan namespace pdf
    xml += "<head>";
    xml += style;
    xml += "<macrolist>";
    xml += '<macro id="nlheader">';
    xml += header;
    xml += "</macro>";
    xml += '<macro id="nlfooter">';
    xml += footer;
    xml += "</macro>";
    xml += "</macrolist>";
    xml += "</head>";
    xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='3%'>";
    xml += body;
    xml += "<div style='page-break-before:always'></div>"; 
    xml += detailBody;
    xml += "\n</body>\n</pdf>";

    xml = xml.replace(/ & /g, " &amp; ");
    response.renderPdf({
      xmlString: xml,
    });
  }
  function getItem(context, dataRec) {
    var tier = dataRec.getValue('custbody_abj_quotation_tier');


    var currenc = dataRec.getValue("currency");
    if (currenc) {
      var recCurrenc = record.load({
        type: "currency",
        id: currenc,
        isDynamic: false,
      });
      var tlcCurr = recCurrenc.getValue("symbol");
      var formatSample = recCurrenc.getValue("formatsample")
    }
    var currSym = formatSample.replace(/\d+/g, '').replace('.', '').replace(',', '')
    var subTotal = 0; 
    var sumSubTotal =0;
    var discount = dataRec.getValue('discounttotal') || 0;
    var vat = dataRec.getValue('taxtotal');
    var grandTotal = dataRec.getValue('total');
    var itemCount = dataRec.getLineCount({
      sublistId: "item",
    });
    if (itemCount > 0) {
      var body = "";
      var no = 0;
      for (var index = 0; index < itemCount; index++) {
        
        var scopeOfWork = dataRec.getSublistText({
          sublistId: "item",
          fieldId: "item",
          line: index,
        });
        var itemId = dataRec.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: index,
        });
        var hasASF = scopeOfWork.includes("ASF");
        if(!hasASF) no++;
        var quantity = dataRec.getSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          line: index,
        });
        var units = dataRec.getSublistText({
          sublistId: "item",
          fieldId: "units",
          line: index,
        });
        var amount = dataRec.getSublistValue({
          sublistId: "item",
          fieldId: "amount",
          line: index,
        });
        var complexityLevel = dataRec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_abj_complexity_level_line",
          line: index,
        });
        var complexityLevelText = dataRec.getSublistText({
          sublistId: "item",
          fieldId: "custcol_abj_complexity_level_line",
          line: index,
        });
        
        subTotal = Number(subTotal) + Number(amount);
        body += "<tr>";
        body += `<td style='align: center; '>${!hasASF ? no : ''}</td>`;
        body += `<td style='align: center; '>${scopeOfWork}</td>`;
        body += `<td style='align: right; '>${quantity}</td>`;
        body += `<td style='align: center; '>${units}</td>`;
        body += `<td style='align: left; '>${tlcCurr}</td>`;
        body += `<td style='align: right; '>${numberWithCommasV2(amount)}</td>`;
        body += "</tr>";

        if (!hasASF && itemId && complexityLevel && tier) {
          let rateCardData = getRateCard(itemId, complexityLevel, tier);
          log.debug('DATA RATE CARD', rateCardData);
          let letter = 'a';
          let sumHours = 0;
          let sumTotal = 0;

          body += `<tr>
            <td rowspan='2' style='font-weight: bold; background-color: orange; align: center; vertical-align: middle; border:1px solid black;'>${no}</td>
            <td rowspan='2' style='font-weight: bold; background-color: orange; align: center; vertical-align: middle; border:1px solid black;'>${scopeOfWork}</td>
            <td colspan='4' style='font-weight: bold; background-color: orange; align: center; vertical-align: middle; border:1px solid black;'>Breakdown (${complexityLevelText})</td>
          </tr>`;

          body += `<tr>
            <td style='font-weight: bold; background-color: orange; align: center; vertical-align: middle; border:1px solid black;'>Function</td>
            <td style='font-weight: bold; background-color: orange; align: center; vertical-align: middle; border:1px solid black;'>Hourly Rate</td>
            <td style='font-weight: bold; background-color: orange; align: center; vertical-align: middle; border:1px solid black;'>Hours</td>
            <td style='font-weight: bold; background-color: orange; align: center; vertical-align: middle; border:1px solid black;'>Sum - Fee</td>
          </tr>`;

          rateCardData.map(rateCard => {
            body += `<tr>
              <td rowspan='${rateCard.items.length + 1}' style='align: center; vertical-align: middle; border:1px solid black;'>${letter}</td>
              <td colspan='5' style='font-weight: bold; background-color: #fff2cc; align: left; vertical-align: middle; border-top:1px solid black; border-right:1px solid black;'>${rateCard.categorySOWText}</td>
            </tr>`;

            rateCard.items.map(item => {
              sumHours += Number(item.hours);
              sumTotal += Number(item.total);

              body += `<tr>
                <td style='border-top:1px solid black;border-right:1px solid black; align:left;'>${item.desc.replaceAll('\n', '<br/>')}</td>
                <td style='border-top:1px solid black;border-right:1px solid black; align:left;'>${item.positionText}</td>
                <td style='border-top:1px solid black;border-right:1px solid black; align:right;'>${numberWithCommasV2(item.rate)}</td>
                <td style='border-top:1px solid black;border-right:1px solid black; align:right;'>${item.hours}</td>
                <td style='border-top:1px solid black;border-right:1px solid black; align:right;'>${numberWithCommasV2(item.total)}</td>
              </tr>`;
            });

            letter = String.fromCharCode(letter.charCodeAt(0) + 1);
          });

          sumSubTotal += sumTotal;

          body += `<tr>
            <td colspan='4' style='font-weight: bold; background-color: #fff2cc; align: right; vertical-align: middle; border:1px solid black;'>SUM Qty, Price</td>
            <td style='font-weight: bold; background-color: #fff2cc; align: right; vertical-align: middle; border:1px solid black;'>${sumHours}</td>
            <td style='font-weight: bold; background-color: #fff2cc; align: right; vertical-align: middle; border:1px solid black;'>${numberWithCommasV2(sumTotal)}</td>
          </tr>`;

          body += `<tr><td colspan='6' height='25px'></td></tr>`;
        }
        

      }
      body += "<tr style=' background-color: #fff2cc;'>";
      body += "<td colspan='4' class='bold' style='background-color: #fff2cc; font-weight: bold; align: right; vertical-align: middle;'>SUBTOTAL</td>";
      body += `<td class='bold' style='background-color: #fff2cc; font-weight: bold; align: left; vertical-align: middle;'>${tlcCurr}</td>`;
      body += `<td class='bold' style='background-color: #fff2cc; font-weight: bold; align: right; vertical-align: middle;'>${numberWithCommasV2(subTotal)}</td>`;
      body += "</tr>";

      body += "<tr style=' background-color: #fff2cc;'>";
      body += "<td colspan='4' class='bold' style='background-color: #fff2cc; font-weight: bold; align: right; vertical-align: middle;'>DISCOUNT</td>";
      body += `<td class='bold' style='background-color: #fff2cc; font-weight: bold; align: left; vertical-align: middle;'>${tlcCurr}</td>`;
      body += `<td class='bold' style='background-color: #fff2cc; font-weight: bold; align: right; vertical-align: middle;'>${numberWithCommasV2(discount)}</td>`;
      body += "</tr>";

      body += "<tr style=' background-color: #fff2cc;'>";
      body += "<td colspan='4' class='bold' style='background-color: #fff2cc; font-weight: bold; align: right; vertical-align: middle;'>VAT</td>";
      body += `<td class='bold' style='background-color: #fff2cc; font-weight: bold; align: left; vertical-align: middle;'>${tlcCurr}</td>`;
      body += `<td class='bold' style='background-color: #fff2cc; font-weight: bold; align: right; vertical-align: middle;'>${numberWithCommasV2(vat)}</td>`;
      body += "</tr>";

      body += "<tr style=' background-color: orange;'>";
      body += "<td colspan='4' class='bold' style='background-color: orange; font-weight: bold; align: right; vertical-align: middle;'>GRAND TOTAL</td>";
      body += `<td class='bold' style='background-color: orange; font-weight: bold; align: left; vertical-align: middle;'>${tlcCurr}</td>`;
      body += `<td class='bold' style='background-color: orange; font-weight: bold; align: right; vertical-align: middle;'>${numberWithCommasV2(grandTotal)}</td>`;
      body += "</tr>";


      return body

    }
  }
  function getItemPembobotan(dataRec) {
  var itemCount = dataRec.getLineCount({ sublistId: "item" });
  if (itemCount <= 0) return "";

  var dataItem = [];
  var dataPembobotan = [];

  for (var i = 0; i < itemCount; i++) {
    var itemId = dataRec.getSublistValue({ sublistId: "item", fieldId: "item", line: i });
    var itemText = dataRec.getSublistText({ sublistId: "item", fieldId: "item", line: i });
    var lineIdItem = dataRec.getSublistValue({ sublistId: "item", fieldId: "custcol_item_id_pembobotan", line: i });

    dataItem.push({ itemId, itemText, lineIdItem });
  }

  var cekPembobotan = dataRec.getLineCount({ sublistId: "recmachcustrecord_transaction_id" });
  if (cekPembobotan <= 0) return "";

  for (var j = 0; j < cekPembobotan; j++) {
    dataPembobotan.push({
      idLinePembobotan: dataRec.getSublistValue({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_id_line", line: j }),
      ratePembobotan: dataRec.getSublistValue({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_rate_pembobotan", line: j }),
      hourPembobotan: dataRec.getSublistValue({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_hour_pembobotan", line: j }),
      department: dataRec.getSublistValue({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_department_pembobotan", line: j }),
      departmentText: dataRec.getSublistText({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_department_pembobotan", line: j }),
      sowPembobotan: dataRec.getSublistValue({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_category_sow", line: j }),
      sowPembobotanText: dataRec.getSublistText({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_category_sow", line: j }),
      descPembobotan: dataRec.getSublistValue({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_desc_pembobotan", line: j }),
      isAsf: dataRec.getSublistValue({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_asf_pembobotan", line: j }),
      asfProsent: dataRec.getSublistValue({ sublistId: "recmachcustrecord_transaction_id", fieldId: "custrecord_asf_prosent", line: j })
    });
  }

  // === Proses grouping
  let groupedData = {};
  dataItem.forEach(item => {
    const lineIdItem = item.lineIdItem;
    groupedData[lineIdItem] = {};
  });

  dataPembobotan.forEach(row => {
    const { idLinePembobotan, sowPembobotan, isAsf, asfProsent } = row;
    if (!groupedData[idLinePembobotan]) return;

    if (!groupedData[idLinePembobotan][sowPembobotan]) {
      groupedData[idLinePembobotan][sowPembobotan] = {
        nonAsf: [],
        totalAsf: 0
      };
    }

    if (isAsf) {
      groupedData[idLinePembobotan][sowPembobotan].totalAsf += parseFloat(asfProsent || 0);
    } else {
      groupedData[idLinePembobotan][sowPembobotan].nonAsf.push(row);
    }
  });

  log.debug('groupedData', groupedData);

  // === Return isi baris HTML-nya
  return generateDetailRows(groupedData, dataItem);
}
function generateDetailRows(groupedData, dataItem) {
  let html = "";

  dataItem.forEach(item => {
    const lineId = item.lineIdItem;
    const itemText = item.itemText;
    const groupSow = groupedData[lineId];
    if (!groupSow) return;

    // Judul per item
    html += `<tr><td colspan='6' style='font-weight:bold;'>${itemText}</td></tr>`;

    Object.keys(groupSow).forEach((sowKey, indexSow) => {
      const group = groupSow[sowKey];
      const nonAsf = group.nonAsf;
      const totalAsf = group.totalAsf;
      const abChar = String.fromCharCode(97 + indexSow); // a, b, c ...

      // Baris SOW Title
      const firstRow = nonAsf[0] || {};
      html += `<tr><td style='font-weight:bold;'>${abChar}</td><td colspan='5' style='font-weight:bold;'>${firstRow.sowPembobotanText}</td></tr>`;

      // Baris isi desc, fungsi, rate, hours, fee
      nonAsf.forEach((row, i) => {
        html += "<tr>";

        if (i === 0) {
          html += `<td></td><td rowspan='${nonAsf.length + (totalAsf > 0 ? 1 : 0)}'>${row.descPembobotan.replace(/\n/g, "<br/>")}</td>`;
        }

        const fungsi = row.departmentText?.split(":")[1]?.trim() || "-";
        const rate = parseFloat(row.ratePembobotan || 0);
        const hours = parseFloat(row.hourPembobotan || 0);
        const fee = rate * hours;

        html += `<td>${fungsi}</td>`;
        html += `<td style='text-align:right;'>${rate.toLocaleString()}</td>`;
        html += `<td style='text-align:right;'>${hours}</td>`;
        html += `<td style='text-align:right;'>${fee.toLocaleString()}</td>`;

        html += "</tr>";
      });

      // Tambah baris ASF
      if (totalAsf > 0) {
        const thirdPartyTotal = nonAsf.reduce((sum, r) => sum + (r.ratePembobotan * r.hourPembobotan), 0);
        const asfAmount = Math.round(thirdPartyTotal * totalAsf / 100);

        html += "<tr>";
        html += `<td></td><td><i>Agency Service Fee (ASF) ${totalAsf}% for Third Party Cost</i></td>`;
        html += `<td colspan='2'></td>`;
        html += `<td style='text-align:right;'>${totalAsf.toFixed(2)}%</td>`;
        html += `<td style='text-align:right;'>${asfAmount.toLocaleString()}</td>`;
        html += "</tr>";
      }
    });
  });

  return html;
}

  // function getItemPembobotan(dataRec){
  //   var body = '';
  //   var itemCount = dataRec.getLineCount({
  //     sublistId: "item",
  //   });
  //   if(itemCount > 0){
  //     var dataItem = [];
  //     var dataPembobotan = []
  //     for(var i = 0; i < itemCount; i++){
  //       var itemId = dataRec.getSublistValue({
  //         sublistId: "item",
  //         fieldId: "item",
  //         line: i,
  //       });
  //       var itemText = dataRec.getSublistText({
  //         sublistId: "item",
  //         fieldId: "item",
  //         line: i,
  //       });
  //       var lineIdItem = dataRec.getSublistValue({
  //         sublistId : "item",
  //         fieldId : "custcol_item_id_pembobotan",
  //         line : i
  //       })
  //       dataItem.push({
  //         itemId: itemId,
  //         itemText : itemText,
  //         lineIdItem : lineIdItem
  //       });
  //     }
  //     var cekPembobotan = dataRec.getLineCount({
  //       sublistId: "recmachcustrecord_transaction_id",
  //     });
  //     log.debug('cekPembobotan', cekPembobotan)
  //     if(cekPembobotan > 0){
  //       for(var j = 0; j < cekPembobotan; j++){
  //         var ratePembobotan = dataRec.getSublistValue({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_rate_pembobotan",
  //           line : j
  //         })
  //         var hourPembobotan = dataRec.getSublistValue({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_hour_pembobotan",
  //           line : j
  //         })
  //         var department = dataRec.getSublistValue({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_department_pembobotan",
  //           line : j
  //         })
  //         var departmentText = dataRec.getSublistText({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_department_pembobotan",
  //           line : j
  //         })
  //         var idLinePembobotan = dataRec.getSublistValue({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_id_line",
  //           line : j
  //         })
  //         var sowPembobotan = dataRec.getSublistValue({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_category_sow",
  //           line : j
  //         })
  //         var sowPembobotanText = dataRec.getSublistText({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_category_sow",
  //           line : j
  //         })
  //         var descPembobotan = dataRec.getSublistValue({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_desc_pembobotan",
  //           line : j
  //         })
  //         var isAsf = dataRec.getSublistValue({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_asf_pembobotan",
  //           line : j
  //         })
  //         var asfProsent = dataRec.getSublistValue({
  //           sublistId: "recmachcustrecord_transaction_id",
  //           fieldId : "custrecord_asf_prosent",
  //           line : j
  //         });
  //         dataPembobotan.push({
  //           idLinePembobotan : idLinePembobotan,
  //           ratePembobotan : ratePembobotan,
  //           hourPembobotan : hourPembobotan,
  //           department : department,
  //           departmentText : departmentText,
  //           sowPembobotan : sowPembobotan,
  //           sowPembobotanText : sowPembobotanText,
  //           descPembobotan : descPembobotan,
  //           isAsf : isAsf,
  //           asfProsent : asfProsent
  //         })

  //       }
  //       log.debug('dataItem', dataItem);
  //       log.debug('dataPembobotan', dataPembobotan);
  //       let groupedData = {};

  //       dataItem.forEach(item => {
  //         const lineIdItem = item.lineIdItem;
  //         groupedData[lineIdItem] = {}; 
  //       });
  //       dataPembobotan.forEach(row => {
  //         const { idLinePembobotan, sowPembobotan, isAsf, asfProsent } = row;

  //         if (!groupedData[idLinePembobotan]) return;

  //         if (!groupedData[idLinePembobotan][sowPembobotan]) {
  //           groupedData[idLinePembobotan][sowPembobotan] = {
  //             nonAsf: [],
  //             totalAsf: 0
  //           };
  //         }

  //         if (isAsf) {
  //           groupedData[idLinePembobotan][sowPembobotan].totalAsf += parseFloat(asfProsent || 0);
  //         } else {
  //           groupedData[idLinePembobotan][sowPembobotan].nonAsf.push(row);
  //         }
  //       });

  //       log.debug('groupedData', groupedData);


  //     }
  //   }
  // }
  return {
    onRequest: onRequest,
  };
});
