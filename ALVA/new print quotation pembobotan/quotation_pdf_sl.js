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

  function printQuotationV2(context){
    var style = "";
    var header = "";
    var footer = "";
    var body = "";
    var headerHeight = "25%";

    var recid = context.request.parameters.id;
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

    style = `
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        .header {
            font-size: 25px;
            font-weight: bold;
            color: orange;
        }
        .company {
            font-weight: bold;
        }
        .table-container {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .table-container td {
            vertical-align: top;
        }
        .highlight {
            background-color: #f9e6d4;
            font-weight: bold;
        }
        .bold {
            font-weight: bold;
        }
        .bg-orange{
          background-color: orange;
        }
        .bg-yellow{
          background-color: #fff2cc;
        }
        .table-container th, .table-container td {
            text-align: right;
        }
        .table-container th {
            background-color: orange;
            color: white;
            text-align: left;
        }
        .total {
            font-weight: bold;
        }
        .memo {
            margin-top: 20px;
            font-weight: bold;
        }
    </style>`;


    header = `
      <p>
        <span class="header">QUOTATION</span>
        <br/>
        <span class="company">${legalName}</span>
        <br/>
        ${addresSubsidiaries}
      </p>

      <table class="table-container">
          <tr>
            <td style='width:15%;'></td>
            <td style='width:30%;'></td>
            <td style='width:15%;'></td>
            <td style='width:40%;'></td>
          </tr>
          <tr class="highlight">
              <td>Brand</td>
              <td>: <span class="bold">${brand}</span></td>
              <td>Project</td>
              <td>: ${project}</td>
          </tr>
          <tr>
              <td>Quote No.</td>
              <td>: ${tranId}</td>
              <td>Client Company</td>
              <td>: ${custName}</td>
          </tr>
          <tr>
              <td>Date of Issue</td>
              <td>: ${sendDate}</td>
              <td>Person in Charge</td>
              <td>: ${pic}</td>
          </tr>
          <tr>
              <td>Period</td>
              <td>: ${formatMonthYear(sendDate)}</td>
              <td>Designation</td>
              <td>: ${designation}</td>
          </tr>
          <tr>
              <td>Prepared By</td>
              <td>: ${preparedBy}</td>
              <td>Contact Info</td>
              <td>: ${cpEmail}</td>
          </tr>
            <tr>
              <td>Status Qoutation</td>
              <td>: ${statusqout}</td>
              <td></td>
              <td></td>
          </tr>
      </table>
    `;

    var itemCount = dataRec.getLineCount({
      sublistId: "item",
    });

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
    
    var itemRows = ''
    var itemRowsDetail = ''
    var subTotal = 0; 
    var sumSubTotal =0;
    var discount = dataRec.getValue('discounttotal') || 0;
    var vat = dataRec.getValue('taxtotal');
    var grandTotal = dataRec.getValue('total');
    if (itemCount > 0) {
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
        itemRows += `<tr>
          <td>${!hasASF ? no : ''}</td>
          <td>${scopeOfWork}</td>
          <td>${quantity}</td>
          <td>${units}</td>
          <td>${tlcCurr}</td>
          <td align='right'>${numberWithCommasV2(amount)}</td>
        </tr>`;

        // 
        if(!hasASF && itemId && complexityLevel && tier){
          let rateCardData = getRateCard(itemId,complexityLevel,tier);
          log.debug('DATA RATE CARD', rateCardData);
          let rateCardRows = '';
          let letter = 'a';
          let sumHours = 0;
          let sumTotal = 0;

          rateCardData.map(rateCard => {
            
            
            rateCardRows += `
              <tr>
                <td rowspan='${rateCard.items.length + 1}' align='center' style='border-top:1px solid black;border-right:1px solid black;border-left:1px solid black;'>${letter}</td>
                <td colspan='5' style='border-top:1px solid black;border-right:1px solid black;' class='bold bg-yellow'>${rateCard.categorySOWText}</td>
              </tr>
              ${rateCard.items.map((item)=>{
                sumHours = Number(sumHours) + Number(item.hours);
                sumTotal = Number(sumTotal) + Number(item.total);
                return `<tr>
                  <td style='border-top:1px solid black;border-right:1px solid black;'><p style='text-align:left'>${item.desc.replaceAll('\n', '<br/>')}</p></td>
                  <td style='border-top:1px solid black;border-right:1px solid black;'><p style='text-align:left'>${item.positionText}</p></td>
                  <td style='border-top:1px solid black;border-right:1px solid black;' align='right'>${numberWithCommasV2(item.rate)}</td>
                  <td style='border-top:1px solid black;border-right:1px solid black;' align='right'>${item.hours}</td>
                  <td style='border-top:1px solid black;border-right:1px solid black;' align='right'>${numberWithCommasV2(item.total)}</td>
                </tr>`
              })}
              
           `;
           letter = String.fromCharCode(letter.charCodeAt(0) + 1);
          });

          sumSubTotal = Number(sumSubTotal) + Number(sumTotal);
          itemRowsDetail += `
            <tr>
              <td rowspan='2' class='bold bg-orange' align='center' width='25px' valign='middle' style='border-top:1px solid black;border-right:1px solid black;border-left:1px solid black;' >${no}</td>
              <td rowspan='2' class='bold bg-orange' align='center' width='300px' valign='middle' style='border-top:1px solid black;border-right:1px solid black;'>${scopeOfWork}</td>
              <td colspan='4' class='bold bg-orange' align='center' valign='middle' style='border-top:1px solid black;border-right:1px solid black;'>Breakdown(${complexityLevelText})</td>
            </tr>
            <tr>
              <td align='center' class='bold bg-orange' valign='middle' style='border-top:1px solid black;border-right:1px solid black;' ><p style='text-align:center;'>Function</p></td>
              <td align='center' class='bold bg-orange' valign='middle' style='border-top:1px solid black;border-right:1px solid black;'><p style='text-align:center;'>Hourly Rate</p></td>
              <td align='center' class='bold bg-orange' valign='middle' style='border-top:1px solid black;border-right:1px solid black;'><p style='text-align:center;'>Hours</p></td>
              <td align='center' class='bold bg-orange' valign='middle' style='border-top:1px solid black;border-right:1px solid black;'><p style='text-align:center;'>Sum - Fee</p></td>
            </tr>
            ${rateCardRows}
            <tr>
              <td colspan='4' class='bold bg-yellow' align='right' style='border-top:1px solid black;border-right:1px solid black;border-left:1px solid black;border-bottom:1px solid black;' >SUM Qty,Price</td>
              <td class='bold bg-yellow' style='border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;' align='right'>${sumHours}</td>
              <td class='bold bg-yellow' style='border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;' align='right'>${numberWithCommasV2(sumTotal)}</td>
            </tr>
            <tr><td colspan='6' height='25px'></td></tr>
          `; 
        }
      }
    }

    subTotalComponent = `
        <tr>
          <td colspan='4' class='bold bg-yellow' align='right' style='border-top:1px solid black;border-right:1px solid black;border-left:1px solid black;border-bottom:1px solid black;' >SUBTOTAL</td>
          <td class='bold bg-yellow' style='border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;' align='right'></td>
          <td class='bold bg-yellow' style='border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;' align='right'>${numberWithCommasV2(sumSubTotal)}</td>
        </tr>
    `

    
    body = `
    <table class="table-container">
      <thead>
        <tr>
            <td width='10px' class='bold bg-orange'></td>
            <td class='bold bg-orange'>SCOPE OF WORK</td>
            <td class='bold bg-orange'>Qty</td>
            <td class='bold bg-orange'>Units</td>
            <td class='bold bg-orange'>Currency</td>
            <td class='bold bg-orange'>Amount</td>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr>
            <td colspan='4' align='right' class='bold bg-yellow'>SUBTOTAL</td>
            <td class='bold bg-yellow'>${tlcCurr}</td>
            <td align='right' class='bold bg-yellow'>${numberWithCommasV2(subTotal)}</td>
        </tr>
        <tr>
            <td colspan='4' align='right' class='bold bg-yellow'>DISCOUNT</td>
            <td class='bold bg-yellow'>${tlcCurr}</td>
            <td align='right' class='bold bg-yellow'>${numberWithCommasV2(discount)}</td>
        </tr>
        <tr>
            <td colspan='4' align='right' class='bold bg-yellow'>VAT</td>
            <td class='bold bg-yellow'>${tlcCurr}</td>
            <td align='right' class='bold bg-yellow'>${numberWithCommasV2(vat)}</td>
        </tr>
        <tr>
            <td colspan='4' align='right' class='bold bg-orange'>GRAND TOTAL</td>
            <td class='bold bg-orange'>${tlcCurr}</td>
            <td align='right' class='bold bg-orange'>${numberWithCommasV2(grandTotal)}</td>
        </tr>
      </tbody>
    </table>

    <p class="memo">Memo :</p>
    <p>${memo}</p>

    <p style='font-weight:bold;'>TERMS AND CONDITIONS</p>
    <ol>
        <li>Project starts after or an equivalent commercial document is released by Client.</li>
        <li>Billed in arrears, after project's Completion Note / Berita Acara Serah Terima Pekerjaan (BASTP) is signed.</li>
        <li>Cancellation after quotation approval will incur a penalty as follows:
            <ul>
                <li>100% of the man hours spent to date and 10% of the value of the remaining scope of work.</li>
                <li>100% reimbursement for any cost(s) expended at the date of cancellation.</li>
            </ul>
        </li>
        <li>Unused quota for deliverables are not eligible to be carried over to the next contracted period, but can be repurposed for other outputs eg value, must be agreed by Client & Agency prior to execution.</li>
    </ol>
    `

    footer = `
      <table style='width:100%;table-layout:fixed;'>
        <tr>
            <td class="bold left"></td>
            <td></td>
            <td class="bold right">Date :</td>
        </tr>
        <tr>
            <td class="left">Submitted By</td>
            <td></td>
            <td class="bold right">Approved By,</td>
        </tr>
        <tr><td style='height:40px;' colspan='3'></td></tr>
        <tr>
            <td class="left" valign='bottom'>${preparedEmployeData.empName}<br/>${preparedEmployeData.jobTitle}<br/>${legalName}</td>
            <td></td>
            <td class="right" valign='bottom'>${custName}</td>
        </tr>
    </table>`;

    var styleDetail = '';
    var headerDetail ='';
    var footerDetail ='';
    var bodyDetail = `
      <p style='text-align:center:font-size:20px;font-weight:bold;' align='center'>SCOPE OF WORK > COST BREAKDOWN STRUCTURE</p>
      <table width='100%' style='margin-bottom:25px;'>
        ${itemRowsDetail}
        ${subTotalComponent}
      </table>
    `;

    var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
    xml += "<pdf>";
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
    xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;padding:20px 40px;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='20%'>";
    xml += body;
    xml += "\n</body>";

    xml += "<head>";
    xml += styleDetail;
    xml += "<macrolist>";
    xml += '<macro id="nlheaderdetail">';
    xml += headerDetail;
    xml += "</macro>";
    xml += '<macro id="nlfooterdetail">';
    xml += footerDetail;
    xml += "</macro>";
    xml += "</macrolist>";
    xml += "</head>";
    xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;padding:20px 40px;' header='nlheaderdetail' header-height='' footer='nlfooterdetail' footer-height=''>";
    xml += bodyDetail;
    xml += "\n</body>\n</pdf>";


    
    xml = xml.replace(/ & /g, " &amp; ");
    return context.response.renderPdf({
      xmlString: xml,
    });
  }

  function onRequest(context) {
    var recid = context.request.parameters.id;
    var version = context.request.parameters.version;
    if(version == 'v2'){
      log.debug('called')
      return printQuotationV2(context);
    }
    // load PO
    var dataRec = record.load({
      type: "estimate",
      id: recid,
      isDynamic: false,
    });
    
    var currenc = dataRec.getValue("currency");
    if (currenc) {
      var recCurrenc = record.load({
        type: "currency",
        id: currenc,
        isDynamic: false,
      });
      var tlcCurr = recCurrenc.getValue("symbol");
      var formatSample = recCurrenc.getValue("formatsample")
      var currSym = formatSample.replace(/\d+/g, '').replace('.', '').replace(',', '')
    }

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

    //load sign for marsx
    var signedUrl = '';
    var fileSign = file.load({
      id: 79490
    })
    log.debug('filesign url',fileSign.url)
    signedUrl = fileSign.url.replace(/&/g, "&amp;");

    // load vendor
    var customerID = dataRec.getValue("entity");
    if (customerID) {
      var custRecord = record.load({
        type: record.Type.CUSTOMER,
        id: customerID,
        isDynamic: false,
      });
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
      var cpEmail = dataRec.getValue('custbody_abj_cp_email');
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
    if (balance) {
      balance = format.format({
        value: balance,
        type: format.Type.CURRENCY,
      });
    }
    // PO data
    var jobTitle = escapeXmlSymbols(dataRec.getValue("title"));
    var sendDate = dataRec.getText("trandate");
    var tranId = dataRec.getValue("tranid");
    var brand = dataRec.getText("cseg_abjproj_cust_");
    var quoteTotal = dataRec.getValue("total") || 0;
    var taxtotal = dataRec.getValue("taxtotal") || 0;
    var total = dataRec.getValue("total") || 0;
    var termsCondition = escapeXmlSymbols(dataRec.getValue('custbody_abj_memo_quotation_rate_card'));
    var jobNumber = escapeXmlSymbols(dataRec.getValue("custbody_abj_custom_jobnumber"));
    if (jobNumber.includes("\\")) {
      jobNumber = jobNumber.replace(/\\/g, "<br/>");
    }
    var subTotal = 0;
    var totalToCount = total;
    var totalWhTaxamount = 0;
    var totalWhTaxamountItem = 0;
    var totalWhTaxamountExp = 0;
    var whtaxammountItem = 0;
    var whtaxammountExp = 0;
    var whTaxCodetoPrint = "";
    var countItem = dataRec.getLineCount({
      sublistId: "item",
    });
    var taxrateList = [];
    if (countItem > 0) {
      for (var i = 0; i < countItem; i++) {
        var account = dataRec.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: i,
        });
        if (account) {
          whtaxammountItem = dataRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_4601_witaxamount",
            line: i,
          });
          var amount = dataRec.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: i,
          });
          var qty = dataRec.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });
          var taxRate = dataRec.getSublistValue({
            sublistId: "item",
            fieldId: "taxrate1",
            line: i,
          });
          log.debug('taxrate',taxRate)
          if (taxRate != 0 && taxrateList.indexOf(taxRate) === -1) {
            taxrateList.push(parseFloat(taxRate));
          }
          var whTaxCodeI = dataRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_4601_witaxcode",
            line: i,
          });

          if (whTaxCodeI) {
            var whRecI = record.load({
              type: "customrecord_4601_witaxcode",
              id: whTaxCodeI,
              isDynamic: false,
            });
            whTaxCodetoPrint = whRecI.getValue("custrecord_4601_wtc_name");
            if (whTaxCodetoPrint.includes("Prepaid Tax") || whTaxCodetoPrint.includes("Tax Article")) {
              whTaxCodetoPrint = whTaxCodetoPrint.replace("Prepaid Tax", "PPH").replace("Tax Article", "PPH");
            }
          }
          // var totalAmount = Number(amount) * Number(qty)
          var totalAmount = amount;
          subTotal += totalAmount;
          var tamount = whtaxammountItem;
          whtaxammountItem = Math.abs(tamount);
          totalWhTaxamountItem += whtaxammountItem;
        }
      }
    }

    var whtaxToCount = whtaxammountItem + whtaxammountExp;
    totalWhTaxamount = totalWhTaxamountItem + totalWhTaxamountExp;
    var totalWHTaxToCount = totalWhTaxamount;

    // total = Number(subTotal) + Number(taxtotal);
    var totalReceived = total;
    var subTotal2 = Number(subTotal) + Number(discountTotal);

    if (totalWhTaxamount) {
      totalWhTaxamount = pembulatan(totalWhTaxamount);
      totalWhTaxamount = format.format({
        value: totalWhTaxamount,
        type: format.Type.CURRENCY,
      });
    }
    if (quoteTotal) {
      quoteTotal = format.format({
        value: quoteTotal,
        type: format.Type.CURRENCY,
      });
    }
    var subtotalBef = subTotal
    if (subTotal) {
      subTotal = pembulatan(subTotal);
      subTotal = format.format({
        value: subTotal,
        type: format.Type.CURRENCY,
      });
    }

    if (subTotal2) {
      subTotal2 = pembulatan(subTotal2);
      subTotal2 = format.format({
        value: subTotal2,
        type: format.Type.CURRENCY,
      });
    }

    if (taxtotal) {
      taxtotal = pembulatan(taxtotal);
      taxtotal = format.format({
        value: taxtotal,
        type: format.Type.CURRENCY,
      });
    }
    if (total) {
      total = pembulatan(total);
      total = format.format({
        value: total,
        type: format.Type.CURRENCY,
      });
    }
    if (sendDate) {
      sendDate = format.format({
        value: sendDate,
        type: format.Type.DATE,
      });
    }

    var amountRecieved = Number(totalReceived) - Number(totalWHTaxToCount);
    amountRecieved = pembulatan(amountRecieved);
    if (amountRecieved) {
      amountRecieved = format.format({
        value: amountRecieved,
        type: format.Type.CURRENCY,
      });
    }

    var itemCount = dataRec.getLineCount({
      sublistId: "item",
    });
    var totalDiscount = 0
    var totalCost = 0
    if (itemCount > 0) {
      for (var index = 0; index < itemCount; index++) {
        var discLine = dataRec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_abj_disc_line",
          line: index,
        }) || 0
        totalDiscount += parseFloat(discLine)
        var itemId = dataRec.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: index,
        });
        if (itemId != '2880') {
          var itemPrice = dataRec.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: index,
          }) || 0;
          totalCost += parseFloat(itemPrice)
        }

      }
    }

    var discountHeader = dataRec.getValue("discountrate") || 0;
    totalDiscount = parseFloat(totalDiscount) + parseFloat(discountHeader)
    var taxTotalRate = (parseFloat(totalCost) - parseFloat(totalDiscount)) * 11 / 100;

    var customForm = dataRec.getValue('customform');

    var response = context.response;
    var xml = "";
    var header = "";
    var body = "";
    var headerHeight = "1%";
    var style = "";
    var footer = "";
    var pdfFile = null;
    var terms = "";
    var duedate = "";

    style += "<style type='text/css'>";
    style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
    style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
    if (subsidiari == 1) {
      style += ".tg .tg-img-logo{width:150px; height:111px; object-vit:cover;}";
    } else if(subsidiari == 38){ //rovers
      style += ".tg .tg-img-logo{width:195px; height:55px; object-vit:cover;}";
    } else {
      style += ".tg .tg-img-logo{width:195px; height:90px; object-vit:cover;}";
    }
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
    if (urlLogo) {
      body += "<td class='tg-headerlogo' style='width:70%;vertical-align:center; align:left;'><div style='display: flex; height:50px; width:50px;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
    }
    body += "<td valign='middle' style='font-weight:bold; align:center; font-size:18px; vertical-align:center;'>QUOTATION</td>"
    body += "</tr>";

    // body += "<tr style='height:30px;'>";
    // body += "</tr>";
    body += "</tbody>";
    body += "</table>";

    body += '<table class=\'tg\' width="100%" style="table-layout:fixed; font-size:11px;">';
    body += "<tbody>";
    body += "<tr>";
    body += "<td style='width:20%'></td>"
    body += "<td style='width:30%'></td>"
    body += "<td style='width:10%'></td>"
    body += "<td style='width:14%'></td>"
    body += "<td style='width:1%'></td>"
    body += "<td style='width:25%'></td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td colspan='2'>" + legalName + "</td>"
    body += "<td></td>"
    body += "<td>DATE</td>"
    body += "<td></td>"
    body += "<td style='align:right'>" + sendDate + "</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td rowspan='2' colspan='2'>" + addresSubsidiaries + "</td>"
    body += "<td></td>"
    body += "<td>JOB TITLE</td>"
    body += "<td></td>"
    body += "<td style='align:right'>" + jobTitle + "</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td></td>"
    body += "<td>JOB NO.</td>"
    body += "<td></td>"
    body += "<td style='align:right'>" + jobNumber + "</td>"
    body += "</tr>";

    body += "<tr style='hight:30px;'>";
    body += "<td colspan='5' style='height:30px'></td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td>ORDER BY</td>"
    body += "<td>" + custName + "</td>"
    body += "<td></td>"
    body += "<td>QUOTATION NO.</td>"
    body += "<td></td>"
    body += "<td style='align:right'>" + tranId + "</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td>CONTACT PERSON</td>"
    body += "<td>" + contPerson + "</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td>EMAIL</td>"
    body += "<td>" + cpEmail + "</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td>PHONE</td>"
    body += "<td>" + cpPhone + "</td>"
    body += "</tr>";

    body += "<tr style='hight:30px;'>";
    body += "<td colspan='5' style='height:30px'></td>"
    body += "</tr>";

    body += "</tbody>";
    body += "</table>";


    body += '<table class=\'tg\' width="100%" style="table-layout:fixed;">';
    body += "<tbody>";
    if (customForm == 143) {
      body += "<tr>";
      body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='5%'> No </td>";
      body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='30%'> Item </td>";
      body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='20%'> Complexity Level </td>";
      body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='21%'> Item Price </td>";
      body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='5%'> QTY </td>";
      body += "<td class='tg-head_body' style='border-right: 1px solid black; border-left: 1px solid black; background-color:#757575'  width='24%'> Total Costs </td>";
      body += "</tr>";
    } else {
      body += "<tr>";
      body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='5%'> No </td>";
      body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='35%'> Item </td>";
      body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='25%'> Item Price </td>";
      body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='10%'> QTY </td>";
      body += "<td class='tg-head_body' style='border-right: 1px solid black; border-left: 1px solid black; background-color:#757575'  width='25%'> Total Costs </td>";
      body += "</tr>";
    }

    body += getPOItem(context, dataRec, customForm);
    body += "<tr>";
    body += "<td style='border-top: 1px solid black;' colspan='6'></td>";
    body += "</tr>";

    body += "<tr style='height:20px;'></tr>";
    body += "</tbody>";
    body += "</table>";

    body += '<table class=\'tg\' width="100%" style="table-layout:fixed;">';
    body += "<tbody>";

    body += "<tr>";
    body += "<td style='width:55%'></td>"
    body += "<td style='width:5%'></td>"
    body += "<td style='width:20%'></td>"
    body += "<td style='width:20%'></td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td></td>"
    body += "<td></td>"
    body += "<td style='align:right'>TOTAL COST</td>"
    body += "<td style='align:right'>"+ currSym + "" + numberWithCommas(totalCost) + "</td>"
    body += "</tr>";
    if (totalDiscount != 0 || totalDiscount != '0') {
      body += "<tr>";
      body += "<td></td>"
      body += "<td></td>"
      body += "<td style='align:right'>TOTAL DISCOUNT</td>"
      body += "<td style='align:right'>"+ currSym + "" + numberWithCommas(Math.abs(totalDiscount)) + ")</td>"
      body += "</tr>";

      body += "<tr>";
      body += "<td></td>"
      body += "<td></td>"
      body += "<td style='align:right'>SUB TOTAL</td>"
      body += "<td style='align:right'>"+ currSym + "" + removeDecimalFormat(subTotal2) + "</td>"
      body += "</tr>";
    }
    body += "<tr>";
    body += "<td></td>"
    body += "<td></td>"
    body += "<td style='align:right'>VAT "+taxRate+"%</td>"
    body += "<td style='align:right'>"+ currSym + "" + removeDecimalFormat(taxtotal) + "</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td></td>"
    body += "<td></td>"
    body += "<td style='align:right'>GRAND TOTAL</td>"
    body += "<td style='align:right'>"+ currSym + "" + removeDecimalFormat(total) + "</td>"
    body += "</tr>";

    body += "<tr>";
    body += "<td style='height:20px' colspan='4'></td>"
    body += "</tr>";

    body += "</tbody>";
    body += "</table>";

    body += '<table class=\'tg\' width="100%" style="table-layout:fixed;">';
    body += "<tbody>";

    body += "<tr>";
    log.debug('termsCondition', termsCondition)
    if (termsCondition.includes('\n')) {
      log.debug('includes newline');
      termsCondition = termsCondition.replace(/(\r\n|\n)/g, "<br/>");
    }
    log.debug('termsCondition after', termsCondition)
    body += "<td>" + termsCondition + "</td>"
    body += "</tr>"
    body += "<tr>";
    body += "<td style='height:60px'></td>"
    body += "</tr>";

    body += "</tbody>";
    body += "</table>";

    body += '<table class=\'tg\' width="100%" style="table-layout:fixed; page-break-inside: avoid;">';
    body += "<tbody>";
    body += "<tr>";
    body += "<td style='width:50%'></td>"
    body += "<td style='width:50%'></td>"
    body += "</tr>";
    
    if(subsidiari==40){//marsx
      body += "<tr>";
      body += "<td>Proposed by,</td>"
      body += "<td>Approved by,</td>"
      body += "</tr>";
  
      body += "<tr>";
      body += "<td class='tg-headerlogo' style='width:70%;vertical-align:center; align:left;'><div style='display: flex; height:50px; width:50px; margin-left:30px;'><img class='' style='width:25%; height:25%;' src= '"  + signedUrl + "' ></img></div></td>";
      body += "<td></td>"
      body += "</tr>";
  
  
      body += "<tr>";
      body += "<td>Chandra Suteja (Director)</td>"
      body += "<td>(____________)</td>"
      body += "</tr>";
    } else {
      body += "<tr>";
      body += "<td>Proposed by,</td>"
      body += "<td>Approved by,</td>"
      body += "</tr>";
  
      body += "<tr>";
      body += "<td colspan='2' style='height:60px;'></td>"
      body += "</tr>";
  
  
      body += "<tr>";
      body += "<td>(____________)</td>"
      body += "<td>(____________)</td>"
      body += "</tr>";
    }
    
    body += "</tbody>";
    body += "</table>";


    footer += "<table class='tg' style='table-layout: fixed;'>";
    footer += "<tbody>";
    footer += "<tr class='tg-foot'>";
    footer += "<td style='align:left'>Quotation # " + jobNumber + "</td>";
    footer += "<td style='align:right'></td>";
    footer += "</tr>";
    footer += "</tbody>";
    footer += "</table>";

    var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
    xml += "<pdf>";
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
    xml += "\n</body>\n</pdf>";

    xml = xml.replace(/ & /g, " &amp; ");
    response.renderPdf({
      xmlString: xml,
    });
  }

  function generateTableHTML(sectionID, items, customForm) {
    var fieldLookUpSection = search.lookupFields({
      type: "customlist_abj_rate_card_section",
      id: sectionID,
      columns: ["name"],
    });
    var sectionName = fieldLookUpSection.name;
    let html = `<tr><td colspan="6" class='tg-b_body' style="border-right: 1px solid black; border-left: 1px solid black; background-color:#adacac">${sectionName}</td></tr>`;
    var no = 1;
    items.forEach((item, index) => {

      // html += `<tr>
      //           <td class='tg-b_body' style='border-left:1px solid black'>${no}</td>
      //           <td class='tg-b_body'>${item.itemText}</td>`;
      //added by kurnia
      if (customForm == 143) {
        html += `<tr>
                      <td class='tg-b_body' style='border-left:1px solid black'>${no}</td>
                      <td class='tg-b_body'>${item.itemText}</td>`;
      } else {
        html += `<tr>
                      <td class='tg-b_body' style='border-left:1px solid black'>${no}</td>
                      <td class='tg-b_body'>${item.description}</td>`;
      }
      //

      if (customForm == 143) {
        html += `<td class='tg-b_body' style='align:center'>${item.complexityLevel}</td>`;
        html += `<td class='tg-b_body' align="right">${item.currSym}${numberWithCommas(item.itemPrice)}</td>
                     <td class='tg-b_body' style='align:center'>${item.quantity}</td>`;
      } else {
        html += `<td class='tg-b_body' align="right">${item.currSym}${numberWithCommas(item.itemPrice)}</td>
                     <td class='tg-b_body' style='align:center'>${item.quantity}</td>`;
      }

      //added by kurnia
      html += `<td class='tg-b_body' style="border-right: 1px solid black; align:right;">${item.currSym}${removeDecimalFormat(item.totalCost)}</td>`;
      //
      //if (index === 0) {
      //html += `<td class='tg-b_body' style="border-right: 1px solid black; align:right;" rowspan="${items.length}">Rp. ${removeDecimalFormat(item.totalCost)}</td>`;
      //} else {
      // html += `<td class='tg-b_body' style="border-right: 1px solid black; align:right;" rowspan="${items.length}"></td>`;
      //}

      // html += `</tr>
      //          <tr>
      //               <td class='tg-b_body' style='border-left: 1px solid black'></td>
      //               <td class='tg-b_body'>${item.description}</td>`;

      //added by kurnia
      if (customForm == 143) {
        html += `</tr>
                  <tr>
                      <td class='tg-b_body' style='border-left: 1px solid black'></td>
                      <td class='tg-b_body'>${item.description}</td>`;
      }
      //

      if (customForm == 143) {
        html += `<td class='tg-b_body' style='border-right: 1px solid black' colspan="4"></td>`;
      } else {
        //html += `<td class='tg-b_body' style='border-right: 1px solid black' colspan="3"></td>`;
      }

      html += `</tr>
                 <tr>
                     <td class='tg-b_body' style='border-left: 1px solid black'></td>
                     <td class='tg-b_body' style='font-weight:bold;'>${item.remarks}</td>`;

      if (customForm == 143) {
        html += `<td class='tg-b_body' style='border-right: 1px solid black' colspan="4"></td>`;
      } else {
        html += `<td class='tg-b_body' style='border-right: 1px solid black' colspan="3"></td>`;
      }

      html += `</tr>`;

      if (item.discLine && item.discLine != 0) {
        html += `<tr>
                        <td class='tg-b_body' style='border-left: 1px solid black'></td>
                        <td class='tg-b_body' style=''>[Discount - ${item.prosDiscLine}%]</td>`;

        if (customForm == 143) {
          html += `<td class='tg-b_body' colspan="3"></td>`;
        } else {
          html += `<td class='tg-b_body' colspan="2"></td>`;
        }

        html += `<td class='tg-b_body' style='border-right: 1px solid black; align:right;'>Rp. (${numberWithCommas(item.discLine)})</td>
                    </tr>`;
      }

      no++;
    });
    return html;
  }





  var dataSection = [];
  var dataItem = [];

  function getPOItem(context, dataRec, customForm) {
    var itemCount = dataRec.getLineCount({
      sublistId: "item",
    });


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
    log.debug('symbol', currSym)

    if (itemCount > 0) {
      var body = "";
      for (var index = 0; index < itemCount; index++) {
        var account = dataRec.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: index,
        });
        var itemId = dataRec.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: index,
        });

        if (itemId != '2880') {
          if (account) {
            var itemText = dataRec.getSublistText({
              sublistId: "item",
              fieldId: "item",
              line: index,
            });
            var description = dataRec.getSublistValue({
              sublistId: "item",
              fieldId: "description",
              line: index,
            });
            var remarks = dataRec.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_abj_rate_card_line_item_rmrks",
              line: index,
            });
            var complexityLevel = dataRec.getSublistText({
              sublistId: "item",
              fieldId: "custcol_abj_complexity_level_line",
              line: index,
            });
            var itemPrice = dataRec.getSublistValue({
              sublistId: "item",
              fieldId: "rate",
              line: index,
            });
            var quantity = dataRec.getSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              line: index,
            });
            var totalCost = dataRec.getSublistText({
              sublistId: "item",
              fieldId: "amount",
              line: index,
            });
            var sectionID = dataRec.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_abj_rate_card_section_list",
              line: index,
            });
            var sectionName = dataRec.getSublistText({
              sublistId: "item",
              fieldId: "custcol_abj_rate_card_section_list",
              line: index,
            });
            var discLine = dataRec.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_abj_disc_line",
              line: index,
            }) || 0
            var prosDiscLine = Number(discLine) / Number(itemPrice) * 100
            dataSection.push(sectionName);
            dataItem.push({
              itemText: itemText,
              description: description,
              remarks: remarks,
              sectionID: sectionID,
              complexityLevel: complexityLevel,
              itemPrice: itemPrice,
              quantity: quantity,
              totalCost: totalCost,
              discLine: discLine,
              prosDiscLine: prosDiscLine,
              currSym: currSym
            });
          }
        }

      }
      dataSection = removeDuplicates(dataSection);
      const groupedItems = {};
      dataItem.forEach((item) => {
        if (!groupedItems[item.sectionID]) {
          groupedItems[item.sectionID] = [];
        }
        groupedItems[item.sectionID].push(item);
      });
      let tableHTML = "";
      for (const sectionID in groupedItems) {
        tableHTML += generateTableHTML(sectionID, groupedItems[sectionID], customForm);
      }
      body += tableHTML;
      return body;
    }
  }
  return {
    onRequest: onRequest,
  };
});
