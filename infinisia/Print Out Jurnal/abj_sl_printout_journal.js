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
                    // id saved search
                    
                    // load SO
                    var searchData = search.load({
                        id : "customsearch_print_journal"
                    })
                    if(recid){
                        searchData.filters.push(search.createFilter({name: "internalid", operator: search.Operator.IS, values: recid}));
                    }
                    var dataHeadSet = searchData.run();
                    var resultHead = dataHeadSet.getRange(0, 1);
                    var headRec = resultHead[0];

                    var trandId = headRec.getValue({
                        name : "tranid"
                    });
                    var customForm = headRec.getValue({
                        name : "customform"
                    });
                    var fundNumber = headRec.getValue({
                            name: "custrecord_fund_docnumb",
                            join: "CUSTBODY_GENERATE_FROM_FUND",
                    })
                    log.debug('customform', customForm);

                    var jenisTransaksi
                    var paidName = ''
                    if(customForm == '158'){
                        jenisTransaksi = headRec.getValue({
                            name : "custbody_custom_transaksi_list_bank"
                        });
                        log.debug('jenisTransaksi', jenisTransaksi)
                        if(jenisTransaksi == '1'){
                            jenisTransaksi = 'Bank In'
                            paidName = 'Paid From'
                        }else{
                            jenisTransaksi = 'Bank Out'
                            paidName = 'Paid To'
                        }
                    }else if(customForm == '159'){
                        jenisTransaksi = headRec.getValue({
                            name : "custbody_custom_transksi_list_cash"
                        });
                        if(jenisTransaksi == '1'){
                            jenisTransaksi = 'Cash In'
                            paidName = 'Paid From'
                        }else{
                            jenisTransaksi = 'Cash Out'
                            paidName = 'Paid To'
                        }
                    }
                    var IdjenisTransaksi = headRec.getValue({
                        name : "custbody_custom_jenis_transaksi"
                    });
                    log.debug('IdjenisTransaksi', IdjenisTransaksi)
                    var trandate = headRec.getValue({
                        name : "trandate"
                    });

                    var dataLineSet = searchData.run();
                    var resultLine = dataLineSet.getRange(0, 100);
                    var dataLine = [];
                    if(resultLine.length > 0){
                        resultLine.forEach(function (lines) {
                            var numberCode = lines.getValue({
                                name: "number",
                                join: "account",
                            });
                            var accName = lines.getValue({
                                name: "name",
                                join: "account",
                            });
                            var memo = lines.getValue({
                                name : "memo"
                            });
                            var amountDebit = lines.getValue({
                                name : "debitamount"
                            }) || 0;
                            var amountCredit = lines.getValue({
                                name : "creditamount"
                            }) || 0;
                            dataLine.push({
                                numberCode : numberCode,
                                accName : accName,
                                memo : memo,
                                amountDebit : amountDebit,
                                amountCredit : amountCredit
                            })
                        })
                    }

                    log.debug('dataLine', dataLine)


                    var response = context.response;
                    var xml = "";
                    var header = "";
                    var body = "";
                    var headerHeight = '15%';
                    var style = "";
                    var footer = "";
                    var pdfFile = null;
                    style += "<style type='text/css'>";
                    style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                    style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
                    style += ".tg .tg-img-logo{width:180px; height:50px; object-vit:cover;}";
                    style += ".tg .tg-img-logo-a{width:150px; height:70px; object-vit:cover;}";
                    style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                    style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                    style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                    style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                    style += ".tg .tg-head_body{align: left;font-size:10px; border-top: 3px solid black; border-bottom: 3px solid black;}";
                    style += ".tg .tg-b_body{align: left;font-size:10px; border-bottom: solid black 2px;}";
                    style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                    style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                    style += ".second-table { page-break-before: always; }";
                    style += "</style>";
                    
                    
                    header += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:8px;padding-top:0;margin-top:0;\">";
                    header += "<tbody>";
                    header += "<tr style='padding-top:0;margin-top:0;'>"
                    header += "<td style='font-weight:bold; font-size:16; width:50%;'>"+jenisTransaksi+"</td>"
                    header += "<td style='font-weight:bold; font-size:14; width:50%; align:right;'></td>"
                    header += "</tr>"
                    header += "</tbody>";
                    header += "</table>";

                    header += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:8px\">";
                    header += "<tbody>";
                    header += "<tr>"
                    header += "<td style='height:10px'></td>"
                    header += "</tr>"
                    header += "</tbody>";
                    header += "</table>";

                    header += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:12px;\">";
                    header += "<tbody>";
                    header += "<tr>"
                    header += "<td style='width:2%;font-weight:bold;'></td>"
                    header += "<td style='width:15%;font-weight:bold;'>"+paidName+"</td>"
                    header += "<td style='width:1%; font-weight:bold;'>:</td>"
                    header += "<td style='width:34%; font-weight:bold;'></td>"
                    header += "<td style='width:10%; font-weight:bold;'></td>"
                    header += "<td style='width:5%; font-weight:bold;'>Date</td>"
                    header += "<td style='width:1%; font-weight:bold;'>:</td>"
                    header += "<td style='width:32%; font-weight:bold;'>"+trandate+"</td>"
                    header += "</tr>"
                    header += "<tr>"
                    header += "<td style='font-weight:bold;'></td>"
                    header += "<td style='font-weight:bold;'>IDGL/Reff #</td>"
                    header += "<td style='font-weight:bold;'>:</td>"
                    header += "<td style='font-weight:bold;'>"+trandId+"</td>"
                    header += "<td style='font-weight:bold;' colspan='4'></td>"
                    //header += "<td style='font-weight:bold;' colspan='4'>"+refNumber+"</td>"
                    header += "</tr>"
                    header += "</tbody>";
                    header += "</table>";

                    body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:10px\">";
                    body += "<tbody>";
                    body += "<tr>"
                    body += "<td style='width:10%'></td>"
                    body += "<td style='width:25%'></td>"
                    body += "<td style='width:5%'></td>"
                    body += "<td style='width:30%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>GL Code</td>"
                    body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>Account Name</td>"
                    body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'></td>"
                    body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>Description</td>"
                    body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>Debit</td>"
                    body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>Credit</td>"
                    body += "</tr>"

                    body += getGL(dataLine)
                    body += "<tr style='height:40px'>"
                    body += "</tr>"
                    body += "<tr>"
                    body += "<td colspan='6'>Generate From : "+fundNumber+"</td>"
                    body += "</tr>"
                    body += "</tbody>";
                    body += "</table>";

                    footer += "<table class='tg' style='table-layout: fixed;'>";
                    footer += "<tbody>";

                    footer += "<tr>";
                    footer += "<td style='width:2%;'></td>";
                    footer += "<td style='width:21%;'></td>";
                    footer += "<td style='width:2%;'></td>";
                    footer += "<td style='width:2%;'></td>";
                    footer += "<td style='width:21%;'></td>";
                    footer += "<td style='width:2%;'></td>";
                    footer += "<td style='width:2%;'></td>";
                    footer += "<td style='width:21%;'></td>";
                    footer += "<td style='width:2%;'></td>";
                    footer += "<td style='width:2%;'></td>";
                    footer += "<td style='width:21%;'></td>";
                    footer += "<td style='width:2%;'></td>";
                    footer += "</tr>";
                    if(IdjenisTransaksi == 5){
                        footer += "<tr>"
                        footer += "<td></td>"
                        footer += "<td style='align:center'>Posted By:</td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center'>Checked By:</td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center'>Approved By:</td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center'>Acknowledged By:</td>"
                        footer += "<td></td>"
                        footer += "</tr>"
    
                        footer += "<tr>"
                        footer += "<td style='height:40px' colspan='12'></td>"
                        footer += "</tr>"
    
                        footer += "<tr>"
                        footer += "<td></td>"
                        footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center; border-bottom:1px solid black'>Mediana Hadiwidjaja</td>"
                        footer += "<td></td>"
                        footer += "</tr>"
                        footer += "<tr>"
                        footer += "<td></td>"
                        footer += "<td style='align:center;'></td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center;'></td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center;'></td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center;'>President Director</td>"
                        footer += "<td></td>"
                        footer += "</tr>"
                    }else{
                        footer += "<tr>"
                        footer += "<td></td>"
                        footer += "<td style='align:center'>Posted By:</td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center'>Checked By:</td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center'>Approved By:</td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center'>Acknowledged By:</td>"
                        footer += "<td></td>"
                        footer += "</tr>"
    
                        footer += "<tr>"
                        footer += "<td style='height:50px' colspan='12'></td>"
                        footer += "</tr>"
    
                        footer += "<tr>"
                        footer += "<td></td>"
                        footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center; border-bottom:1px solid black'>Mediana Hadiwidjaja</td>"
                        footer += "<td></td>"
                        footer += "</tr>"
                        footer += "<tr>"
                        footer += "<td></td>"
                        footer += "<td style='align:center;'>Finance</td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center;'>Accounting</td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center;'>FA Manager</td>"
                        footer += "<td></td>"
                        footer += "<td></td>"
                        footer += "<td style='align:center;'>President Director</td>"
                        footer += "<td></td>"
                        footer += "</tr>"
                    }
                   
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
                    xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 14.8cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='15%'>";
                    xml += body;
                    xml += "\n</body>\n</pdf>";
        
                    xml = xml.replace(/ & /g, ' &amp; ');
                    response.renderPdf({
                        xmlString: xml
                    });
                }
                
                function getGL(dataLine){
                    
                    log.debug('dataLine', dataLine);
                    var body = "";
                    var totalDebit = 0
                    var totalCredit = 0
                    if(dataLine.length > 0){
                    
                        // dataLine.forEach((data)=>{
                        //     var numberAccount = data.numberCode;
                        //     var accountName = data.accName;
                        //     var memo = data.memo;
                        //     var creditamount = data.amountCredit;
                        //     var debitAmount = data.amountDebit;
                        //     if (creditamount || debitAmount) {
                        //         if(creditamount){
                        //             totalCredit += parseFloat(creditamount);
                        //             creditamount = pembulatan(creditamount)
                        //             creditamount = format.format({
                        //                 value: creditamount,
                        //                 type: format.Type.CURRENCY
                        //             });
                        //         }
                        //         if(debitAmount){
                        //             totalDebit +=  parseFloat(debitAmount);
                        //             debitAmount = pembulatan(debitAmount)
                        //             debitAmount = format.format({
                        //                 value: debitAmount,
                        //                 type: format.Type.CURRENCY
                        //             });
                        //         }
                        //             body += "<tr>";
                        //             body += "<td>"+numberAccount+"</td>";
                        //             body += "<td>"+accountName+"</td>";
                        //             body += "<td></td>";
                        //             body += "<td>"+memo+"</td>";
                        //             log.debug('debitAmount', debitAmount)
                        //             if (debitAmount != 0) {
                        //                 log.debug('masuk lebih besar dari 0')
                        //                 body += "<td style='align:right;'>" + removeDecimalFormat(debitAmount) + "</td>";
                        //             } else {
                        //                 body += "<td style='align:right;'>" + debitAmount + "</td>";
                        //             }
                        //             if (creditamount != 0) {
                        //                 body += "<td style='align:right;'>"+removeDecimalFormat(creditamount)+"</td>";
                        //             } else {
                        //                 body += "<td style='align:right;'>" + creditamount + "</td>";
                        //             }
                                
                        //             body += "</tr>";
                        //     }
                        // })
                        let debitLines = [];
                        let creditLines = [];
                        let vatLines = [];

                        // Pisahkan data berdasarkan kriteria
                        dataLine.forEach((data) => {
                            let creditamount = parseFloat(data.amountCredit) || 0;
                            let debitAmount = parseFloat(data.amountDebit) || 0;
                            let memo = data.memo || '';

                            if (memo.toLowerCase().includes(" vat ")) {
                                vatLines.push(data);
                            } else if (debitAmount !== 0 && creditamount === 0) {
                                debitLines.push(data);
                            } else if (creditamount !== 0 && debitAmount === 0) {
                                creditLines.push(data);
                            }
                        });

                        // Simpan memo dari salah satu debit line (jika ada)
                        let memoDebitReferensi = debitLines.length > 0 ? debitLines[0].memo : '';

                        // Fungsi render baris HTML
                        function renderLine(data, isVAT = false) {
                            let numberAccount = data.numberCode;
                            let accountName = data.accName;
                            let memo = data.memo || '';
                            let creditamount = parseFloat(data.amountCredit) || 0;
                            let debitAmount = parseFloat(data.amountDebit) || 0;

                            // Penambahan nilai total
                            if (debitAmount) {
                                totalDebit += debitAmount;
                                debitAmount = pembulatan(debitAmount);
                                debitAmount = format.format({
                                    value: debitAmount,
                                    type: format.Type.CURRENCY
                                });
                            }
                            if (creditamount) {
                                totalCredit += creditamount;
                                creditamount = pembulatan(creditamount);
                                creditamount = format.format({
                                    value: creditamount,
                                    type: format.Type.CURRENCY
                                });
                            }

                            // Jika VAT, gabungkan memo
                            if (isVAT && memoDebitReferensi) {
                                log.debug('isVAT', isVAT)
                                memo = memoDebitReferensi + ' ' + '-' + ' ' + memo;
                                log.debug('memoDebitReferensi', memoDebitReferensi)
                            }

                            // Render baris HTML
                            let html = "<tr>";
                            html += "<td>" + numberAccount + "</td>";
                            html += "<td>" + accountName + "</td>";
                            html += "<td></td>";
                            html += "<td>" + memo + "</td>";
                            html += "<td style='align:right;'>" + (debitAmount != 0 ? removeDecimalFormat(debitAmount) : debitAmount) + "</td>";
                            html += "<td style='align:right;'>" + (creditamount != 0 ? removeDecimalFormat(creditamount) : creditamount) + "</td>";
                            html += "</tr>";

                            return html;
                        }

                        // Gabungkan baris berdasarkan urutan
                        debitLines.forEach(data => {
                            body += renderLine(data);
                        });
                        creditLines.forEach(data => {
                            body += renderLine(data);
                        });
                        vatLines.forEach(data => {
                            body += renderLine(data, true); // Flag isVAT = true
                        });

                        
                    }
                    if(totalCredit){
                        totalCredit = pembulatan(totalCredit)
                        totalCredit = format.format({
                            value: totalCredit,
                            type: format.Type.CURRENCY
                        });
                    }
                    if(totalDebit){
                        totalDebit = pembulatan(totalDebit)
                        totalDebit = format.format({
                            value: totalDebit,
                            type: format.Type.CURRENCY
                        });
                    }
                    body += "<tr>";
                    body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black;'></td>";
                    body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black;'></td>";
                    body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black;'></td>";
                    body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black;'></td>";
                    body += "<td style='font-size: 12px; font-weight:bold; border-top: 1px solid black; border-bottom: 1px solid black; align:right'>"+removeDecimalFormat(totalDebit)+"</td>";
                    body += "<td style='font-size: 12px; font-weight:bold; border-top: 1px solid black; border-bottom: 1px solid black;align:right;'>"+removeDecimalFormat(totalCredit)+"</td>";
                    body += "</tr>";
                    return body;
                
                }
                
            }catch(e){
                log.debug('error', e)
            }
        
                
            
        return {
            onRequest: onRequest,
        };
    });