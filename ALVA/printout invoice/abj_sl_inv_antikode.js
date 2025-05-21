/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function (render, search, record, log, file, http, config, format, email, runtime) {
        try {
            function formatIndonesianDate(dateString) {
                const months = [
                    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                ];
                const days = [
                    "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
                ];
                const [day, month, year] = dateString.split("/").map(Number);
                const dateObj = new Date(year, month - 1, day);
            
                const dayName = days[dateObj.getDay()];
                const monthName = months[month - 1];
            
                return `${dayName}, ${day} ${monthName} ${year}`;
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
            function removeDecimalFormat(value) {
                return value.split('.')[0];
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
                //   if (addresSubsidiaries.includes("<br>")) {
                //     addresSubsidiaries = addresSubsidiaries.replace(/<br>/g, "");
                //   }
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
                
                log.debug('InvDate', InvDate)
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
                log.debug('nameSignatured', nameSignatured)
                var template = invoiceRecord.getText({ name :'custbody10'});
                var terms = invoiceRecord.getValue({ name :"terms"}) || '';
                var fakturPajak = invoiceRecord.getValue({ name :"custbody_fcn_faktur_pajak"});
                var subTotal = invoiceRecord.getValue({name: "formulacurrency",
                    formula: "{totalamount}+{taxtotal}",}) || 0;
                var taxtotal = invoiceRecord.getValue({ name :"taxtotal"}) || 0;
                var taxtotalCount = 0;
                var poTotal = invoiceRecord.getValue({ name :"total"}) || 0;
                var total = 0;
                var amountReceive = 0;
                var duedate = invoiceRecord.getValue({ name :"duedate"});
                var prosentDiscount = invoiceRecord.getValue({ name :"discountrate"});
                var discount = invoiceRecord.getValue({ name :"discounttotal"}) || 0;
                var jobNumber = invoiceRecord.getValue({ name :"custbody_abj_custom_jobnumber"});
                if (jobNumber.includes("\\")) {
                    jobNumber = jobNumber.replace(/\\/g, "<br/>");
                }
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
          
                var allDataLine = []
                var projectName = ""
                var taxpphList = [];
                var totalQty = 0
                if (countItem.length > 0) {
                    for (var i = 0; i < countItem.length; i++) {
                        var lineRec = countItem[i];
                        // dataLine
                        var description = lineRec.getText({
                            name: "item",
                        });
                        var rate = lineRec.getValue({
                            name: "rate",
                        });
                        var ammount = lineRec.getValue({
                            name: "amount",
                        });
                        var quantity = lineRec.getValue({
                            name: "quantity",
                        });
                        totalQty = Number(totalQty) + Number(quantity)
                        allDataLine.push({
                            description: description,
                            ammount: ammount,
                            rate : rate,
                            quantity : quantity
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
                var totalBeforeFormat = total
                if (total) {
                    total = pembulatan(total);
                    total = format.format({
                        value: total,
                        type: format.Type.CURRENCY,
                    });
                    total = removeDecimalFormat(total);
                }
          
                if (duedate) {
                    function sysDate() {
                        var date = new Date(duedate); 
                        if (isNaN(date.getTime())) { 
                            return duedate; 
                        }
                
                        var tdate = date.getUTCDate();
                        var month = date.getUTCMonth() + 1; 
                        var year = date.getUTCFullYear();
                        return tdate + "/" + month + "/" + year;
                    }
                    duedate = sysDate();
                }
              
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = "0%";
                var style = "";
                var footer = "";
                var pdfFile = null;
                if(jobNumber.includes('&')){
                    jobNumber = jobNumber.replace(/&/g, '&amp;');
                }
                style += "<style type='text/css'>";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%; font-family: sans-serif}";
                style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
           
                style += ".tg .tg-img-logo{width:150px; height:150px; object-vit:cover;}";
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-garis{align: right;font-size:12px; border :1px solid black; }";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
                style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
                style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += "</style>";
                
    
                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";
    
                body += "<table class='tg' width='100%' style='table-layout:fixed;'>";
                body += "<tbody>";
                
                body += "<tr>";
                body += "<td style='width:25%;'></td>";
                body += "<td style='width:40%;'></td>";
                body += "<td style='width:35%;'></td>";
                body += "</tr>";
                
                body += "<tr>";
                if (urlLogo) {
                    body += "<td class='tg-headerlogo' style='vertical-align:center; align:left; margin-left:0;' rowspan='4' ><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                }
                body += "<td style='text-align:left;'>Antikode</td>";
                body += "<td style=' font-size:60px; text-align:right; font-weight:bold;'></td>";
                body += "</tr>";
                
                body += "<tr>";
                body += "<td style='text-align:left;'>" + addresSubsidiaries + "</td>";
                body += "<td style=' font-size:60px; text-align:right; font-weight:bold;'></td>";
                body += "</tr>";

                body += "<tr>";
                body += "<td style='text-align:left;'>finance@antikode</td>";
                body += "<td style=' font-size:60px; text-align:right; font-weight:bold;'></td>";
                body += "</tr>";

                body += "<tr>";
                body += "<td style='text-align:left;'>http://www.antikode.com</td>";
                body += "<td style=' font-size:60px; text-align:right; font-weight:bold;'></td>";
                body += "</tr>";
                
              
                
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width='100%' style='table-layout:fixed;'>";
                body += "<tbody>";
                
                body += "<tr>";
                body += "<td style='width:40%;'></td>";
                body += "<td style='width:20%;'></td>";
                body += "<td style='width:40%;'></td>";
                body += "</tr>";

                body += "<tr>";
                body += "<td style='text-align:left; font-weight:bold;'>BILL TO</td>";
                body += "<td style='text-align:left; font-weight:bold;'></td>";
                body += "<td style='background-color:#212841FF; color:#FAFBFD; font-size:16px; text-align:right; font-weight:bold;height:40px; margin-bottom:10px;' rowspan='2'>INVOICE " + tandId + "</td>";
                body += "</tr>";

                body += "<tr>";
                body += "<td style='text-align:left;'>"+custName+"</td>";
                body += "<td style='text-align:left; font-weight:bold;'></td>";
                body += "</tr>";

                body += "<tr>";
                body += "<td style='text-align:left;' rowspan='2'>"+custAddres+"</td>";
                body += "<td style='text-align:left; font-weight:bold;'></td>";
                body += "<td style='background-color:#212841FF; color:#FAFBFD; font-size:16px; text-align:right; font-weight:bold;height:40px; margin-bottom:10px;'>DATE <span style='font-size:10px; font-weight:none;vertical-align:center;' >" + InvDate + "</span><span style='font-size:16px; font-weight:bold; padding-left:5px;'>TERMS <p style='font-weight:none;font-size:10px;'>"+terms+"</p></span></td>";
                body += "</tr>";

                body += "<tr>";
                body += "<td style='text-align:left; font-weight:bold;'></td>";
                body += "<td style='background-color:#212841FF; color:#FAFBFD; font-size:16px; text-align:right; font-weight:bold;height:40px;'>DUE DATE <span style='font-size:10px; font-weight:none;vertical-align:center;' >" + duedate + "</span></td>";
                body += "</tr>";

                body += "<tr>";
                body += "<td style='height:5px; background-color:#212841FF;' colspan='3'></td>";
                body += "</tr>";

                body += "</tbody>";
                body += "</table>";
                

    
                body+= "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
                body+= "<tbody>";
             
                body += "<tr>";
                body += "<td style='width:40%;'></td>";
                body += "<td style='width:10%;'></td>";
                body += "<td style='width:20%;'></td>";
                body += "<td style='width:30%;'></td>";
                body += "</tr>";

                body += "<tr style='height:30px;'>";
                body += "<td style='padding-left:10px; background-color:#212841FF; color:#FAFBFD; vertical-align: middle;'>ACTIVITY</td>";
                body += "<td style='background-color:#212841FF; color:#FAFBFD; vertical-align: middle;'>QTY</td>";
                body += "<td style='background-color:#212841FF; color:#FAFBFD; align: right; vertical-align: middle;'>RATE</td>";
                body += "<td style='padding-right:10px; background-color:#212841FF; color:#FAFBFD; align: right; vertical-align: middle;'>AMOUNT</td>";
                body += "</tr>";

                body+= getPOItem(context, allDataLine)
                var qtyVat = (11/12) * totalQty;
                log.debug('qtyVat', qtyVat)
                log.debug('total', total)
                var amountVat = (11/12) * Number(totalBeforeFormat);
                log.debug('amountVat', amountVat)
                var totalVat = Number(amountVat) * Number(qtyVat)
                if (amountVat) {
                    amountVat = format.format({
                        value: amountVat,
                        type: format.Type.CURRENCY,
                    });
                    amountVat = removeDecimalFormat(amountVat);
                }
                if (totalVat) {
                    totalVat = format.format({
                        value: totalVat,
                        type: format.Type.CURRENCY,
                    });
                    totalVat = removeDecimalFormat(totalVat);
                }
                body += "<tr>";
                body += "<td style='font-weight:bold;'>VAT 12%</td>";
                body += "<td style=''>"+qtyVat.toFixed(2)+"</td>";
                body += "<td style='align:right;'>"+amountVat+"</td>";
                body += "<td style='align:right;'>"+totalVat+"</td>";
                body += "</tr>";

                body+= "</tbody>";
                body+= "</table>";

                body += "<table class='tg' style='table-layout: fixed;'>";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:40%;'></td>"
                body += "<td style='width:30%;'></td>"
                body += "<td style='width:30%;'></td>"
                body += "</tr>";

                body += "<tr style='padding-top:10px'>";
                body += "<td style=''>Payment to :</td>"
                body += "<td style='align:right'></td>"
                body += "<td style='align:right'></td>"
                body += "</tr>";

                body += "<tr style='padding-top:20px'>";
                body += "<td style='font-weight:bold;font-size:14px;'>"+bankNameRec+"</td>"
                body += "<td style='align:center;' colspan='2'></td>"
                body += "</tr>";

                body += "<tr style=''>";
                body += "<td style='font-weight:bold;font-size:14px;'>"+bankAccName +"</td>"
                body += "<td style='align:center;' colspan='2'></td>"
                body += "</tr>";

                body += "<tr style=''>";
                body += "<td style='font-weight:bold;font-size:14px;'>"+bankAccNo +"</td>"
                body += "<td style='align:center;' colspan='2'></td>"
                body += "</tr>";

                body += "<tr style=''>";
                body += "<td></td>"
                body += "<td style='align:right; vertical-align:middle;background-color:#212841FF;color:#FAFBFD;padding-right:40px;' rowspan='2'>TOTAL DUE</td>"
                body += "<td style='font-weight:bold;font-size:20px;background-color:#212841FF;color:#FAFBFD;padding-left:20px;'>"+total+"</td>"
                body += "</tr>";

                body += "<tr style=''>";
                body += "<td></td>"
                body += "<td style='font-weight:bold;font-size:20px;background-color:#212841FF;color:#FAFBFD;padding-left:20px;'>"+tlcCurr+"</td>"
                body += "</tr>";

                 body+= "</tbody>";
                body+= "</table>";




                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr>";
                footer += "<td style='width:40%;'></td>"
                footer += "<td style='width:30%;'></td>"
                footer += "<td style='width:30%;'></td>"
                footer += "</tr>";

                footer += "<tr style=''>";
                footer += "<td style='font-weight:bold;font-size:20px;'></td>"
                footer += "<td style='align:right;' colspan='2'>"+nameSignatured+"</td>"
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
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='25%'>";
                xml += body;
                xml += "\n</body>\n</pdf>";
    
                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });
            }
        }catch(e){
            log.debug('error',e)
        }
        return {
            onRequest: onRequest,
        };
        function getPOItem(context, allDataLine){
            var body = "";
            allDataLine.forEach(data => {
                var description = data.description;
                var amount = data.ammount;
                var quantity = data.quantity
                var rate = data.rate
                if (amount) {
                    amount = format.format({
                        value: amount,
                        type: format.Type.CURRENCY,
                    });
                    amount = removeDecimalFormat(amount);
                }
                if (rate) {
                    rate = format.format({
                        value: rate,
                        type: format.Type.CURRENCY,
                    });
                    rate = removeDecimalFormat(rate);
                }
                body += "<tr>";
                body += "<td  style=''>"+escapeXmlSymbols(description)+"</td>";
                body += "<td  style=''>"+quantity+"</td>";
                body += "<td  style='align:right;'>"+rate+"</td>";
                body += "<td  style='align:right;'>"+amount+"</td>";
                body += "</tr>";
            });
            return body

        }
    });
