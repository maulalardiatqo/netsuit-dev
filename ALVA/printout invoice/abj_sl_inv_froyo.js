/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", "N/config", "N/format", "N/email", "N/runtime"], function (render, search, record, log, file, http, config, format, email, runtime) {
    try {
      function removeDecimalFormat(value) {
        return value.split(".")[0];
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
      function onRequest(context) {
        var recid = context.request.parameters.id;
  
        // load SO
        var invSearch = search.load({
            id: "customsearch_invoice_print_body",
        });
        if(recid){
            invSearch.filters.push(search.createFilter({name: "internalid", operator: search.Operator.IS, values: recid}));
        }
        var invSearchSet = invSearch.run();
        var result = invSearchSet.getRange(0, 1);
        var invoiceRecord = result[0];
        var bankInfo = invoiceRecord.getValue('custbody13');
        var bankNameRec = ''
        var bankAccNo = ''
        var bankAccName = ''
        if(bankInfo){
            var recBank = record.load({
                type : "customrecord_fcn_bank_inforatikon",
                id : bankInfo
            });
            bankNameRec = recBank.getValue('custrecord_fcn_bi_bank_name');
            bankAccName = recBank.getValue('custrecord3');
            bankAccNo = recBank.getValue('custrecordbank_number')
        }
        var currenc = invoiceRecord.getValue({ name : "currency"});
        if (currenc) {
          var recCurrenc = record.load({
            type: "currency",
            id: currenc,
            isDynamic: false,
          });
          var tlcCurr = recCurrenc.getValue("symbol");
        }
        var crFrom = invoiceRecord.getValue({ name :"createdfrom"});
        var subsidiari = invoiceRecord.getValue({ name : "subsidiary"});
        // load subsidiarie
        if (subsidiari) {
          var subsidiariRec = record.load({
            type: "subsidiary",
            id: subsidiari,
            isDynamic: false,
          });
          // load for header
          var legalName = subsidiariRec.getValue("legalname");
          var addresSubsidiaries = subsidiariRec.getValue("mainaddress_text");
          var name = subsidiariRec.getValue("name");
          var retEmailAddres = subsidiariRec.getValue("email");
          var Npwp = subsidiariRec.getValue("custrecord_fcn_npwppgrs");
  
          var bankName = subsidiariRec.getValue("custrecord_fcn_sub_bank_name");
          var swiftCode = subsidiariRec.getValue("custrecord_fcn_sub_swift_code");
          var bankBranch = subsidiariRec.getValue("custrecord_fcn_sub_bank_branch");
          var bankBranch2 = subsidiariRec.getValue("custrecord_fcn_sub_bank_branch2");
          var bankBranch3 = subsidiariRec.getValue("custrecord_fcn_sub_bank_branch3");
          var accountNo = subsidiariRec.getValue("custrecord_fcn_sub_account_number");
          var accountNo2 = subsidiariRec.getValue("custrecord_fcn_sub_account_number2");
          var accountNo3 = subsidiariRec.getValue("custrecord_fcn_sub_account_number3");
          var paymentReferences = subsidiariRec.getValue("custrecord_fcn_sub_payment_reference");
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
          var fileLogoFroyo = file.load({
            id: 55785,
          });
          if(fileLogoFroyo){
            logoFroyo = fileLogoFroyo.url.replace(/&/g, "&amp;");
          }
          if (addresSubsidiaries.includes("<br>")) {
            addresSubsidiaries = addresSubsidiaries.replace(/<br>/g, "");
          }
          if (name) {
            addresSubsidiaries = addresSubsidiaries.replace(name, "");
          }
        }
  
        // load vendor
        var customer_id = invoiceRecord.getValue({name: "internalid",
            join: "customer",});
        log.debug("customer_id", customer_id);
        if (customer_id) {
          var customerRecord = record.load({
            type: "customer",
            id: customer_id,
            isDynamic: false,
          });
          var isperson = customerRecord.getValue("isperson");
          var custName = "";
          if (isperson == "T") {
            var firstname = customerRecord.getValue("firstname") || "";
            var middleName = customerRecord.getValue("middlename") || "";
            var lastname = customerRecord.getValue("lastname") || "";
            custName = firstname + " " + middleName + " " + lastname;
          } else {
            var check = customerRecord.getValue("isautogeneratedrepresentingentity");
  
            if (check === true) {
              custName = customerRecord.getValue("comments");
            } else {
              custName = customerRecord.getValue("companyname");
            }
          }
          var custAddres = customerRecord.getValue("billaddr1");
          if (custAddres === "") {
            custAddres = customerRecord.getValue("defaultaddress");
          }
          log.debug("custAdress", custAddres);
          if (custAddres.includes("&")) {
            custAddres = custAddres.replace(/&/g, "dan");
          }
          log.debug("custAdress after", custAddres);
          var custEmail = customerRecord.getValue("email");
          var taxRegNo = customerRecord.getValue("vatregnumber");
          var count = customerRecord.getLineCount({
            sublistId: "submachine",
          });
  
          for (var i = 0; i < count; i++) {
            var subsidiary = customerRecord.getSublistValue({
              sublistId: "submachine",
              fieldId: "subsidiary",
              line: i,
            });
  
            if (subsidiary == subsidiari) {
              var balance = customerRecord.getSublistValue({
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
          balance = removeDecimalFormat(balance);
        }
        // PO data
        var tandId = invoiceRecord.getValue({ name : "tranid"});
        var InvDate = invoiceRecord.getValue({ name : "trandate"});
        var signaturedBy = invoiceRecord.getValue({ name :'custbody11'});
        var nameSignatured = ''
        if(signaturedBy){
            var recEmp = record.load({
                type : "employee",
                id : signaturedBy,
                isDynamic : true
            })
            var fName = recEmp.getValue('firstname');
            var mName = recEmp.getValue('middlename');
            var lName = recEmp.getValue('lastname');
            var nameEmp = fName + " " + mName + " " + lName 
            nameSignatured = nameEmp
        }
        var template = invoiceRecord.getText({ name :'custbody10'});
        var terms = invoiceRecord.getText({ name :"terms"});
        var fakturPajak = invoiceRecord.getValue({ name :"custbody_fcn_faktur_pajak"});
        var subTotal = invoiceRecord.getValue({name: "formulacurrency",
            formula: "{totalamount}+{taxtotal}",}) || 0;
        var taxtotal = invoiceRecord.getValue({ name :"taxtotal"}) || 0;
        log.debug('taxtotal', taxtotal)
        var taxtotalCount = 0;
        var poTotal = invoiceRecord.getValue({ name :"total"}) || 0;
        log.debug('poTotal', poTotal)
        var total = 0;
        var amountReceive = 0;
        var duedate = invoiceRecord.getValue({ name :"duedate"});
        var prosentDiscount = invoiceRecord.getValue({ name :"discountrate"});
        var discount = invoiceRecord.getValue({ name :"discounttotal"}) || 0;
        var jobNumber = invoiceRecord.getValue({ name :"custbody_abj_custom_jobnumber"});
        if (jobNumber.includes("\\")) {
            log.debug("ada tanda");
            jobNumber = jobNumber.replace(/\\/g, "<br/>");
        }
        log.debug('jobNumber',jobNumber)
        if(jobNumber == ''){
            jobNumber = tandId
        }
  
        var bankNumber = invoiceRecord.getText({ name :'custbody8'})
        var bankDetail = invoiceRecord.getText({ name :'custbody9'})
  
        var otehrRefNum = invoiceRecord.getValue({ name :"otherrefnum"});
        discount = Math.abs(discount);
        prosentDiscount = Math.abs(prosentDiscount);
        var totalWhTaxamount = 0;
        var totalWhTaxamountItem = 0;
        var whtaxammountItem = 0;
        var whTaxCodetoPrint = "";
        
        var searchLine = search.load({
            id : "customsearch_invoice_print_line"
        })
        if(recid){
            searchLine.filters.push(search.createFilter({name: "internalid", operator: search.Operator.IS, values: recid}));
        }
        var itemSearchSet = searchLine.run();
        var countItem = itemSearchSet.getRange(0, 100);
        log.debug('countItem', countItem.length)
  
        var allDataLine = []
        var projectName = ""
        var taxpphList = [];
        if (countItem.length > 0) {
            for (var i = 0; i < countItem.length; i++) {
                var lineRec = countItem[i];
                // dataLine
                var description = lineRec.getValue({
                    name: "memo",
                });
                var ammount = lineRec.getValue({
                    name: "amount",
                });
                log.debug('ammount', ammount)
                allDataLine.push({
                    description: description,
                    ammount: ammount,
                })
  
                var taxpph = lineRec.getValue({
                    name: "custcol_4601_witaxrate",
                });
                whtaxammountItem = lineRec.getValue({
                    name: "custcol_4601_witaxamount",
                });
                var project = lineRec.getText({
                    name: "class",
                });
                log.debug('project', project)
                if(project){
                    projectName = project
                }
                var whTaxCodeI = lineRec.getValue({
                    name: "custcol_4601_witaxcode",
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
                var tamount = whtaxammountItem;
                whtaxammountItem = Math.abs(tamount);
                totalWhTaxamountItem += whtaxammountItem;
    
                if (taxpph) {
                    if (taxpphList.indexOf(taxpph) == -1) {
                        taxpphList.push(taxpph);
                    }
                }
            }
        }
        totalWhTaxamount = totalWhTaxamountItem;
        log.debug('taxpphList', taxpphList)
        if (taxpphList.length > 0) {
            var taxpphToPrint = taxpphList.join(" & ");
        }
        var subBefore = subTotal;
        var taxtotalBefor = taxtotal;
        total = Number(subBefore) + Number(taxtotalBefor);
        amountReceive = total;
        if (taxpphToPrint) {
            amountReceive = amountReceive - totalWhTaxamount;
        }
        if (totalWhTaxamount) {
            totalWhTaxamount = pembulatan(totalWhTaxamount);
            totalWhTaxamount = format.format({
                value: totalWhTaxamount,
                type: format.Type.CURRENCY,
            });
            totalWhTaxamount = removeDecimalFormat(totalWhTaxamount);
        }
        if (amountReceive) {
            amountReceive = pembulatan(amountReceive);
            amountReceive = format.format({
                value: amountReceive,
                type: format.Type.CURRENCY,
            });
            amountReceive = removeDecimalFormat(amountReceive);
        }
        if (poTotal) {
            poTotal = pembulatan(poTotal);
            poTotal = format.format({
                value: poTotal,
                type: format.Type.CURRENCY,
            });
            poTotal = removeDecimalFormat(poTotal);
        }
        if (discount) {
            discount = pembulatan(discount);
            discount = format.format({
                value: discount,
                type: format.Type.CURRENCY,
            });
            discount = removeDecimalFormat(discount);
        }
  
        if (subTotal) {
            subTotal = pembulatan(subTotal);
            subTotal = format.format({
                value: subTotal,
                type: format.Type.CURRENCY,
            });
            subTotal = removeDecimalFormat(subTotal);
        }
  
        if (taxtotal) {
            taxtotal = pembulatan(taxtotal);
            taxtotal = format.format({
                value: taxtotal,
                type: format.Type.CURRENCY,
            });
            taxtotal = removeDecimalFormat(taxtotal);
        }
  
        if (total) {
            total = pembulatan(total);
            total = format.format({
                value: total,
                type: format.Type.CURRENCY,
            });
            total = removeDecimalFormat(total);
        }
  
        if (duedate) {
          log.debug('duedate', duedate)
          function sysDate() {
              var date = new Date(duedate); 
              log.debug('date', date)
              if (isNaN(date.getTime())) { 
                  log.debug('Invalid Date', duedate);
                  return duedate; // Kembalikan nilai asli jika tidak valid
              }
      
              var tdate = date.getUTCDate();
              var month = date.getUTCMonth() + 1; // jan = 0
              var year = date.getUTCFullYear();
              return tdate + "/" + month + "/" + year;
          }
          duedate = sysDate();
      }
        if (InvDate) {
            InvDate = format.format({
                value: InvDate,
                type: format.Type.DATE,
            });
        }
        var response = context.response;
        var xml = "";
        var header = "";
        var body = "";
        var headerHeight = "1%";
        var style = "";
        var footer = "";
        var pdfFile = null;
        if (jobNumber.includes("&")) {
            log.debug("masuk");
            jobNumber = jobNumber.replace(/&/g, "&amp;");
        }
        style += "<style type='text/css'>";
        style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%; font-family: Tahoma, 'Trebuchet MS', sans-serif;}";
        style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
        if (subsidiari == 1) {
            style += ".tg .tg-img-logo{width:150px; height:111px; object-vit:cover;}";
        } else {
            style += ".tg .tg-img-logo{width:195px; height:70px; object-vit:cover;}";
        }
        style += ".tg .tg-img-logo-froyo {width:195px; height:70px; object-fit:cover;left:-13px}";
        style += ".tg .tg-headerrow{align: right;font-size:12px;}";
        style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
        style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
        style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
        style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
        style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
        style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
        style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
        style += "</style>";
  
        header += '<table class=\'tg\' width="100%"  style="table-layout:fixed;">';
        header += "<tbody>";
        header += "</tbody>";
        header += "</table>";
  
        body += `
        <table class="tg" width="100%" style="table-layout:fixed;">
        <tbody>
          <tr>
              <td>
                  <h1 style="color:red;">Hello</h1>
                  <h5 style="font-weight: bold;"><b>THIS IS YOUR INVOICE</b></h5>
                  <p>If  you would have any question <br/>about this invoice, please <br/>contact us. Thanks!</p>
              </td>
  
              <td width="400">
                  <b>${legalName + " " +template}</b>
                  <table width="100%">
                      <tr>
                          <td width="100">Date</td>
                          <td width="20">:</td>
                          <td>${InvDate}</td>
                      </tr>
                      <tr>
                          <td width="100">Client</td>
                          <td width="20">:</td>
                          <td>${custName}</td>
                      </tr>
                      <tr>
                          <td width="100">Job Number</td>
                          <td width="20">:</td>
                          <td>${jobNumber}</td>
                      </tr>
                      <tr>
                          <td width="100" valign="top" >Address</td>
                          <td width="20" valign="top">:</td>
                          <td>${custAddres}</td>
                      </tr>
                      <tr>
                          <td width="100">Due Date</td>
                          <td width="20">:</td>
                          <td>${duedate}</td>
                      </tr>
                  </table>
              </td>
              <td>
                  <b>Payment should be made to the bank details :</b> <br/>
                  ${bankNameRec ? bankNameRec : bankDetail}
                  <br/><br/>
                  <b>Account Name</b><br/>
                  ${bankAccName ? bankAccName : bankName}
                  <br/><br/>
                  <b>Account Number</b><br/>
                  ${bankAccNo ? bankAccNo : bankNumber}
              </td>
          </tr>
        </tbody>
        </table>
        <p><b>Project : ${projectName}</b></p>
          <table width="100%">
              <tr>
                  <td width="600" background="#ADADAD" style="font-size:12px"><b>PROJECT BREAKDOWN</b></td>
                  <td background="#ADADAD" style="font-size:12px">&nbsp;</td>
                  <td background="#ADADAD" style="font-size:12px"><b>SUBTOTAL</b></td>
              </tr>
              <tr>
                  <td colspan="3" style="font-weight:bold;">${projectName}</td>
              </tr>
              ${getPOItem(context, invoiceRecord, allDataLine)}
              
              <tr>
                  <td></td>
                  <td></td>
                  <td></td>
              </tr>
              <tr>
                  <td></td>
                  <td></td>
                  <td></td>
              </tr>
              <tr>
                  <td></td>
                  <td></td>
                  <td></td>
              </tr>
              <tr>
                  <td></td>
                  <td></td>
                  <td></td>
              </tr>
              <tr>
                  <td></td>
                  <td></td>
                  <td></td>
              </tr>
              <tr>
                  <td>SUBTOTAL</td>
                  <td>Rp</td>
                  <td align="right">${subTotal}</td>
              </tr>
              <tr>
                  <td>TAX 11%</td>
                  <td>Rp</td>
                  <td align="right"> ${taxtotal}</td>
              </tr>
              <tr>
                  <td>GRAND TOTAL</td>
                  <td>Rp</td>
                  <td align="right"> ${total}</td>
              </tr>
              <tr>
                  <td style="border-bottom: 2px solid black;"></td>
                  <td style="border-bottom: 2px solid black;"></td>
                  <td style="border-bottom: 2px solid black;"></td>
              </tr>
          </table>
        `;
  
        footer += `
        <table class='tg' style='table-layout: fixed;'>
          <tbody>
              <tr>
              <td width="30%"></td>
              <td width="70%"></td>
              </tr>
              <tr style='height:70px;'></tr>
              <tr>
                <td><img class="tg-img-logo-froyo" src="${urlLogo}" ></img></td>
                <td align="right" rowspan='2'>
                      <table>
                          <tr>
                              <td align="center">Jakarta,${InvDate}</td>
                          </tr>
                          <tr>
                              <td align="center">Approval,</td>
                          </tr>
                          <tr>
                              <td align="center">&nbsp;</td>
                          </tr>
                          <tr>
                              <td align="center">&nbsp;</td>
                          </tr>
                          <tr>
                              <td align="center">&nbsp;</td>
                          </tr>
                          <tr>
                              <td align="center">&nbsp;</td>
                          </tr>
                          <tr>
                                <td align="center">( ${nameSignatured ? nameSignatured : '______________'} )</td>
                          </tr>
                      </table>
                  </td>
              </tr>
              <tr>
                 <td style="font-size:9px">
                  <p>
                    Office 8 Level 18A<br/>
                    Jl. Senopati No.88<br/>
                    Kebayoran Baru<br/>
                    Jakarta Selatan 12190<br/>
                    https://sites.google.com/froyo.co.id/lifeatfroyo<br/>
                    NPWP: ${Npwp}
                  </p>
                </td>
                  <td></td>
              </tr>
          </tbody>
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
        xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 21cm; width: 29.7cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='25%'>";
        xml += body;
        xml += "\n</body>\n</pdf>";
  
        xml = xml.replace(/ & /g, " &amp; ");
        response.renderPdf({
          xmlString: xml,
        });
      }
  
      function getPOItem(context, invoiceRecord, allDataLine) {
        var cekDataLine = allDataLine.length
        if(cekDataLine > 0){
            var body = "";
            var no = 1;
            allDataLine.forEach(data => {
                var description = data.description;
                var amount = data.ammount;
                
                if (description.includes("\\")) {
                    log.debug("ada tanda");
                    description = description.replace(/\\/g, "<br/>");
                }
                if (description.includes("$") && description.includes("$$")) {
                    log.debug("masuk $");
                    description = description.replace(/\$(.*?)\$\$/g, "<b>$1</b>");
                }
                if (description.includes("#") && description.includes("##")) {
                    log.debug("masuk #");
                    description = description.replace(/\#(.*?)\#\#/g, "<i>$1</i>");
                }
                if (description.includes("*") && description.includes("**")) {
                    log.debug("masuk *");
                    description = description.replace(/\*(.*?)\*\*/g, "<u>$1</u>");
                }
      
                log.debug('description',description)
  
                if (amount) {
                    amount = pembulatan(amount);
                    amount = format.format({
                        value: amount,
                        type: format.Type.CURRENCY,
                    });
                    amount = removeDecimalFormat(amount);
                }
        
                body += `
                    <tr>
                        <td>-${description}</td>
                        <td>Rp</td>
                        <td align="right">${amount}</td>
                    </tr>
                `
                no++;
                
            });
            return body;
        }
  
        }
    } catch (e) {
        log.debug("error", e);
    }
  
    return {
      onRequest: onRequest,
    };
  });
  