/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
function(render, search, record, log, file, http, config, format, email, runtime) {
    function onRequest(context) {
        try{
            var allData = JSON.parse(context.request.parameters.allData);
            log.debug('allData', allData)
            
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
            style += ".tg .tg-img-logo{width:150px; height:40px; object-vit:cover;}";
            style += ".tg .tg-img-logo-a{width:150px; height:70px; object-vit:cover;}";
            style += ".tg .tg-headerrow{align: right;font-size:12px;}";
            style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
            style += ".tg .tg-head_body{align: center;font-size:11px;font-weight: bold;}";
            style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
            style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
            style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
            style += "</style>";
            if(allData.length > 0){
                allData.forEach((data)=>{
                    var item = data.item
                    var invNumber = data.invNumber
                    var location = data.location
                    var binNumber = data.binNumber
                    var expDate = data.expDate
                    var stockUnit = data.stockUnit || ''
                    log.debug('expDate befor', expDate);
                    if(expDate){
                        var parts = expDate.split('/');
                        expDate = parts[0] + '-' + parts[1] + '-' + parts[2];
                    }
                    log.debug('expDate', expDate);
                    log.debug('item', item);
                    var companyInfo = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    var legalName = companyInfo.getValue("legalname");
        
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

                    header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                    header += "<tbody>";
                    header += "</tbody>";
                    header += "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";

                    body+= "<tbody>";
                    body+= "<tr>"
                    body+= "<td style='width:35%'></td>"
                    body+= "<td style='width:30%'></td>"
                    body+= "<td style='width:15%'></td>"
                    body+= "<td style='width:15%'></td>"
                    body+= "</tr>"

                    body+= "<tr>";
                    if (urlLogo) {
                        body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;' rowspan='3'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                    }else{
                        body+= "<td></td"
                    }
                    body+="<td style='font-size:10px; font-weight:bold; align:center'></td>"
                    body+="<td style='font-size:10px; font-weight:bold;'>No. Form</td>"
                    body+="<td style='font-size:10px; font-weight:bold;'>: 001/ISS-LG/FF</td>"
                    body+="</tr>";

                    body+= "<tr>";
                    body+="<td style='font-size:10px; font-weight:bold; align:center'></td>"
                    body+="<td style='font-size:10px; font-weight:bold;'>Revisi</td>"
                    body+="<td style='font-size:10px; font-weight:bold;'></td>"
                    body+="</tr>";

                    body+= "<tr>";
                    body+="<td style='font-size:10px; font-weight:bold; align:center'></td>"
                    body+="<td style='font-size:10px; font-weight:bold;'>Tanggal</td>"
                    body+="<td style='font-size:10px; font-weight:bold;'></td>"
                    body+="</tr>";

                    body+= "<tr>";
                    body+="<td style='font-size:14px; font-weight:bold; align:center' colspan='4'><u>Stock Card</u></td>"
                    body+="</tr>";

                    body+= "</tbody>"
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                    body+= "<tbody>";

                    body+= "<tr>"
                    body+= "<td style='width:30%'></td>"
                    body+= "<td style='width:2%'></td>"
                    body+= "<td style='width:63%'></td>"
                    body+= "<td style='width:5%'></td>"
                    body+="</tr>";

                    body+= "<tr>"
                    body+= "<td style='font-weight:bold; border: 1px solid black;' colspan='4'>No. Rak :</td>"
                    body+="</tr>";

                    body+= "<tr>"
                    body+= "<td style='font-weight:bold; border-left: 1px solid black;'>Mat. Name</td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black; '>:</td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black; '>"+item+"</td>"
                    body+= "<td style='border-right: 1px solid black;'></td>"
                    body+="</tr>";

                    body+= "<tr>"
                    body+= "<td style='font-weight:bold; border-left: 1px solid black;'>Lot Number / Expire Date</td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black; '>:</td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black; '>"+invNumber+ " / "+ expDate +"</td>"
                    body+= "<td style='border-right: 1px solid black;'></td>"
                    body+="</tr>";

                    body+= "<tr>"
                    body+= "<td style='font-weight:bold; border-left: 1px solid black;'>Inventory ID</td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black; '>:</td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black; '>"+invNumber+ "</td>"
                    body+= "<td style='border-right: 1px solid black;'></td>"
                    body+="</tr>";

                    body+= "<tr>"
                    body+= "<td style='font-weight:bold; border-left: 1px solid black;'>UoM</td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black; '>:</td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black; '>"+stockUnit+"</td>"
                    body+= "<td style='border-right: 1px solid black;'></td>"
                    body+="</tr>";

                    body+= "<tr>"
                    body+= "<td style='font-weight:bold; border-left: 1px solid black; border-bottom: 1px solid black;'></td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black;'></td>"
                    body+= "<td style='font-weight:bold; border-bottom: 1px solid black;'></td>"
                    body+= "<td style='border-right: 1px solid black; border-bottom: 1px solid black;'></td>"
                    body+="</tr>";

                    body+= "</tbody>"
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                    body+= "<tbody>";

                    body+= "<tr>"
                    body+= "<td style='width:5%'></td>"
                    body+= "<td style='width:18%'></td>"
                    body+= "<td style='width:10%'></td>"
                    body+= "<td style='width:10%'></td>"
                    body+= "<td style='width:10%'></td>"
                    body+= "<td style='width:17%'></td>"
                    body+= "<td style='width:30%'></td>"
                    body+="</tr>";

                    body+= "<tr>"
                    body+= "<td style='font-weight:bold;align:center; vertical-align: middle; border-left: 1px black solid; border-top: 1px black solid' rowspan='2'>No</td>"
                    body+= "<td style='font-weight:bold;align:center; vertical-align: middle; border-left: 1px black solid; border-top: 1px black solid' rowspan='2'>Date</td>"
                    body+= "<td style='font-weight:bold;align:center; vertical-align: middle; border-left: 1px black solid; border-top: 1px black solid' colspan='3'>Quantity</td>"
                    body+= "<td style='font-weight:bold;align:center; vertical-align: middle; border-left: 1px black solid; border-top: 1px black solid' rowspan='2'>Name and Sign Stock Keeper</td>"
                    body+= "<td style='font-weight:bold;align:center; vertical-align: middle; border-left: 1px black solid; border-top: 1px black solid; border-right: 1px black solid;' rowspan='2'>Remark</td>"
                    body+="</tr>"

                    body+= "<tr>"
                    body+= "<td style='font-weight:bold;vertical-align: middle; align:center;border-left: 1px black solid; border-top: 1px black solid'>In</td>"
                    body+= "<td style='font-weight:bold;vertical-align: middle; align:center;border-left: 1px black solid; border-top: 1px black solid'>Out</td>"
                    body+= "<td style='font-weight:bold;vertical-align: middle; align:center;border-left: 1px black solid; border-top: 1px black solid'>Stock</td>"
                    body+="</tr>"

                    var no = 1
                    var sumTotal = 25
                    for(var i = 0; i < sumTotal; i++){
                        body+= "<tr style='height:27px;'>"
                        body+= "<td style='border:1px solid black; border-right:none; align:center; vertical-align:middle;'>"+no+"</td>"
                        body+= "<td style='border:1px solid black;border-right:none; '></td>"
                        body+= "<td style='border:1px solid black; border-right:none;'></td>"
                        body+= "<td style='border:1px solid black; border-right:none;'></td>"
                        body+= "<td style='border:1px solid black; border-right:none;'></td>"
                        body+= "<td style='border:1px solid black; border-right:none;'></td>"
                        body+= "<td style='border:1px solid black;'></td>"
                        body+="</tr>"

                        no++
                    }

                    body+= "<tr>"
                    body+= "<td style='font-weight:bold;border: 1px black solid;' colspan='7'>NB : Kartu Stock ditulis dengan benar dan baik</td>"
                    body+= "</tr>"

                    body+= "</tbody>"
                    body+= "</table>";

                    footer += "<table class='tg' style='table-layout: fixed;'>";
                    footer += "<tbody>";
                    footer += "<tr style='height:40px;'>";
                    footer += "</tr>";
                    footer += "</tbody>";
                    footer += "</table>";
                    
                })
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
                    xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm; margin-top: 5px; margin-buttom: 5px; margin-left: 20px; margin-right: 20px; padding: 2px;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='7%'>";
                    xml += body;
                    xml += "\n</body>\n</pdf>";

                    xml = xml.replace(/ & /g, ' &amp; ');
                    response.renderPdf({
                        xmlString: xml
                    });
                    
                
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return{
        onRequest : onRequest
    }
});