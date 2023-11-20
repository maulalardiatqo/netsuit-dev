/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
function(render, search, record, log, file, http, config, format, email, runtime) {
    function onRequest(context) {
        try{
            var allIdIr = JSON.parse(context.request.parameters.allIdIr);
            log.debug('allIdIr',allIdIr)
            var allData = [];
            if(allIdIr.length > 0){
                allIdIr.forEach((data)=>{
                    var idIr = data
                    log.debug('idIr', idIr);
                    
                    var itemreceiptSearchObj = search.create({
                        type: "itemreceipt",
                        filters:
                        [
                            ["type","anyof","ItemRcpt"], 
                            "AND", 
                            ["internalid","anyof",idIr], 
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "inventorynumber",
                                join: "inventoryDetail",
                                label: " Number"
                            }),
                            search.createColumn({name: "item", label: "Item"}),
                            search.createColumn({name: "quantity", label: "Quantity"}),
                            search.createColumn({name: "tranid",}),
                            search.createColumn({name: "trandate",}),
                            search.createColumn({
                                name: "legalname",
                                join: "vendor",
                                label: "Legal Name"
                            }),
                            search.createColumn({
                                name: "expirationdate",
                                join: "inventoryDetail",
                                label: "Expiration Date"
                            })
                        ]
                    });
                    var searchResultCount = itemreceiptSearchObj.runPaged().count;
                    log.debug("itemreceiptSearchObj result count",searchResultCount);
                    itemreceiptSearchObj.run().each(function(result){
                        var itemName = result.getText({
                            name : "item"
                        })
                        var tandId = result.getValue({
                            name : "tranid"
                        })
                        var qty = result.getValue({
                            name : "quantity"
                        })
                        var vendName = result.getValue({
                            name: "legalname",
                            join: "vendor",
                        })
                        var lotNumber = result.getText({
                            name: "inventorynumber",
                            join: "inventoryDetail",
                        });
                        var expireDate = result.getValue({
                            name: "expirationdate",
                            join: "inventoryDetail",
                        });
                        var trandate = result.getValue({
                            name: "trandate",
                        })
                        log.debug('itemName', itemName);
                        if(itemName){
                            allData.push({
                                itemName : itemName,
                                qty : qty,
                                vendName : vendName,
                                lotNumber : lotNumber,
                                expireDate : expireDate,
                                tandId : tandId,
                                trandate : trandate
                            })
                        }
                        
                        return true;
                    });
                    log.debug('allData', allData);
                    
                    
                })
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
                log.debug('urlLogo', urlLogo);
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
                    
        
                    header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                    header += "<tbody>";
                    header += "</tbody>";
                    header += "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";

                    body+= "<tbody>";
                    body+= "<tr>"
                    body+= "<td style='width:30%'></td>"
                    body+= "<td style='width:40%'></td>"
                    body+= "<td style='width:30%'></td>"
                    body+= "</tr>"

                    body+= "<tr>";
                    if (urlLogo) {
                        body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;' rowspan='2'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                    }else{
                        body+= "<td></td"
                    }
                    body+="<td style='font-size:18px; font-weight:bold; align:center' rowspan='2'>CHECKLIST BARANG MASUK</td>"
                    body+="<td></td>"
                    body+="</tr>";

                    body+= "<tr>"
                    body+="<td style='align:right'>No. Form : 015/ISS-LG/FF-01</td>"
                    body+= "</tr>"
                    body+= "</tbody>";
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                    body+= "<tbody>";
                    body+= "<tr>";
                    body+= "<td class='tg-head_body' style='width:10%;'></td>"
                    body+= "<td class='tg-head_body' style='width:15%;'></td>"
                    body+= "<td class='tg-head_body' style='width:8%;'></td>"
                    body+= "<td class='tg-head_body' style='width:5%;'></td>"
                    body+= "<td class='tg-head_body' style='width:5%;'></td>"
                    body+= "<td class='tg-head_body' style='width:5%;'></td>"
                    body+= "<td class='tg-head_body' style='width:5%;'></td>"
                    body+= "<td class='tg-head_body' style='width:5%;'></td>"
                    body+= "<td class='tg-head_body' style='width:5%;'></td>"
                    body+= "<td class='tg-head_body' style='width:10%;'></td>"
                    body+= "<td class='tg-head_body' style='width:5%;'></td>"
                    body+= "<td class='tg-head_body' style='width:5%;'></td>"
                    body+= "<td class='tg-head_body' style='width:17%;'></td>"
                    body+= "</tr>";
                    body+= "<tr>"
                    body+= "<td style='font-weight:bold; border: 1px solid black;' colspan='13'>Principal:</td>"
                    body+= "</tr>"
                    body+= "<tr>"
                    body+= "<td style='font-weight:bold; border: 1px solid black;' colspan='13'>Via:</td>"
                    body+= "</tr>"
                    body+= "<tr>"
                    body+= "<td style='align:center; font-weight:bold;  border: 1px solid black; border-right:none; vertical-align: middle;' rowspan='2'>Tgl Penerimaan</td>"
                    body += "<td style='font-weight:bold; border: 1px solid black; border-right:none; vertical-align: middle;' rowspan='2'>Nama Item</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; vertical-align: middle;' rowspan='2'>Lot No :</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center' colspan='2'>Gross Weight</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center' colspan='2'>Packing(Neto)</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none align:center'>Quantity</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; vertical-align: middle;' rowspan='2'>Kondisi Kemasan</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; vertical-align: middle;' rowspan='2'>EXPIRED DATE > 1 YEAR</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center' colspan='2'>DOCUMENT</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; vertical-align: middle;' rowspan='2'>Keterangan</td>"
                    body+= "</tr>"
                    body+= "<tr>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center'>Y/N</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center'>Kg</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center'>Y/N</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center'>(@)Kg</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center'>Y/N</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center'>COA</td>"
                    body+= "<td style=' font-weight:bold; border: 1px solid black; border-right:none; align:center'>MSDS</td>"
                    body+= "</tr>"
                    body += getData(context, allData);
                    body+= "<tr>"
                    body+= "<td style='font-weight:bold; border: 1px solid black; border-right:none;' colspan='8'>MENGETAHUI :</td>"
                    body+= "<td style='font-weight:bold; border: 1px solid black;' colspan='5'>PELAKSANA :</td>"
                    body+= "</tr>"
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
                    xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 21cm; width: 29.7cm; margin-top: 5px; margin-buttom: 5px; margin-left: 20px; margin-right: 20px; padding: 2px;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='7%'>";
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
      function getData(context, allData){
        var body = "";
        allData = allData
        log.debug('allData', allData);
        var No = 1;
        allData.forEach((data)=>{
            var trandate = data.trandate;
            var itemName = data.itemName;
            var vendName = data.vendName;
            var expireDate = data.expireDate;
            var yn = '';
            var kg = '';
            var qty = data.qty;
            var packing = data.tandId;
            var lotNumber = data.lotNumber;
            var coa ='';
            var mdsm = '';
            var ket = '';
            var kondisi = '';
            body += "<tr>";
            body += "<td style='font-size: 10px; border: 1px solid black; border-right:none; align:center'>"+trandate+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+itemName+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+lotNumber+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+yn+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+kg+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+yn+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+kg+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+qty+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+kondisi+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+expireDate+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+coa+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+mdsm+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black;'>"+ket+"</td>";
            body += "</tr>";
            No ++
        })
        return body;
      }
      return {
        onRequest: onRequest,
    };
  });