/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
function(render, search, record, log, file, http, config, format, email, runtime) {

    function escapeXmlSymbols(input) {
        if (!input || typeof input !== "string") {
            return input;
        }
        return input.replace(/&/g, "&amp;");
    }
    function onRequest(context) {
        var recid = context.request.parameters.recId;
        log.debug('recid', recid)
        if(!recid){
            return
        }
        var rec = record.load({
            type : "salesorder",
            id : recid
        });
        var subsId = rec.getValue('subsidiary');
        var urlLogo = '';
        var state = '';
        var subsName = '';
        var subsAddress = '';
        if(subsId){
            var subsidiariRec = record.load({
                type: "subsidiary",
                id: subsId,
                isDynamic: false,
            });
            var logo = subsidiariRec.getValue('logo');
            var filelogo;
            
            if (logo) {
                filelogo = file.load({
                    id: logo
                });
                urlLogo = filelogo.url.replace(/&/g, "&amp;");
            }
            state = escapeXmlSymbols(subsidiariRec.getValue('state'));
            subsName = escapeXmlSymbols(subsidiariRec.getValue('name'));
            log.debug('subsName', subsName)
            subsAddress = escapeXmlSymbols(subsidiariRec.getValue("mainaddress_text"));
        }
        var subsAddressEnter = subsAddress = subsAddress.replace(/\r\n|\n|\r/g, '<br/>');
        var toDepartment = escapeXmlSymbols(rec.getValue('custbody_pdt_to'));
        var toName = ""
        var idName = rec.getValue('custbody_pdt_to_name')
        if(idName){
            const employeeSearchObj = search.create({
            type: "employee",
            filters:
            [
                ["internalid","anyof",idName]
            ],
            columns:
            [
                search.createColumn({name: "firstname", label: "First Name"}),
                search.createColumn({name: "middlename", label: "Middle Name"}),
                search.createColumn({name: "lastname", label: "Last Name"})
            ]
            });
            const searchResultCount = employeeSearchObj.runPaged().count;
            log.debug("employeeSearchObj result count",searchResultCount);
            employeeSearchObj.run().each(function(result){
                var fName = result.getValue({
                    name : "firstname"
                })
                var mname = result.getValue({
                    name : "middlename"
                })
                var lname = result.getValue({
                    name : "lastname"
                })
                var gabungName = fName + " " + mname + " " + lname
                toName = escapeXmlSymbols(gabungName)
            return true;
            });
        }
        var order = rec.getValue('tranid');
        var trandate = rec.getText('trandate');
        var stateDate = state + ',' + ' ' + trandate
        log.debug('stateDate', stateDate);
        var noBooking = order.replace(/^[^\/]+/, 'BN');

        // data main body
        var invAddress = escapeXmlSymbols(rec.getValue('billaddress'));
        if (invAddress.indexOf('\n') !== -1) {
            log.debug('ada enternya')
        } else {
            log.debug('tidak ada enternya')
        }
        invAddress = invAddress.replace(/\r\n|\n|\r/g, '<br/>');
        var consignee = escapeXmlSymbols(rec.getValue('shipaddress'));
        consignee = consignee.replace(/\r\n|\n|\r/g, '<br/>');
        var allItemName = [];
        var allPackaging = [];
        const salesorderSearchObj = search.create({
        type: "salesorder",
        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
        filters:
        [
            ["type","anyof","SalesOrd"], 
            "AND", 
            ["mainline","is","F"], 
            "AND", 
            ["taxline","is","F"], 
            "AND", 
            ["cogs","is","F"], 
            "AND", 
            ["internalid","anyof",recid]
        ],
        columns:
        [
            search.createColumn({
                name: "displayname",
                join: "item",
                label: "Display Name"
            }),
            search.createColumn({name: "custcol_pdt_packaging", label: "PDT - Packaging"})
        ]
        });
        const searchResultCount = salesorderSearchObj.runPaged().count;
        log.debug("salesorderSearchObj result count",searchResultCount);
        salesorderSearchObj.run().each(function(result){
            var itemName = result.getValue({
                name: "displayname",
                join: "item",
            });
            var packageName = result.getValue({
                name : "custcol_pdt_packaging"
            });
            log.debug('packageName', packageName)
            if (packageName && !allPackaging.includes(packageName)) {
                allPackaging.push(packageName);
            }

            if (itemName && !allItemName.includes(itemName)) {
                allItemName.push(itemName);
            } else {
                allItemName.push(itemName);
            }

            return true;
        });
        log.debug('allPackaging', allPackaging)
        var strAllItemName = allItemName.join('<br/>');
        var strAllPackaging = allPackaging.join('<br/>');
        log.debug('strAllPackaging', strAllPackaging)
        var quantityOrder = rec.getValue('custbody_pdt_qty_ordered');
        var totalCargo = rec.getValue('custbody_pdt_total_cargo');
        var deliveryDate = rec.getValue('custbody_pdt_delivery_date');
        var notes = rec.getValue('custbody_pdt_notes');

        var response = context.response;
        var xml = "";
        var header = "";
        var body = "";
        var headerHeight = '18%';
        var style = "";
        var footer = "";

        style += "<style type='text/css'>";
        style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
        style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
        // style += ".tg .img-logo { max-width: 250px; height: auto; max-height: 80px; object-fit: contain; }";
        // style += ".tg .tg-img-logo-a{width:150px; height:70px; object-vit:cover;}";
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

        header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
        header += "<tbody>";
        header += "<tr>";
        header += "<td style='width:7%'></td>"
        header += "<td style='width:23%'></td>"
        header += "<td style='width:40%'></td>"
        header += "<td style='width:30%'></td>"
        header += "</tr>";
        
        header += "<tr>";
        header += "<td class='tg-headerlogo' style='width:30%; align:left;' colspan='2' rowspan='3'><img src='" + urlLogo + "' width='180' height='40'></img></td>";
        header += "<td></td>"
        header += "<td>"+ order + " " + "Booking Note" +"</td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td></td>"
        header += "<td></td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td></td>"
        header += "<td></td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td colspan='3' style='font-size:12px; font-weight:bold;'>"+subsName+"</td>"
        header += "<td></td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>To</td>"
        header += "<td>: "+toDepartment+"</td>"
        header += "<td></td>"
        header += "<td>"+stateDate+"</td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Attn</td>"
        header += "<td>: "+toName+"</td>"
        header += "<td></td>"
        header += "<td></td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td colspan='4' style='font-weight:bold;align:center; text-decoration:underline;'>BOOKING NOTE</td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td colspan='4' style='font-weight:bold;align:center;'>"+noBooking+"</td>"
        header += "</tr>";

        header += "</tbody>";
        header += "</table>";

        body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='width:20%'></td>"
        body += "<td style='width:5%'></td>"
        body += "<td style='width:25%'></td>"
        body += "<td style='width:50%'></td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td colspan='4'>Please Arrange the Shipment as Detailed</td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;'>Shiper</td>"
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;align:center;'>:</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;' colspan='2'><b>" + subsName + "</b><br/>" + subsAddress + "</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;'>Invoice Address</td>"
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;align:center;'>:</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;' colspan='2'>" + invAddress + "</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;'>Consignee</td>"
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;align:center;'>:</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;' colspan='2'>" + consignee + "</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;'>Product name</td>"
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;align:center;'>:</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;' colspan='2'>" + strAllItemName + "</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;'>Packaging</td>"
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;align:center;'>:</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;' colspan='2'>" + strAllPackaging + "</td>";
        body += "</tr>";
        
        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;'>Quantity Ordered</td>"
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;align:center;'>:</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;' colspan='2'>" + quantityOrder + "</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;'>Total Cargo</td>"
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;align:center;'>:</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;' colspan='2'>" + totalCargo + "</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;'>Delivery Date</td>"
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;align:center;'>:</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;' colspan='2'>" + deliveryDate + "</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;'>Notes</td>"
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none;align:center;'>:</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;' colspan='2'>" + notes + "</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none; align:center;' colspan='3'>Your Faithfully</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;align:center;'>Please Confirm Your</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-bottom:none; border-top:none; align:center;' colspan='3'>"+subsName+"</td>"
        body += "<td style='border: 1px solid black; border-bottom:none;align:center; border-top:none;'>Promissory and Return</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; align:center; height:80px;' colspan='3'></td>"
        body += "<td style='border: 1px solid black; align:center; height:80px;'></td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='' colspan='3'></td>"
        body += "<td style='align:right; font-weight:bold; text-decoration:underline;'>Factory Office</td>";
        body += "</tr>";

        body += "<tr>";
body += "<td colspan='3'></td>";
body += "<td><p align='right' style='text-align: right; margin: 0;'>" + subsAddressEnter + "</p></td>";
body += "</tr>";

        body += "</tbody>";
        body += "</table>";


        footer += "<table class='tg' style='table-layout: fixed;'>";
        footer += "<tbody>";
        footer += "<tr style='height:1px;'>";
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

        // page dua

        xml = xml.replace(/ & /g, ' &amp; ');
        response.renderPdf({
            xmlString: xml
        });

    }
    return {
        onRequest: onRequest,
    };
});