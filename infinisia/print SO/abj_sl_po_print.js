/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
        try{
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
            function onRequest(context) {
                var recid = context.request.parameters.id;
                log.debug('recid', recid);
                var poRec = record.load({
                    type: "salesorder",
                    id: recid,
                    isDynamic: false,
                });
                var poDate = poRec.getValue("trandate");
                var tranid = poRec.getValue("tranid");
                var employeId = poRec.getValue("custbody_abj_sales_rep_fulfillment");
                var salesrep = poRec.getText("salesrep");

                var subTotal = poRec.getValue("subtotal");
                var taxTotal = poRec.getValue("taxtotal");
                var total = poRec.getValue("total")

                var leadTimeArray = [];
                var paymentTermsArray = [];
                var itemCount = poRec.getLineCount({
                    sublistId: 'item'
                });
                log.debug('itemCount', itemCount);
                
                if(itemCount > 0){
                    for(var index = 0; index < itemCount; index++){
                        var leadTime = poRec.getSublistText({
                            sublistId : 'item',
                            fieldId : 'custcol3',
                            line : index
                        });
                        if(leadTime){
                            leadTimeArray.push(leadTime);
                        }
                        var paymentTerms = poRec.getSublistText({
                            sublistId : 'item',
                            fieldId : 'custcol4',
                            line : index
                        })
                        if(paymentTerms){
                            paymentTermsArray.push(paymentTerms)
                        }
                    }
                }

                var employeeName = '';
                log.debug('employeId', employeId)
                if(employeId){
                    var empRec = record.load({
                        type: "employee",
                        id: employeId,
                        isDynamic: false,
                    });
                    var firstName = empRec.getValue("firstname") || '';
                    var lastName = empRec.getValue("lastname") || '';
                    var midname = empRec.getValue("middlename") || '';
                    employeeName = firstName + ' ' + midname + ' ' + lastName

                    var idImg = empRec.getValue('custentity_abj_inf_signature');
                    var signatureUrl = '';
                    var fileSignature;
                    if(idImg){
                        fileSignature = file.load({
                            id: idImg
                        });
                        //get url
                        signatureUrl = fileSignature.url.replace(/&/g, "&amp;");
                    }
                 
                }
                log.debug('employeeName', employeeName)
                var vendorId = poRec.getValue("entity");
                var vendorName = '';
                var vendorAddress = '';
                var contactName = [];
                if(vendorId){
                    var vendRec = record.load({
                        type: "customer",
                        id: vendorId,
                        isDynamic: false,
                    });
                    var isPerson = vendRec.getValue("isperson");
                    if(isPerson == 'T'){
                        var firstName = vendRec.getValue('firstname') || '';
                        var lastName = vendRec.getValue('lastname')|| '';
                        vendorName = firstName +' '+lastName;
                    }else{
                        var isChecklist = vendRec.getValue('isautogeneratedrepresentingentity');
                        log.debug('isCheck', isChecklist);

                        if(isChecklist === true){
                            vendorName = vendRec.getValue('comments');
                        }else{
                            vendorName = vendRec.getValue('companyname');
                        }
                    }
                    vendorAddress = vendRec.getValue("defaultaddress");
                    var lineContact = vendRec.getLineCount({
                        sublistId: 'contactroles'
                    });
                    if(lineContact>0){
                        for(var index = 0; index < lineContact; index++){
                            var cName = vendRec.getSublistValue({
                                sublistId: 'contactroles',
                                fieldId: 'contactname',
                                line: index
                            });
                            if(cName){
                                contactName.push(cName);
                            }
                        }
                    }

                }
                var companyInfo = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });
                var legalName = companyInfo.getValue("legalname");
                var terms = poRec.getText('terms')
                var leadTime = poRec.getValue('custbody5');
                log.debug('legalName', legalName);
                var logo = companyInfo.getValue('formlogo');
                        var filelogo;
                        var urlLogo = '';
                        if (logo) {
                            filelogo = file.load({
                                id: logo
                            });
                            //get url
                            urlLogo = filelogo.url.replace(/&/g, "&amp;");
                        }
                var addres = companyInfo.getValue("mainaddress_text");
                var statusSo = poRec.getValue("status");
                log.debug('statusSo', statusSo);
                if(poDate){
                    poDate = format.format({
                        value: poDate,
                        type: format.Type.DATE
                    });
                }
                if(subTotal){
                    subTotal = pembulatan(subTotal)
                    log.debug('subTotal', subTotal);
                    subTotal = format.format({
                        value: subTotal,
                        type: format.Type.CURRENCY
                    });
                }
                if(taxTotal){
                    taxTotal = pembulatan(taxTotal)
                    log.debug('taxTotal', taxTotal);
                    taxTotal = format.format({
                        value: taxTotal,
                        type: format.Type.CURRENCY
                    });
                }
                if(total){
                    total = pembulatan(total)
                    log.debug('total', total);
                    total = format.format({
                        value: total,
                        type: format.Type.CURRENCY
                    });
                }
                var tipeKurs = poRec.getValue('custbody4')
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '1%';
                var style = "";
                var footer = "";
                var pdfFile = null;
                style += "<style type='text/css'>";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
                style += ".tg .tg-img-logo{width:200px; height:70px; object-vit:cover;}";
                style += ".tg .tg-img-logo-a{width:150px; height:70px; object-vit:cover;}";
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: center;font-size:8px;font-weight: bold; background-color: #EBF7FC;}";
                style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
                style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += "</style>";

                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:35%'></td>"
                body += "<td style='width:30%'></td>"
                body += "<td style='width:35%'></td>"
                body += "</tr>";
                
                body += "<tr>";
                if (urlLogo) {
                    body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                }else{
                    body += "<td></td>"
                }
                body += "<td style='font-size:12px;'>"+addres+"</td>"
                body += "<td></td>";
                body += "</tr>";

                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr style='height: 10px'>";
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:100%'></td>"
                body += "</tr>"

                body += "<tr>";
                body += "<td style='font-size:14px; font-weight: bold; color:#0B3383; align:center'>SALES ORDER</td>"
                body += "</tr>"

                body += "<tr>";
                body += "<td style='font-size:10px; color:#0B3383; align:center'>No. Form : 008/ISS-BD/FF</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:20%'></td>"
                body += "<td style='width:1%'></td>"
                body += "<td style='width:30%'></td>"
                body += "<td style='width:15%'></td>"
                body += "<td style='width:34%'></td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td style='font-weight:bold'>SO DATE</td>"
                body += "<td>:</td>"
                body += "<td>"+poDate+"</td>"
                body += "<td style='font-weight:bold'>MANUAL SO FOR :</td>"
                body += "<td style='font-weight:bold'>"+vendorName+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-weight:bold'>No. SO</td>"
                body += "<td>:</td>"
                body += "<td>"+tranid+"</td>"
                body += "<td style='font-weight:bold'></td>"
                body += "<td style='' rowspan='2'>"+vendorAddress+"</td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='font-weight:bold'>SALES NAME </td>"
                body += "<td>:</td>"
                body += "<td>"+employeeName+"</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body+= "<td style='width:61%'></td>"
                body+= "<td style='font-weight:bold;'>Attn : "+contactName+"</td>"
                body+= "</tr>";
                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr style='height: 30px'>";
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='font-weight:bold;'>We are please to quote you in the following :</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                body += "<tbody>";
                body += "<tr>";
                body+= "<td class='tg-head_body' style='width:7%; border: 1px solid black; border-right:none;'> Quantity </td>"
                body+= "<td class='tg-head_body' style='width:7%; border: 1px solid black; border-right:none;'> UOM </td>"
                body+= "<td class='tg-head_body' style='width:20%; border: 1px solid black; border-right:none;'> DESCRIPTION </td>"
                body+= "<td class='tg-head_body' style='width:15%; border: 1px solid black; border-right:none;'> UNIT PRICE ($) </td>"
                body+= "<td class='tg-head_body' style='width:8%; border: 1px solid black; border-right:none;'> KURS </td>"
                body+= "<td class='tg-head_body' style='width:20%; border: 1px solid black; border-right:none;'> UNIT PRICE (IDR) </td>"
                body+= "<td class='tg-head_body' style='width:20%; border: 1px solid black;'> AMOUNT </td>"
                body += "</tr>"

                body += getPOItem(context, poRec);
                
                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:15%;'></td>"
                body += "<td style='width:1%;'></td>"
                body += "<td style='width:44%;'></td>"
                body += "<td style='width:20%;'></td>"
                body += "<td style='width:20%;'></td>"
                body += "</tr>"

                body += "<tr>";
                body += "<td>Lead Time</td>"
                body += "<td>:</td>"
                body += "<td>"+leadTime+"</td>"
                body += "<td style='font-weight:bold; align:right;'>Subtotal :</td>"
                body += "<td style='font-weight:bold;'>"+subTotal+"</td>"
                body += "</tr>"

                body += "<tr>";
                body += "<td>Payment Term</td>"
                body += "<td>:</td>"
                body += "<td>"+terms+"</td>"
                body += "<td style='font-weight:bold; align:right;'>Tax Total :</td>"
                body += "<td style='font-weight:bold;'>"+taxTotal+"</td>"
                body += "</tr>"

                body += "<tr>";
                body += "<td>Kurs</td>"
                body += "<td>:</td>"
                body += "<td>"+tipeKurs+"</td>"
                body += "<td style='font-weight:bold; align:right;'>Total :</td>"
                body += "<td style='font-weight:bold;'>"+total+"</td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body+= "<tbody>";
                body+= "<tr style='height:20px;'>";
                body+= "</tr>";
                body+= "</tbody>";
                body+= "</table>";

                body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body+= "<tbody>";
                body+= "<tr>";
                body+= "<td style='width:8%'></td>"
                body+= "<td style='width:28%'></td>"
                body+= "<td style='width:28%'></td>"
                body+= "<td style='width:28%'></td>"
                body+= "<td style='width:8%'></td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td style='align: center; font-weight:bold;'>PREPARED BY</td>"
                body+= "<td style='align: center; font-weight:bold;'></td>"
                body+= "<td style='align: center; font-weight:bold;'>APPROVED BY</td>"
                body+= "</tr>";

                body+= "<tr style='height:40px'>"
                body+= "<td></td>"
                if(signatureUrl){
                    body+= "<td style='align: center; font-weight:bold;'><img class='tg-img-logo-a' src= '" + signatureUrl + "' ></img></td>"
                }else{
                    body+= "<td style='align: center; font-weight:bold;'></td>"
                }
                body+= "<td style='align: center; font-weight:bold;'></td>"
                body+= "<td style='align: center; font-weight:bold;'></td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td style='align: center; font-weight:bold;'>ADMIN BUSINESS DEVELOPMENT</td>"
                body+= "<td style='align: center; font-weight:bold;'></td>"
                body+= "<td style='align: center; font-weight:bold;'>BUSIDESS DEVELOPMENT</td>"
                body+= "</tr>";

                body+= "<tr style='height:10px'>"
                body+= "<td></td>"
                body+= "<td style='align: center; font-weight:bold;'></td>"
                body+= "<td style='align: center; font-weight:bold;'></td>"
                body+= "<td style='align: center; font-weight:bold;'></td>"
                body+= "</tr>";

                body+= "<tr>"
                body+= "<td></td>"
                body+= "<td style='align: center; font-weight:bold;'></td>" 
                body+= "<td style='align: center; font-weight:bold; color:#0B3383;'>THANK YOU FOR YOUR BUSINESS!</td>"
                body+= "<td style='align: center; font-weight:bold;'></td>"
                body+= "</tr>";

                body+= "</tbody>";
                body+= "</table>";

                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr style='height:40px;'>";
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
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm; margin-top:5px; padding-top:5px;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='7%'>";
                xml += body;
                xml += "\n</body>\n</pdf>";
    
                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });

            }
            function getPOItem(context, poRec){
                var itemCount = poRec.getLineCount({
                    sublistId: 'item'
                });
                log.debug('itemCount', itemCount);
                
                if(itemCount > 0){
                    var body = "";
                    for(var index = 0; index < itemCount; index++){
                        var qty = poRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: index
                        });
                        var description = poRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: index
                        });
                        var rate = poRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: index
                        });
                        var uom = poRec.getSublistText({
                            sublistId: 'item',
                            fieldId: 'units',
                            line: index
                        });
                        
                        var kurs = poRec.getValue("exchangerate");
                        var amount = poRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: index
                        });
                        var idr = Number(rate) * Number(kurs)
                        log.debug('idr', idr);

                        if(rate){
                            rate = pembulatan(rate)
                            rate = format.format({
                                value: rate,
                                type: format.Type.CURRENCY
                            });
                        }
                        if(idr){
                            idr = pembulatan(idr)
                            idr = format.format({
                                value: idr,
                                type: format.Type.CURRENCY
                            });
                        }
                        if(amount){
                            amount = pembulatan(amount)
                            log.debug('amount', amount);
                            amount = format.format({
                                value: amount,
                                type: format.Type.CURRENCY
                            });
                        }
                        body += "<tr>";
                        body += "<td style='font-size: 10px; border: 1px solid black; border-right:none;'>"+qty+"</td>";
                        body += "<td style='font-size: 10px; border: 1px solid black; border-right:none;'>"+uom+"</td>";
                        body += "<td style='font-size: 10px; border: 1px solid black; border-right:none;'>"+description+"</td>";
                        body += "<td style='font-size: 10px; border: 1px solid black; border-right:none;'>"+removeDecimalFormat(rate)+"</td>";
                        body += "<td style='font-size: 10px; border: 1px solid black; border-right:none;'>"+kurs+"</td>";
                        body += "<td style='font-size: 10px; border: 1px solid black; border-right:none;'>"+removeDecimalFormat(idr)+"</td>";
                        body += "<td style='font-size:10px; border: 1px solid black; background-color: #EBF7FC; '>"+removeDecimalFormat(amount)+"</td>";
                        body += "</tr>";
                        
                    }
                    return body;
                }
            }
        }catch(e){
            log.debug('error',e)
        }
       
        return {
            onRequest: onRequest,
        };
    });