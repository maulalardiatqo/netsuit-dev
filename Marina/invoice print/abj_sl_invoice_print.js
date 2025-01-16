/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime', 'N/format/i18n'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
        try{
            function getCurrentUserName() {
                var currentUser = runtime.getCurrentUser();
        
                var userName = currentUser.name;
        
                return userName;
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
            function addDaysToDate(invDate, daysToAdd) {
                // Split the date string into day, month, and year
                const [day, month, year] = invDate.split('/').map(Number);
            
                // Create a new Date object
                const date = new Date(year, month - 1, day);
            
                // Add the specified number of days
                date.setDate(date.getDate() + daysToAdd);
            
                // Format the new date as DD/MM/YYYY
                const newDay = String(date.getDate()).padStart(2, '0');
                const newMonth = String(date.getMonth() + 1).padStart(2, '0');
                const newYear = date.getFullYear();
            
                return `${newDay}/${newMonth}/${newYear}`;
            }
            function onRequest(context) {
                var recid = context.request.parameters.id;
                var idUserNow = getCurrentUserName();
                log.debug('idUserNow', idUserNow)
                // load SO
                var invoiceRecord = record.load({
                    type: "invoice",
                    id: recid,
                    isDynamic: false,
                });
                var currenc = invoiceRecord.getValue('currency');
                if(currenc){
                    var recCurrenc = record.load({
                        type : 'currency',
                        id : currenc,
                        isDynamic : false
                    });
                    var tlcCurr = recCurrenc.getValue('symbol');
                    
                }
                
                var subsidiari = invoiceRecord.getValue('subsidiary');
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
                    var addresParts = addresSubsidiaries.split('\n')
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
                    if(addresSubsidiaries){
                        if(addresSubsidiaries.includes("<br>")){
                            addresSubsidiaries = addresSubsidiaries.replace(/<br>/g, "");
                        }
                        if(name){
                            addresSubsidiaries = addresSubsidiaries.replace(name, "");
                        }
                    }
                   
                }
                
                // load vendor
                var customer_id = invoiceRecord.getValue('entity');
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
                    var custAddres = customerRecord.getValue('billaddr1');
                    if (custAddres === '') {
                        
                        custAddres = customerRecord.getValue('defaultaddress');
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
                
                if(balance){
                    balance = format.format({
                        value: balance,
                        type: format.Type.CURRENCY
                    });
                    balance = removeDecimalFormat(balance);
                }
                // PO data
                var tandId = invoiceRecord.getValue('tranid');
                var FakturPenjualan = invoiceRecord.getValue('custbody_msa_nofakturpenjualan');
                var InvDate = invoiceRecord.getValue('trandate');
                var terms = invoiceRecord.getText('terms');
                var fakturPajak = invoiceRecord.getValue('custbody_fcn_faktur_pajak');
                var subTotal = invoiceRecord.getValue('subtotal') || 0;
                var taxtotal = invoiceRecord.getValue('taxtotal') ||0;
                var taxtotalCount = 0;
                var poTotal = invoiceRecord.getValue('total') || 0;
                var total = 0;
                var amountReceive = 0;
                var duedate = invoiceRecord.getValue('duedate');
                var prosentDiscount = invoiceRecord.getValue('discountrate');
                var discount = invoiceRecord.getValue('discounttotal') || 0;
                var jobNumber = invoiceRecord.getValue('custbody_abj_custom_jobnumber');
                if(jobNumber){
                    if (jobNumber.includes('\\')) {
                        log.debug('ada tanda');
                        jobNumber = jobNumber.replace(/\\/g, '<br/>');
                    }
                }
               
                var otehrRefNum = invoiceRecord.getValue('otherrefnum');
                discount = Math.abs(discount);
                prosentDiscount = Math.abs(prosentDiscount);
                var totalWhTaxamount = 0;
                var totalWhTaxamountItem = 0;
                var whtaxammountItem = 0;
                var whTaxCodetoPrint = ''
    
                var countItem = invoiceRecord.getLineCount({
                    sublistId: 'item'
                });
                if(countItem > 0){
                    var taxpphList = [];
                    for (var i = 0; i < countItem; i++) {
                        var taxpph = invoiceRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_4601_witaxrate',
                            line: i
                        });
                        whtaxammountItem = invoiceRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_4601_witaxamount',
                            line: i
                        });
                        var taxItem = invoiceRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate1',
                            line: i
                        });
                        var ammount = invoiceRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'amount',
                            line : i
                        });
                        var whTaxCodeI = invoiceRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_4601_witaxcode',
                            line : i
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
                        var qty = invoiceRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'quantity',
                            line : i
                        })
                        // subTotal += ammount * qty
                        // taxtotalCount = ammount * qty * taxItem / 100
                        // log.debug('taxtotalCount', taxtotalCount);
                        // taxtotal += taxtotalCount
                        var tamount = whtaxammountItem
                        whtaxammountItem = Math.abs(tamount);
                        totalWhTaxamountItem += whtaxammountItem
    
                        if (taxpph) {
                            if (taxpphList.indexOf(taxpph) == -1) {
                                taxpphList.push(taxpph);
                            }
                        }
                    }
                    // log.debug('whtaxammountItem', whtaxammountItem)
                    // log.debug('totalWhTaxamountItem', totalWhTaxamountItem);
                }
                // log.debug('taxtotal', taxtotal)
                var whtaxToCount = whtaxammountItem;
                totalWhTaxamount = totalWhTaxamountItem;
                if (taxpphList.length > 0) {
                    var taxpphToPrint = taxpphList.join(' & ');
                  }
                var subBefore = subTotal
                var taxtotalBefor = taxtotal
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
                var empName = ''
                var empId = invoiceRecord.getValue('custbody_fcn_sales_employee');
                if(empId){
                    var recEmp = record.load({
                        type : 'employee',
                        id : empId
                    });
                    var fName = recEmp.getValue('firstname');
                    var lName = recEmp.getValue('lastname');
                    empName = fName + ' ' + lName;
                }
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '0%';
                var style = "";
                var footer = "";
                var pdfFile = null;
                if(jobNumber){
                    if(jobNumber.includes('&')){
                        log.debug('masuk');
                        jobNumber = jobNumber.replace(/&/g, '&amp;');
                    }
                }
                
                style += "<style type='text/css'>";
                style += "body { font-family: 'Calibri Light', sans-serif; width: 210mm; height: 140mm; padding-top: 0; margin: 0; padding-bottom: 0; }";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
                style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
                style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += "</style>";
                
    
                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body+= "<td style='width:50%'></td>"
                body+= "<td style='width:15%'></td>"
                body+= "<td style='width:1%'></td>"
                body+= "<td style='width:34%'></td>"
                body+= "</tr>";

                body+= "<tr>";
                body+= "<td colspan='4' style='align:center; font-weight:bold;'><u>FAKTUR PENJUALAN</u></td>"
                body+= "</tr>";

                body+= "<tr>";
                body+= "<td style='font-weight:bold; font-size:15px'>"+legalName+"</td>"
                body+= "<td style=''>No. Invoice</td>"
                body+= "<td style=''>:</td>"
                body+= "<td style=''>"+tandId+"</td>"
                body+= "</tr>"

                body+= "<tr>";
                body+= "<td style=''>"+addresParts[0]+"</td>"
                body+= "<td style=''>Tgl. Faktur</td>"
                body+= "<td style=''>:</td>"
                body+= "<td style=''>"+InvDate+"</td>"
                body+= "</tr>";
                log.debug('cekInvdate', InvDate)

                const dateAfter = addDaysToDate(InvDate, 30);
                log.debug('dateAfter', dateAfter)
                body+= "<tr>";
                body+= "<td style=''>"+addresParts[1] +"-"+addresParts[2]+"</td>"
                body+= "<td style=''>Tgl. Tempo</td>"
                body+= "<td style=''>:</td>"
                body+= "<td style=''>"+dateAfter+"</td>"
                body+= "</tr>";

                body+= "<tr>";
                body+= "<td style=''>No. Faktur : "+FakturPenjualan+"</td>"
                body+= "<td style=''>Pelanggan</td>"
                body+= "<td style=''>:</td>"
                body+= "<td style=''>"+custName+"</td>"
                body+= "</tr>";
        
                body+= "</tbody>";
                body+= "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:10px\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td style='width:4%; align:center; border : solid black 1px; border-right: none;'> No </td>"
                body += "<td style='width:7%; align:center;border : solid black 1px; border-right: none;'> Kode </td>"
                body += "<td style='width:43%; align:center; border : solid black 1px; border-right: none;'> Nama Barang </td>"
                body += "<td style='width:10%; align:center; border : solid black 1px; border-right: none;'>  Harga Satuan </td>"
                body += "<td style='width:5%; align:center; border : solid black 1px; border-right: none;'> QTY </td>"
                body += "<td style='width:8%; align:center; border : solid black 1px; border-right: none;'> Satuan </td>"
                body += "<td style='width:8%; align:center; border : solid black 1px;'> Disc [%] </td>"
                body += "<td style='width:10%; align:center; border : solid black 1px; border-left: none;'> Jumlah </td>"
                body += "</tr>"

                var poDetails = getPOItem(context, invoiceRecord);
                body += poDetails.body;

                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:8pt;\">";
                body += "<tbody>";
                
                body += "<tr>"
                body += "<td style='width:2%; align:center;'></td>"
                body += "<td style='width:15%; align:center;'></td>"
                body += "<td style='width:2%; align:center;'></td>"
                body += "<td style='width:15%; align:center;'></td>"
                body += "<td style='width:2%; align:center;'></td>"
                body += "<td style='width:15%; align:center;'></td>"
                body += "<td style='width:2%; align:center;'></td>"
                body += "<td style='width:17%; align:center;'></td>"
                body += "<td style='width:30%; align:center;'></td>"
                body += "</tr>"
                var subtotalAmount = format.format({
                    value: poDetails.subTotal,
                    type: format.Type.CURRENCY
                });
                subtotalAmount = removeDecimalFormat(subtotalAmount)
                body += "<tr>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center;'>Fakturing,</td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center;'>Pelanggan,</td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center;'>Mengetahui,</td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:right; border: solid black 1px; border-bottom: none;'>Subtotal</td>"
                body += "<td style='align:right; border: solid black 1px; border-bottom: none; border-left: none;'>"+subtotalAmount+"</td>"
                body += "</tr>"
                var potongan = 0
                if(poDetails.totalDiscount){
                    potongan = format.format({
                        value: poDetails.totalDiscount,
                        type: format.Type.CURRENCY
                    });
                    potongan = removeDecimalFormat(potongan)
                }
                
                body += "<tr style='height:30px'>"
                body += "<td style='align:center;' colspan='7'></td>"
                body += "<td style='align:right; border: solid black 1px; border-bottom: none; border-top: none;'>Potongan</td>"
                body += "<td style='align:right; border: solid black 1px; border-bottom: none; border-left: none; border-top: none;'>"+potongan+"</td>"
                body += "</tr>"
                var totalAmount = Number(poDetails.subTotal) - Number(poDetails.totalDiscount) 
                if(totalAmount){
                        totalAmount = format.format({
                        value: totalAmount,
                        type: format.Type.CURRENCY
                    });
                    totalAmount = removeDecimalFormat(totalAmount)
                } 
                body += "<tr>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center; border-bottom: solid black 1px;'></td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center; border-bottom: solid black 1px;'></td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center; border-bottom: solid black 1px;'></td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:right; border: solid black 1px; border-top: none; font-size:11pt;'><b>Total</b></td>"
                body += "<td style='align:right; border: solid black 1px; border-top: none; border-left: none; font-size:11pt;'><b>"+totalAmount+"</b></td>"
                body += "</tr>"
                function getIndonesianTime() {
                    var currentTimeUTC = new Date();
                    var indonesianTime = new Date(currentTimeUTC.getTime() + 7 * 60 * 60 * 1000);
            
                    return indonesianTime.toISOString();
                }
                function formatDate(inputDate) {
                    const date = new Date(inputDate);
                    const day = date.getUTCDate();
                    const month = date.getUTCMonth() + 1;
                    const year = date.getUTCFullYear();
                    const hours = date.getUTCHours();
                    const minutes = date.getUTCMinutes();
                    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
                    return `${day}/${month}/${year}/${hours}:${formattedMinutes}`;
                }
                var cekTime = getIndonesianTime();
                var currentTime = formatDate(cekTime);
                
                log.debug('cekTime', cekTime)
                log.debug('currentTime', currentTime)
                body += "<tr>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center;'>"+empName+"</td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:center;'></td>"
                body += "<td style='align:left; font-size:9px' colspan='2'>Printed : "+currentTime + '/' + idUserNow+" </td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";
    

                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr style='height:40px;'>";
                footer += "</tr>";
                footer += "</tbody>";
                footer += "</table>";
    
                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr class='tg-foot'>";
                footer += "<td style='align:left'>Sales Invoice # "+tandId+"</td>"
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
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 14cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='7%'>";
                xml += body;
                xml += "\n</body>\n</pdf>";
    
                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });
            }
    
            function getPOItem(context, invoiceRecord){
                var itemCount = invoiceRecord.getLineCount({
                    sublistId: 'item'
                });
                
                
                if(itemCount > 0){
                    var body = "";
                    var nomor = 1;
                    var subTotal = 0
                    var totalDiscount = 0
                    for(var index = 0; index < itemCount; index++){
                        
                        var itemId = invoiceRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: index
                        });
                        if(itemId != 149){
                            var qty = invoiceRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: index
                            });
                            var description = invoiceRecord.getSublistText({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: index
                            });
                            var inventoryitemSearchObj = search.create({
                                type: "inventoryitem",
                                filters: [
                                    ["type", "anyof", "InvtPart"], 
                                    "AND", 
                                    ["internalid", "anyof", itemId]
                                ],
                                columns: [
                                    search.createColumn({name: "itemid", label: "Name"})
                                ]
                            });
                            var searchResults = inventoryitemSearchObj.run().getRange({
                                start: 0,
                                end: 1
                            });
                            var itemName = ''
                            if (searchResults.length > 0) {
                                itemName = searchResults[0].getValue({name: "itemid"});
                                log.debug('Item Name:', itemName);
                            }
                            if(itemName){
                                if (itemName.includes('\\')) {
                                    itemName = itemName.replace(/\\/g, '<br/>');
                                }
                                if(itemName.includes('&') && itemName.includes('&&')){
                                    log.debug('masuk $')
                                    itemName = itemName.replace(/&/g, '&amp;');;
                                }
                                if(itemName.includes('$') && itemName.includes('$$')){
                                    log.debug('masuk $')
                                    itemName = itemName.replace(/\$(.*?)\$\$/g, '<b>$1</b>');
                                }
                                if(itemName.includes('#') && itemName.includes('##')){
                                    log.debug('masuk #')
                                    itemName = itemName.replace(/\#(.*?)\#\#/g, '<i>$1</i>');
                                }
                                if(itemName.includes('*') && itemName.includes('**')){
                                    log.debug('masuk *')
                                    itemName = itemName.replace(/\*(.*?)\*\*/g, '<u>$1</u>');
                                }
                            }
                            
                            var unit = invoiceRecord.getSublistText({
                                sublistId: 'item',
                                fieldId: 'units',
                                line: index
                            });
                            var rate;
                            var rateBef = invoiceRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: index
                            });
                            var ammount = invoiceRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: index
                            });
                            if(rateBef){
                                rate = rateBef
                            }else{
                                rate = Number(ammount) / Number(qty)
                            }
                            if(rate){
                                rate = pembulatan(rate);
                                rate = format.format({
                                    value: rate,
                                    type: format.Type.CURRENCY
                                });
                                rate = removeDecimalFormat(rate)
                            }
                            
                            var discLine = 0;
    
                            var discPercen = invoiceRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_msa_discount_persen',
                                line: index
                            });
                            var discAmt = invoiceRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_msa_discount_amount',
                                line: index
                            });
                            if(discPercen){
                                discLine = discPercen + '%';
                            }else{
                                if(discAmt){
                                    var convertDisc = ((discAmt / ammount) * 100).toFixed(2);
                                    log.debug('convertDisc', convertDisc)
                                    discLine = convertDisc + '%';
                                }
                            }
                            log.debug('disc', {discPercen : discPercen, discAmt : discAmt })
                            subTotal += Number(ammount)

                            var discountLineAmount = 0
                            if(discAmt){
                                discountLineAmount = discAmt
                            }else{
                                if(discPercen){
                                    var disc = (ammount * (discPercen / 100))
                                    discountLineAmount
                                }
                            }
                            log.debug('discountLineAmount', discountLineAmount)
                            totalDiscount += Number(discountLineAmount)
                            if (ammount){
                                ammount = pembulatan(ammount)
                                ammount = format.format({
                                    value: ammount,
                                    type: format.Type.CURRENCY
                                });
                                ammount = removeDecimalFormat(ammount)
                            }
                            
                            body += "<tr>";
                            body += "<td  style='align:center;  border-left: solid black 1px; boder-right: solid black 1px;'>"+ nomor + "</td>";
                            body += "<td  style='align:center;  border-left: solid black 1px;' >"+itemId+"</td>";
                            body += "<td  style='align:left;  border-left: solid black 1px;'>"+itemName+"</td>";
                            body += "<td  style='align:right;  border-left: solid black 1px;'>"+rate+"</td>";
                            body += "<td  style='align:center;  border-left: solid black 1px;'>"+qty+"</td>";
                            body += "<td  style='align:center;  border-left: solid black 1px;'>"+unit+"</td>";
                            body += "<td  style='align:right; border-left: solid black 1px; border-right: solid black 1px;' >"+discLine+"</td>";
                            body += "<td  style='align:right;  border-right: solid black 1px;'>"+ammount+"</td>";
                            body += "</tr>";
    
                            nomor++
                        }
                        
                    }
                    body += "<tr>";
                    body += "<td colspan='8' style=' border-top: solid black 1px;'></td>";
                    body += "</tr>";
                    return {
                        body: body,
                        subTotal: subTotal,
                        totalDiscount: totalDiscount
                    };
                }
                return { body: "", subTotal: 0, totalDiscount: 0 };

            }

        }catch(e){
            log.debug('error', e)
        }
       
            
        
    return {
        onRequest: onRequest,
    };
});