/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function (render, search, record, log, file, http, config, format, email, runtime) {
        try {
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
                var memoHead = invoiceRecord.getValue({name : "memo"});
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
                var currenc = invoiceRecord.getValue({ name : 'currency'});
                var tlcCurr = ''
                if (currenc) {
                    var recCurrenc = record.load({
                        type: 'currency',
                        id: currenc,
                        isDynamic: false
                    });
                    tlcCurr = recCurrenc.getValue('symbol');

                }
                var crFrom = invoiceRecord.getValue({ name : 'createdfrom'});
                var fromSo = ''
                if(crFrom){
                    var recSo = record.load({
                        type : 'salesorder',
                        id : crFrom,
                        isDynamic : true
                    });
                    var SoFrom = recSo.getText('createdfrom');
                    if(SoFrom){
                        fromSo = SoFrom
                    }
                }
                if(fromSo){
                    if (fromSo.includes('Quotation')) {
                        fromSo = fromSo.replace(/Quotation/g, '');
                    }
                }
                
                var subsidiari = invoiceRecord.getValue({ name : 'subsidiary'});
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
                    if (addresSubsidiaries) {
                        if (addresSubsidiaries.includes('&')) {
                            addresSubsidiaries = addresSubsidiaries.replace(/&/g, 'dan');
                        }
                    }
                    var name = subsidiariRec.getValue('name');
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
                if (customer_id) {
                    var customerRecord = record.load({
                        type: "customer",
                        id: customer_id,
                        isDynamic: false,
                    });
                    var isperson = customerRecord.getValue('isperson');
                    var custName = ''
                    if (isperson == 'T') {
                        var firstname = customerRecord.getValue('firstname') || ''
                        var middleName = customerRecord.getValue('middlename') || ''
                        var lastname = customerRecord.getValue('lastname') || ''
                        custName = firstname + ' ' + middleName + ' ' + lastname

                    } else {
                        var check = customerRecord.getValue('isautogeneratedrepresentingentity');


                        if (check === true) {
                            custName = customerRecord.getValue('comments')
                        } else {
                            custName = customerRecord.getValue('companyname');
                        }
                    }
                    var custAddres = customerRecord.getValue('defaultaddress');
                    if (custAddres === '') {

                        custAddres = customerRecord.getValue('defaultaddress');
                        log.debug('custAddres', custAddres);

                    }
                    if (custAddres.includes('&')) {
                        custAddres = custAddres.replace(/&/g, 'dan');
                    }
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

                if (balance) {
                    balance = format.format({
                        value: balance,
                        type: format.Type.CURRENCY
                    });
                    balance = removeDecimalFormat(balance);
                }
                // PO data
                var tandId = invoiceRecord.getValue({ name : 'tranid'});
                var InvDate = invoiceRecord.getValue({ name : 'trandate'});
                log.debug('InvDate', InvDate)
                var signaturedBy = invoiceRecord.getValue({ name : 'custbody11'});
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
                var template = invoiceRecord.getText('custbody10');
                var memo = invoiceRecord.getText('memo') || "";
                var totalTax = invoiceRecord.getValue({ name : 'taxtotal'})
                var terms = invoiceRecord.getText('terms');
                var fakturPajak = invoiceRecord.getValue('custbody_fcn_faktur_pajak');
                var taxtotal = invoiceRecord.getValue({ name : 'taxtotal'}) || 0;
                var taxtotalCount = 0;
                var poTotal = invoiceRecord.getValue({ name : 'total'}) || 0;
                var total = 0;
                var amountReceive = 0;
                var duedate = invoiceRecord.getValue({ name : 'duedate'});
                var prosentDiscount = invoiceRecord.getValue({ name : 'discountrate'});
                var discount = invoiceRecord.getValue({ name : 'discounttotal'}) || 0;
                var jobNumber = invoiceRecord.getValue({ name : 'custbody_abj_custom_jobnumber'});
                if (jobNumber.includes('\\')) {
                    jobNumber = jobNumber.replace(/\\/g, '<br/>');
                }
                var otehrRefNum = invoiceRecord.getValue({ name : 'otherrefnum'}) || '';
                discount = Math.abs(discount);
                prosentDiscount = Math.abs(prosentDiscount);
                var totalWhTaxamount = 0;
                var totalWhTaxamountItem = 0;
                var whtaxammountItem = 0;
                var whTaxCodetoPrint = ''

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
                var taxpphList = [];
                if (countItem.length > 0) {
                    
                    for (var i = 0; i < countItem.length; i++) {
                        var lineRec = countItem[i];
                        var description = lineRec.getValue({
                            name: "memo",
                        });
                        var ammount = lineRec.getValue({
                            name: "amount",
                        });
                        var project = lineRec.getText({
                            name: "class",
                        });
                        allDataLine.push({
                            description: description,
                            ammount: ammount,
                            project : project
                        })
                        var taxpph = lineRec.getValue({
                            name: "custcol_4601_witaxrate",
                        });
                        whtaxammountItem = lineRec.getValue({
                            name: "custcol_4601_witaxamount",
                        });
                        var whTaxCodeI = lineRec.getValue({
                            name: "custcol_4601_witaxcode",
                        });
                        if (whTaxCodeI) {
                            var whRecI = record.load({
                                type: 'customrecord_4601_witaxcode',
                                id: whTaxCodeI,
                                isDynamic: false,
                            });
                            whTaxCodetoPrint = whRecI.getValue('custrecord_4601_wtc_name');
                            if (whTaxCodetoPrint.includes('Prepaid Tax') || whTaxCodetoPrint.includes('Tax Article')) {
                                whTaxCodetoPrint = whTaxCodetoPrint.replace('Prepaid Tax', 'PPH').replace('Tax Article', 'PPH');
                            }
                        }

                        var tamount = whtaxammountItem
                        whtaxammountItem = Math.abs(tamount);
                        totalWhTaxamountItem += whtaxammountItem

                        if (taxpph) {
                            if (taxpphList.indexOf(taxpph) == -1) {
                                taxpphList.push(taxpph);
                            }
                        }
                    }
                }
                totalWhTaxamount = totalWhTaxamountItem;
                if (taxpphList.length > 0) {
                    var taxpphToPrint = taxpphList.join(' & ');
                }
                var subTotal = Number(poTotal) - Number(taxtotal)
                var subBefore = subTotal
                var taxtotalBefor = taxtotal
                total = Number(subBefore) + Number(taxtotalBefor);
                amountReceive = total
                if (taxpphToPrint) {
                    amountReceive = amountReceive - totalWhTaxamount;
                }
                if (totalWhTaxamount) {
                    totalWhTaxamount = pembulatan(totalWhTaxamount)
                    totalWhTaxamount = format.format({
                        value: totalWhTaxamount,
                        type: format.Type.CURRENCY
                    });
                    totalWhTaxamount = removeDecimalFormat(totalWhTaxamount)
                }
                if (totalTax) {
                    totalTax = pembulatan(totalTax)
                    totalTax = format.format({
                        value: totalTax,
                        type: format.Type.CURRENCY
                    });
                    totalTax = removeDecimalFormat(totalTax)
                }
                if (amountReceive) {
                    amountReceive = pembulatan(amountReceive)
                    amountReceive = format.format({
                        value: amountReceive,
                        type: format.Type.CURRENCY
                    });
                    amountReceive = removeDecimalFormat(amountReceive)
                }
                if (poTotal) {
                    poTotal = pembulatan(poTotal)
                    poTotal = format.format({
                        value: poTotal,
                        type: format.Type.CURRENCY
                    });
                    poTotal = removeDecimalFormat(poTotal)
                }
                if (discount) {
                    discount = pembulatan(discount);
                    discount = format.format({
                        value: discount,
                        type: format.Type.CURRENCY
                    });
                    discount = removeDecimalFormat(discount)
                }

                if (subTotal) {
                    subTotal = pembulatan(subTotal);
                    subTotal = format.format({
                        value: subTotal,
                        type: format.Type.CURRENCY
                    });
                    subTotal = removeDecimalFormat(subTotal)
                }

                if (taxtotal) {
                    taxtotal = pembulatan(taxtotal);
                    taxtotal = format.format({
                        value: taxtotal,
                        type: format.Type.CURRENCY
                    });
                    taxtotal = removeDecimalFormat(taxtotal)
                }

                if (total) {
                    total = pembulatan(total)
                    total = format.format({
                        value: total,
                        type: format.Type.CURRENCY
                    });
                    total = removeDecimalFormat(total)
                }

                
                if (InvDate) {
                    var parts = InvDate.split('/'); // Misalkan InvDate = "15/01/2025"
                    var formattedDate = parts[2] + '-' + parts[1] + '-' + parts[0]; 
                    var dateConv = new Date(formattedDate)
                    log.debug('dateConv', dateConv)
                    var dayIndex = dateConv.getDay()
                    var monthIndex = dateConv.getMonth()
                    var dateIndex = dateConv.getDate()
                    var yearIndex = dateConv.getFullYear()
                    var daysOfWeek = [
                        'Sunday',   // 0
                        'Monday',   // 1
                        'Tuesday',  // 2
                        'Wednesday',// 3
                        'Thursday', // 4
                        'Friday',   // 5
                        'Saturday'  // 6
                    ];
                    var monthsOfYear = [
                        'January',   // 0
                        'February',  // 1
                        'March',     // 2
                        'April',     // 3
                        'May',       // 4
                        'June',      // 5
                        'July',      // 6
                        'August',    // 7
                        'September', // 8
                        'October',   // 9
                        'November',  // 10
                        'December'   // 11
                    ];
                    var dayInv = daysOfWeek[dayIndex]
                    var monthInv = monthsOfYear[monthIndex]
                }
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '1%';
                var style = "";
                var footer = "";
                var pdfFile = null;
                if (jobNumber.includes('&')) {
                    jobNumber = jobNumber.replace(/&/g, '&amp;');
                }
                style += "<style type='text/css'>";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%; font-family: Arial, Helvetica, Verdana, sans-serif;}";
                style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
                if (subsidiari == 1) {
                    style += ".tg .tg-img-logo{width:150px; height:111px; object-vit:cover;}";
                } else {
                    style += ".tg .tg-img-logo{width:195px; height:165px; object-vit:cover;}";
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


                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='align:left; width:50%;'></td>"
                body += "<td style='align:left; width:10%;'></td>"
                body += "<td style='align:left; width:10%;'></td>"
                body += "<td style='align:left; width:30%;'></td>"
                body += "</tr>";


                body += "<tr>"
                // body += "<td style='font-size:25px; font-weight: bold; '>" + "SISI" + "</td>"
                if (urlLogo) {
                    body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:0;' colspan='2'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                }
                body += "<td style='font-size:40px; align:right; color:#808000; font-weight: bold; padding-top:20px' colspan='2'>Invoice</td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td style=''>Invoice To:</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='align:right;'>" + dayInv + ", " + dateIndex + " " + monthInv + " " + yearIndex + "</td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td>" + custName + "</td>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='align:right;'>" + tandId + "</td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td style='' rowspan='3'>" + custAddres + "</td>"
                body += "<td></td>"
                body += "<td style='align:right;' colspan='2'>" + fromSo + "</td>"
                body += "</tr>";
                log.debug('otehrRefNum', otehrRefNum)
                body += "<tr>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='align:right;'>" + otehrRefNum + "</td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='align:right;'></td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='align:right;'></td>"
                body += "</tr>";

                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='align:left; height:30px'></td>"
                body += "</tr>";
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:5%;'></td>"
                body += "<td style='width:55%;'></td>"
                body += "<td style='width:10%;'></td>"
                body += "<td style='width:5%;'></td>"
                body += "<td style='width:25%;'></td>"
                body += "</tr>";

                body += "<tr>";
                // body += "<td style='align:center; font-size:15px; font-weight:bold; background-color:#F8F3A8'>Description</td>"
                body += "<td style='align:center; font-size:11px;  height:25px; vertical-align:middle; background-color:#F8F3A8' colspan='2'>Description</td>"
                body += "<td style='align:center; font-size:11px; height:25px; vertical-align:middle; background-color:#F8F3A8' colspan='3'>Amount</td>"
                body += "</tr>";

                // body += "<tr>";
                // body += "<td>" + otherComment + "test</td>"
                // body += "<td colspan='3'></td>"
                // body += "</tr>";
                body += getPOItem(context, invoiceRecord, allDataLine, memoHead);
                body += "</tbody>";
                body += "</table>";

                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr>";
                footer += "<td style='width:60%;'></td>"
                footer += "<td style='width:6%;'></td>"
                footer += "<td style='width:13%;'></td>"
                footer += "<td style='width:1%;'></td>"
                footer += "<td style='width:5%;'></td>"
                footer += "<td style='width:15%;'></td>"
                footer += "</tr>";

                footer += "<tr style=''>";
                footer += "<td style='border-bottom: solid #808000 10px;' colspan='6'></td>"
                footer += "</tr>";

                footer += "<tr style=''>";
                // footer += "<td style='align:left; font-weight:bold;'>Terms Conditions:</td>"
                footer += "<td style='' rowspan='3'>"+escapeXmlSymbols(memoHead)+"</td>"
                footer += "<td style=''></td>"
                footer += "<td style='align:right'>Sub Total</td>"
                footer += "<td style=''>:</td>"
                footer += "<td style=''>"+tlcCurr+"</td>"
                footer += "<td style='align:right'>" + subTotal + "</td>"
                footer += "</tr>";

                footer += "<tr style=''>";
                footer += "<td style=''></td>"
                footer += "<td style='align:right'>VAT</td>"
                footer += "<td style=''>:</td>"
                footer += "<td style=''>"+tlcCurr+"</td>"
                footer += "<td style='align:right'>" + totalTax + "</td>"
                footer += "</tr>";

                footer += "<tr style=''>";
                footer += "<td style=''></td>"
                footer += "<td style='font-weight:bold; align:right'>Total Invoice</td>"
                footer += "<td style=''>:</td>"
                footer += "<td style='font-weight:bold'>"+tlcCurr+"</td>"
                footer += "<td style='align:right; font-weight:bold;'>" + poTotal + "</td>"
                footer += "</tr>";

                footer += "<tr style='height:20px'>";
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style='align:right'></td>"
                footer += "</tr>";

                footer += "<tr>";
                footer += "<td style='align:left; font-weight:bold' colspan='6'>Payment Information :</td>"
                // footer += "<td style='align:center' colspan='3'>Submitted By</td>"
                // footer += "<td></td>"
                footer += "</tr>";
                
                footer += "<tr>";
                footer += "<td colspan='2'></td>"
                footer += "<td rowspan='2' style='align:center' colspan='3'>Submitted By</td>"
                footer += "<td></td>"
                footer += "</tr>";

                if(bankInfo){
                    footer += "<tr>";
                    footer += "<td style='align:left' colspan='4'>" + bankNameRec + "</td>"
                    footer += "<td style=''></td>"
                    footer += "<td style=''></td>"
                    footer += "</tr>";
    
                    footer += "<tr>";
                    footer += "<td style='align:left' colspan='4'>" + bankAccName + "</td>"
                    footer += "<td style=''></td>"
                    footer += "<td style=''></td>"
                    footer += "</tr>";
    
                    footer += "<tr>";
                    footer += "<td style='align:left' colspan='4'>" + bankAccNo + "</td>"
                    footer += "<td style=''></td>"
                    footer += "<td style=''></td>"
                    footer += "</tr>";
                }else{
                    footer += "<tr>";
                    footer += "<td style='align:left' colspan='4'>" + bankName + " " + bankBranch + "</td>"
                    footer += "<td style=''></td>"
                    footer += "<td style=''></td>"
                    footer += "</tr>";

                    footer += "<tr>";
                    footer += "<td style='align:left' colspan='4'>" + legalName + "</td>"
                    footer += "<td style=''></td>"
                    footer += "<td style=''></td>"
                    footer += "</tr>";

                    footer += "<tr>";
                    footer += "<td style='align:left' colspan='4'>" + accountNo + "</td>"
                    footer += "<td style=''></td>"
                    footer += "<td style=''></td>"
                    footer += "</tr>";
                }

                

                // footer += "<tr>";
                // footer += "<td style='align:left' colspan='4'>" + Npwp + "</td>"
                // footer += "<td style=''></td>"
                // footer += "<td style=''></td>"
                // footer += "</tr>";

                // footer += "<tr>";
                // footer += "<td style='align:left' colspan='4'>" + swiftCode + "</td>"
                // footer += "<td style=''></td>"
                // footer += "<td style=''></td>"

                // footer += "</tr>";

                footer += "<tr>"
                footer += "<td></td>"
                footer += "</tr>"
                footer += "<tr style='height:20px'>"
                footer += "<td></td>"
                footer += "</tr>"

                footer += "<tr>";
                footer += "<td style='align:left; font-size:20px; font-weight:bold;' colspan='6'>Thank You!</td>"
                footer += "</tr>";


                footer += "<tr>";
                footer += "<td style='' colspan='2'></td>"
                if(nameSignatured){
                    footer += "<td style='align:center' colspan='3'>( "+nameSignatured+" )</td>"
                }else{
                    
                footer += "<td style='align:center' colspan='3'>(____________)</td>"
                }
                footer += "<td></td>"
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
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='35%'>";
                xml += body;
                xml += "\n</body>\n</pdf>";

                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });
            }

            function getPOItem(context, invoiceRecord, allDataLine, memoHead) {
                var cekDataLine = allDataLine.length
                if(cekDataLine > 0){
                    var body = "";
                    var no = 1;
                    allDataLine.forEach(data => {
                        var description = data.description;
                        var ammount = data.ammount;
                        if (description.includes('\\')) {
                            log.debug('ada tanda');
                            description = description.replace(/\\/g, '<br/>');
                        }
                        if (description.includes('$') && description.includes('$$')) {
                            log.debug('masuk $')
                            description = description.replace(/\$(.*?)\$\$/g, '<b>$1</b>');
                        }
                        if (description.includes('#') && description.includes('##')) {
                            log.debug('masuk #')
                            description = description.replace(/\#(.*?)\#\#/g, '<i>$1</i>');
                        }
                        if (description.includes('*') && description.includes('**')) {
                            log.debug('masuk *')
                            description = description.replace(/\*(.*?)\*\*/g, '<u>$1</u>');
                        }

                        if (ammount) {
                            ammount = pembulatan(ammount);
                            ammount = format.format({
                                value: ammount,
                                type: format.Type.CURRENCY
                            });
                            ammount = removeDecimalFormat(ammount)
                        }

                        if (no == 1) {
                            body += "<tr>";
                            body += "<td colspan='2'>" + escapeXmlSymbols(memoHead) + "</td>"
                            body += "<td colspan='3'></td>"
                            body += "</tr>";
                        }


                        body += "<tr>";
                        body += "<td  style='align:right'></td>";
                        body += "<td >" + description + "</td>";
                        body += "<td  style='align:right'></td>";
                        body += "<td  style='align:right'></td>";
                        body += "<td  style='align:right;'>" + ammount + "</td>";
                        body += "</tr>";
                        no++
                    });
                    
                    return body
                }
                    

             
            }

        } catch (e) {
            log.debug('error', e)
        }



        return {
            onRequest: onRequest,
        };
    });