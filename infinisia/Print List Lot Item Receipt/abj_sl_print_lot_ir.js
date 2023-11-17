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
                        })
                        log.debug('itemName', itemName);
                        if(itemName){
                            allData.push({
                                itemName : itemName,
                                qty : qty,
                                vendName : vendName,
                                lotNumber : lotNumber,
                                expireDate : expireDate,
                                tandId : tandId
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
                    style += ".tg .tg-img-logo{width:200px; height:70px; object-vit:cover;}";
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
                    body+= "<tr>";
                    if (urlLogo) {
                        body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                    }
                    body+="</tr>";
                    body+= "</tbody>";
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px; font-weight:bold\">";
                    body+= "<tbody>";
                    body+= "<tr>";
                    body+= "<td style='width:65%;'></td>"
                    body+= "<td style='width:15%%;'></td>"
                    body+= "<td style='width:1%%;'></td>"
                    body+= "<td style='width:19%%;'></td>"
                    body+= "</tr>";

                    body+= "<tr>";
                    body+= "<td></td>"
                    body+= "<td>Tanggal</td>"
                    body+= "<td>:</td>"
                    body+= "<td></td>"
                    body+= "</tr>";

                    body+= "<tr>";
                    body+= "<td></td>"
                    body+= "<td>No</td>"
                    body+= "<td>:</td>"
                    body+= "<td></td>"
                    body+= "</tr>";

                    body+= "</tbody>";
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:14px; font-weight:bold\">";
                    body+= "<tbody>";
                    body+= "<tr style='height:20px'>";
                    body+= "</tr>";
                    body+= "</tbody>";
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:14px; font-weight:bold\">";
                    body+= "<tbody>";
                    body+= "<tr>";
                    body+= "<td style='align:center'><u>SURAT PERINTAH PENERIMAAN BARANG (SPPB)</u></td>"
                    body+= "</tr>";
                    body+= "</tbody>";
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                    body+= "<tbody>";

                    body+= "<tr>";
                    body+= "<td style='width:75%;'></td>"
                    body+= "<td style='width:25%%;'></td>"
                    body+= "</tr>";
                    body+= "<tr>";
                    body+= "<td></td>"
                    body+= "<td style='align:leftt'>No. Form : 013/ISS-LG/FF</td>"
                    body+= "</tr>";
                    body+= "</tbody>";
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:11px;\">";
                    body+= "<tbody>";
                    body+= "<tr>";
                    body+= "<td class='tg-head_body' style='width:5%; border: 1px solid black; border-right:none;'> No </td>"
                    body+= "<td class='tg-head_body' style='width:23%; border: 1px solid black; border-right:none;'> SUPPLIER </td>"
                    body+= "<td class='tg-head_body' style='width:17%; border: 1px solid black; border-right:none;'> NAMA BARANG </td>"
                    body+= "<td class='tg-head_body' style='width:10%; border: 1px solid black; border-right:none;'> QTY (KG) </td>"
                    body+= "<td class='tg-head_body' style='width:10%; border: 1px solid black; border-right:none;'> PACKING </td>"
                    body+= "<td class='tg-head_body' style='width:10%; border: 1px solid black; border-right:none;'> NO LOT </td>"
                    body+= "<td class='tg-head_body' style='width:15%; border: 1px solid black; border-right:none;'> EXPIRED DATE </td>"
                    body+= "<td class='tg-head_body' style='width:20%; border: 1px solid black;'> KET </td>"
                    body+= "</tr>";
                    body += getData(context, allData);
                    body+= "</tbody>";
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:14px; font-weight:bold\">";
                    body+= "<tbody>";
                    body+= "<tr style='height:20px'>";
                    body+= "</tr>";
                    body+= "</tbody>";
                    body+= "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px; font-weight:bold\">";
                    body+= "<tbody>";
                    body+= "<tr>";
                    body+= "<td style='width:1%;'></td>"
                    body+= "<td style='width:23%;'></td>"
                    body+= "<td style='width:1%;'></td>"
                    body+= "<td style='width:1%;'></td>"
                    body+= "<td style='width:23%;'></td>"
                    body+= "<td style='width:1%;'></td>"
                    body+= "<td style='width:1%;'></td>"
                    body+= "<td style='width:23%;'></td>"
                    body+= "<td style='width:1%;'></td>"
                    body+= "<td style='width:1%;'></td>"
                    body+= "<td style='width:23%;'></td>"
                    body+= "<td style='width:1%;'></td>"
                    body+= "</tr>";

                    body+= "<tr>";
                    body+= "<td></td>"
                    body+= "<td style='align:center'>Purchasing,</td>"
                    body+= "<td></td>"
                    body+= "<td></td>"
                    body+= "<td style='align:center'>Admin,</td>"
                    body+= "<td></td>"
                    body+= "<td></td>"
                    body+= "<td style='align:center'>Bag Gudang,</td>"
                    body+= "<td></td>"
                    body+= "<td></td>"
                    body+= "<td style='align:center'>Penerima,</td>"
                    body+= "<td></td>"
                    body+= "</tr>";

                    body+= "<tr style='height:40px'>"
                    body+= "</tr>"

                    body+= "<tr>";
                    body+= "<td style='align:left'>(</td>"
                    body+= "<td></td>"
                    body+= "<td style='align:left'>)</td>"
                    body+= "<td style='align:left'>(</td>"
                    body+= "<td></td>"
                    body+= "<td style='align:left'>)</td>"
                    body+= "<td style='align:left'>(</td>"
                    body+= "<td></td>"
                    body+= "<td style='align:left'>)</td>"
                    body+= "<td style='align:left'>(</td>"
                    body+= "<td></td>"
                    body+= "<td style='align:left'>)</td>"
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
            var itemName = data.itemName;
            var vendName = data.vendName;
            var expireDate = data.expireDate;
            var qty = data.qty;
            var packing = data.tandId;
            var lotNumber = data.lotNumber;
            var ket = '';
            body += "<tr>";
            body += "<td style='font-size: 10px; border: 1px solid black; border-right:none; align:center'>"+No+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+vendName+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+itemName+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+qty+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+packing+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+lotNumber+"</td>";
            body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>"+expireDate+"</td>";
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