/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
        try{
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

                var currenc = invoiceRecord.getValue({ name : 'currency'});
                if(currenc){
                    var recCurrenc = record.load({
                        type : 'currency',
                        id : currenc,
                        isDynamic : false
                    });
                    var tlcCurr = recCurrenc.getValue('symbol');
                    
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
                var subsidiari = invoiceRecord.getValue({ name : 'subsidiary'});
                // load subsidiarie
                if(subsidiari){
                    var subsidiariRec = record.load({
                        type: "subsidiary",
                        id: subsidiari,
                        isDynamic: false,
                    });
                    // load for header
                    var legalName = subsidiariRec.getValue('legalname');
                    var addresSubsidiaries = subsidiariRec.getValue('mainaddress_text');
                    var name = subsidiariRec.getValue('name');
                    var Npwp = subsidiariRec.getValue('federalidnumber');
    
                    var bankName = subsidiariRec.getValue('custrecord_fcn_sub_bank_name');
                    var swiftCode = subsidiariRec.getValue('custrecord_fcn_sub_swift_code');
                    var bankBranch = subsidiariRec.getValue('custrecord_fcn_sub_bank_branch');
                    var accountNo = subsidiariRec.getValue('custrecord_fcn_sub_account_number');
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
                    
                    if(addresSubsidiaries.includes("<br>")){
                        addresSubsidiaries = addresSubsidiaries.replace(/<br>/g, "");
                    }
                    if(name){
                        addresSubsidiaries = addresSubsidiaries.replace(name, "");
                    }
                }
                
                // load vendor
                var customer_id = invoiceRecord.getValue({
                    name: "internalid",
                    join: "customer",
                });
                log.debug('customer_id', customer_id)
                if(customer_id){
                    var customerRecord = record.load({
                        type: "customer",
                        id: customer_id,
                        isDynamic: false,
                    });
                    var isperson = customerRecord.getValue('isperson');
                    var custName = ''
                    if(isperson == 'T'){
                        var firstname = customerRecord.getValue('firstname') || ''
                        var middleName = customerRecord.getValue('middlename') || ''
                        var lastname  = customerRecord.getValue('lastname') || ''
                        custName = firstname + ' ' +middleName + ' '+ lastname
                        
                    }else{
                        var check = customerRecord.getValue('isautogeneratedrepresentingentity');
                        
                        
                        if (check === true) {
                        custName = customerRecord.getValue('comments')
                        } else {
                        custName = customerRecord.getValue('companyname');
                        }
                    }
                    var custAddres = customerRecord.getValue('defaultaddress');
                    if (custAddres === '') {
                        
                        custAddres = customerRecord.getValue('billaddr1');
                        
                    }
                    log.debug('custAdress', custAddres);
                        if(custAddres.includes('&')){
                            custAddres = custAddres.replace(/&/g, 'dan');
                        }
                        log.debug('custAdress after', custAddres);
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
                
                if(balance){
                    balance = format.format({
                        value: balance,
                        type: format.Type.CURRENCY
                    });
                    balance = removeDecimalFormat(balance);
                }
                // PO data
                var tandId = invoiceRecord.getValue({ name : 'tranid'});
                var InvDate = invoiceRecord.getValue({ name : 'trandate'});
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
                var template = invoiceRecord.getText({ name : 'custbody10'});
                var totalTax = invoiceRecord.getValue({ name : 'taxtotal'})
                // var subTotal = invoiceRecord.getValue({
                //     name: "formulacurrency",
                //     formula: "{total}+{taxtotal}",
                // }) || 0;
                var taxtotal = invoiceRecord.getValue({ name : 'taxtotal'}) ||0;
                var poTotal = invoiceRecord.getValue({ name : 'total'}) || 0;
                log.debug('poTotal', poTotal)
                var total = 0;
                var amountReceive = 0;
                var duedate = invoiceRecord.getValue({ name : 'duedate'});
                var prosentDiscount = invoiceRecord.getValue({ name : 'discountrate'});
                var discount = invoiceRecord.getValue({ name : 'discounttotal'}) || 0;
                var jobNumber = invoiceRecord.getValue({ name : 'custbody_abj_custom_jobnumber'});
                if (jobNumber.includes('\\')) {
                    log.debug('ada tanda');
                    jobNumber = jobNumber.replace(/\\/g, '<br/>');
                }
                discount = Math.abs(discount);
                prosentDiscount = Math.abs(prosentDiscount);
                var totalWhTaxamount = 0;
                var totalWhTaxamountItem = 0;
                var whtaxammountItem = 0;
                var whTaxCodetoPrint = ''
                var otherComment = ""
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
                if(countItem.length > 0){
                    for (var i = 0; i < countItem.length; i++) {
                        var lineRec = countItem[i];
                        var description = lineRec.getValue({
                            name: "memo",
                        });
                        var ammount = lineRec.getValue({
                            name: "amount",
                        });
                        var itemText = lineRec.getText({
                            name: "item",
                        });
                        log.debug('ammount', ammount)
                        allDataLine.push({
                            description: description,
                            ammount: ammount,
                            itemText : itemText
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
                            otherComment = project
                        }
                        var whTaxCodeI = lineRec.getValue({
                            name: "custcol_4601_witaxcode",
                        });
    
                        if(whTaxCodeI){
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
                log.debug('subBefore', subBefore)
                var taxtotalBefor = taxtotal
                log.debug('taxtotalBefor', taxtotalBefor)
                total = Number(subBefore) + Number(taxtotalBefor);
                amountReceive = total
                if(taxpphToPrint){
                    amountReceive = amountReceive - totalWhTaxamount;
                }
                if(totalWhTaxamount){
                    totalWhTaxamount = pembulatan(totalWhTaxamount)
                    totalWhTaxamount = format.format({
                        value: totalWhTaxamount,
                        type: format.Type.CURRENCY
                    });
                    totalWhTaxamount = removeDecimalFormat(totalWhTaxamount)
                }
                if(totalTax){
                    totalTax = pembulatan(totalTax)
                    totalTax = format.format({
                        value: totalTax,
                        type: format.Type.CURRENCY
                    });
                    totalTax = removeDecimalFormat(totalTax)
                }
                if(amountReceive){
                    amountReceive = pembulatan(amountReceive)
                    amountReceive = format.format({
                        value: amountReceive,
                        type: format.Type.CURRENCY
                    });
                    amountReceive = removeDecimalFormat(amountReceive)
                }
                if(poTotal){
                    poTotal = pembulatan(poTotal)
                    poTotal = format.format({
                        value: poTotal,
                        type: format.Type.CURRENCY
                    });
                    poTotal = removeDecimalFormat(poTotal)
                }
                if(discount){
                    discount = pembulatan(discount);
                    discount = format.format({
                        value: discount,
                        type: format.Type.CURRENCY
                    }); 
                    discount = removeDecimalFormat(discount)
                }
                
                if(subTotal){
                    subTotal = pembulatan(subTotal);
                subTotal = format.format({
                    value: subTotal,
                    type: format.Type.CURRENCY
                });
                subTotal = removeDecimalFormat(subTotal)
                }
                
                if(taxtotal){
                    taxtotal = pembulatan(taxtotal);
                    taxtotal = format.format({
                        value: taxtotal,
                        type: format.Type.CURRENCY
                    });
                    taxtotal = removeDecimalFormat(taxtotal)
                }
                
                if(total){
                    total = pembulatan(total)
                    total = format.format({
                        value: total,
                        type: format.Type.CURRENCY
                    });
                    total = removeDecimalFormat(total)
                }
                
                if(duedate){
                    function sysDate() {
                        var date = duedate;
                        var tdate = date.getUTCDate();
                        var month = date.getUTCMonth() + 1; // jan = 0
                        var year = date.getUTCFullYear();
                        return tdate + '/' + month + '/' + year;
                    }
                    duedate = sysDate();
                }
                if(InvDate){
                    InvDate = format.format({
                        value: InvDate,
                        type: format.Type.DATE
                    });
                }
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '1%';
                var style = "";
                var footer = "";
                var pdfFile = null;
                if(jobNumber.includes('&')){
                    log.debug('masuk');
                    jobNumber = jobNumber.replace(/&/g, '&amp;');
                }
                style += "<style type='text/css'>";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%; font-family: Arial, Helvetica, sans-serif;}";
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
                
    
                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";
    
                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body += "<td style='align:left; width:60%;'></td>"
                body += "<td style='align:left; width:8%;'></td>"
                body += "<td style='align:left; width:12%;'></td>"
                body += "<td style='align:left; width:20%;'></td>"
                body+= "</tr>";
                body+= "<tr>"
                body+= "<td style='font-size:25px; font-weight: bold; '>"+legalName+ " " + template + "</td>"
                body+= "<td></td>"
                body+= "<td></td>"
                body+= "<td style='font-size:20px; align:right; color:#0813AF; font-weight: bold;'>INVOICE</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td style='' rowspan='3'>"+addresSubsidiaries+"</td>"
                body+= "<td></td>"
                body+= "<td>Date</td>"
                body+= "<td style='align:right;'>"+InvDate+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td>Invoice #</td>"
                body+= "<td style='align:right;'>"+tandId+"</td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td>Quotation #</td>"
                body+= "<td style='align:right;'>"+fromSo+"</td>"
                body+= "</tr>";

                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body += "<td style='align:left; height:20px'></td>"
                body+= "</tr>";
                body+= "</tbody>";
                body+= "</table>";
                
                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body += "<td style='align:center; width:60%; font-size:15px; font-weight:bold; background-color:#B9B9B9'>Bill To :</td>"
                body += "<td style='align:left; width:40%;'></td>"
                body+= "</tr>";
                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body += "<td style='align:left; width:70%;'></td>"
                body += "<td style='align:left; width:30%;'></td>"
                body+= "</tr>";

                body+= "<tr>";
                body += "<td style='align:left;font-weight:bold'>"+custName+"</td>"
                body += "<td style=''></td>"
                body+= "</tr>";
                body+= "<tr>";
                body += "<td style='align:left;'>"+custAddres+"</td>"
                body += "<td style=''></td>"
                body+= "</tr>";
                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body+= "<td style='align:left; height:30px'></td>"
                body+= "</tr>";
                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body += "<td style='width:60%;'></td>"
                body += "<td style='width:10%;'></td>"
                body += "<td style='width:10%;'></td>"
                body += "<td style='width:4%;'></td>"
                body += "<td style='width:16%;'></td>"
                body+= "</tr>";

                body+= "<tr>";
                body += "<td style='align:center; font-size:15px; font-weight:bold; background-color:#B9B9B9' colspan='3'>Description</td>"
                body += "<td style='align:center; font-size:15px; font-weight:bold; background-color:#B9B9B9' colspan='2'>AMOUNT</td>"
                body+= "</tr>";

                body+= "<tr>";
                body += "<td colspan='3'>"+otherComment+"</td>"
                body += "<td colspan='2'></td>"
                body+= "</tr>";
                body += getPOItem(context, invoiceRecord, allDataLine);
                body+= "</tbody>";
                body+= "</table>";
    
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
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style='border-bottom: solid black 1px;' colspan='4'></td>"
                footer += "</tr>";

                footer += "<tr style=''>";
                footer += "<td style='align:center;font-size:15px; font-weight:bold; background-color:#B9B9B9'>OTHER COMMENTS</td>"
                footer += "<td style=''></td>"
                footer += "<td style=''>Sub Total</td>"
                footer += "<td style=''>:</td>"
                footer += "<td style=''>IDR</td>"
                footer += "<td style='align:right'>"+subTotal+"</td>"
                footer += "</tr>";

                footer += "<tr style=''>";
                footer += "<td style=''>"+otherComment+"</td>"
                footer += "<td style=''></td>"
                footer += "<td style=''>VAT"+taxRegNo+"</td>"
                footer += "<td style=''>:</td>"
                footer += "<td style=''>IDR</td>"
                footer += "<td style='align:right'>"+totalTax+"</td>"
                footer += "</tr>";

                footer += "<tr style=''>";
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style='font-weight:bold'>Total Invoice</td>"
                footer += "<td style=''>:</td>"
                footer += "<td style=''>IDR</td>"
                footer += "<td style='align:right'>"+poTotal+"</td>"
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
                footer += "<td style=''>Signed By</td>"
                footer += "<td style=''></td>"
                footer += "<td style='align:center' colspan='4'>Make All Payment To</td>"
                footer += "</tr>";

                footer += "<tr>";
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style='align:center' colspan='4'>"+bankBranch+"</td>"
                footer += "</tr>";

                footer += "<tr>";
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style='align:center' colspan='4'>Account Name : "+bankName+"</td>"
                footer += "</tr>";

                footer += "<tr>";
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style='align:center' colspan='4'>Account Number : "+accountNo+"</td>"
                footer += "</tr>";

                footer += "<tr>";
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style='align:center' colspan='4'>NPWP : "+Npwp+"</td>"
                footer += "</tr>";

                footer += "<tr>";
                footer += "<td style=''></td>"
                footer += "<td style=''></td>"
                footer += "<td style='align:center' colspan='4'>Swift Code : "+swiftCode+"</td>"
                footer += "</tr>";

                footer += "<tr>";
                footer += "<td style=''>( "+nameSignatured+" )</td>"
                footer += "<td style=''></td>"
                footer += "<td style='align:center' colspan='4'></td>"
                footer += "</tr>";

                
                footer += "<tr>";
                footer += "<td style='align:center; font-size:14px; font-weight:bold; font-style: italic;' colspan='6'>Thank You For Your Business!</td>"
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
    
            function getPOItem(context, invoiceRecord, allDataLine){

                var cekDataLine = allDataLine.length
                if(cekDataLine > 0){
                    var body = "";
                    var no = 1;
                    allDataLine.forEach(data => {
                        var description = data.description;
                        var ammount = data.ammount;
                        var itemText = data.itemText

                        if (description.includes('\\')) {
                            log.debug('ada tanda');
                            description = description.replace(/\\/g, '<br/>');
                        }
                        if(description.includes('$') && description.includes('$$')){
                            log.debug('masuk $')
                            description = description.replace(/\$(.*?)\$\$/g, '<b>$1</b>');
                        }
                        if(description.includes('#') && description.includes('##')){
                            log.debug('masuk #')
                            description = description.replace(/\#(.*?)\#\#/g, '<i>$1</i>');
                        }
                        if(description.includes('*') && description.includes('**')){
                            log.debug('masuk *')
                            description = description.replace(/\*(.*?)\*\*/g, '<u>$1</u>');
                        }

                        if(ammount){
                            ammount = pembulatan(ammount);
                            ammount = format.format({
                                value: ammount,
                                type: format.Type.CURRENCY
                            });
                            ammount = removeDecimalFormat(ammount)
                        }
                        

                        body += "<tr>";
                        body += "<td colspan='3'>"+no+" . "+itemText+ "</td>";
                        body += "<td  style='align:right'>IDR</td>";
                        body += "<td  style='align:right;'>"+ammount+"</td>";
                        body += "</tr>";
                        no++
                    });
                    return body;
                }
                
            }

        }catch(e){
            log.debug('error', e)
        }
       
            
        
    return {
        onRequest: onRequest,
    };
});