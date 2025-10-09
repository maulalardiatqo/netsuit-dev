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
            return input.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&apos;");
        }
        function onRequest(context) {
            try{
                var recid = context.request.parameters.id;
                var searchCreate = search.load({
                    id: "customsearch513",
                });
                if(recid){
                    searchCreate.filters.push(search.createFilter({name: "internalid", operator: search.Operator.ANYOF, values: recid}));
                }
                var searchCreateSet = searchCreate.run();
                var result = searchCreateSet.getRange(0, 1);
                var packRecord = result[0];
                // data header
                var subsidiary = packRecord.getText({name :'subsidiarynohierarchy'});
                var addr1 = packRecord.getValue({name :"address1", join: "subsidiary",});
                var docNumb = packRecord.getValue({name :'tranid'});
                var shipDate = packRecord.getValue({name :'trandate'});
                var listDo = packRecord.getValue({name :'custbody_do_list'});
                log.debug('listDo', listDo);
                log.debug('addr1', addr1)
                var doIds = listDo ? listDo.split(',') : [];
                log.debug('doIds array', doIds);
                var allDataLineByCustomer = {};

                if (doIds.length > 0) {
                    var doSearch = search.load({
                        id: 'customsearch_print_out_surat_jalan'
                    });

                    var filters = doSearch.filters;
                    filters.push(search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: doIds
                    }));

                    var searchResult = doSearch.run().getRange({ start: 0, end: 1000 });
                    log.debug('search result count', searchResult.length);

                    searchResult.forEach(function (result) {
                        var itemFulfillmentId = result.getValue({ name: 'internalid' });
                        var customer = result.getValue({
                            name: "entity"
                        });
                        var customerName = result.getText({
                            name: "entity"
                        });
                        var qty = result.getValue({
                            name  : "quantity"
                        });
                        var shipAddr = result.getValue({
                            name : "shipaddress"
                        });
                        var color = result.getText({
                            name: "custitem_item_color",
                            join: "item",
                        });
                        var size = result.getText({
                            name: "custitem_item_size",
                            join: "item",
                        });
                        var item = result.getText({
                            name : "item"
                        })
                        var itemName = result.getValue({
                            name: "itemid",
                            join: "item",
                        })
                        var displayNameitem = result.getValue({
                            name: "displayname",
                            join: "item",
                        })
                        var doNo = result.getValue({
                            name : "tranid"
                        })
                        // Cek apakah customer sudah ada di object
                        if (!allDataLineByCustomer[customer]) {
                            allDataLineByCustomer[customer] = [];
                        }

                        // Push data line ke array berdasarkan customer
                        allDataLineByCustomer[customer].push({
                            itemFulfillmentId: itemFulfillmentId,
                            item: item,
                            size: size,
                            color: color,
                            qty : qty,
                            shipAddr : shipAddr,
                            customerName : customerName,
                            customer : customer,
                            displayNameitem : displayNameitem,
                            doNo : doNo,
                            itemName : itemName
                        });
                    });
                }
                log.debug('allDataLineByCustomer', JSON.stringify(allDataLineByCustomer));
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '0%';
                var style = "";
                var footer = "";
                var pdfFile = null;
                
                // css
                style += "<style type='text/css'>";
                style += "*{padding : 0; margin:0;}";
                style += "body{padding-left : 15px; padding-right : 15px;}";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerlogo {align:right; border:none;}";
                style += ".tg .tg-img-logo {width:195px; height:90px; object-fit:cover;}";
                style += ".tg .tg-headerrow, .tg .tg-headerrow_alva {align: right; font-size:12px;}";
                style += ".tg .tg-headerrow_legalName, .tg .tg-headerrow_legalName_Alva {align: left; font-size:13px; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total {align: right; font-size:16px; font-weight: bold;}";
                style += ".tg .tg-head_body {align: left; font-size:12px; font-weight: bold; border-top:3px solid black; border-bottom:3px solid black;}";
                style += ".tg .tg-jkm {background-color:#eba134;}";
                style += ".tg .tg-sisi {background-color:#F8F40F;}";
                style += ".tg .tg-alva {background-color:#08B1FF;}";
                style += ".tg .tg-froyo {background-color:#0A65EC; color:#F9FAFC;}";
                style += ".tg .tg-b_body {align:left; font-size:12px; border-bottom:2px solid black;}";
                style += ".tg .tg-f_body {align:right; font-size:14px; border-bottom:2px solid black;}";
                style += ".tg .tg-foot {font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += "</style>";

                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;background-color:yellow;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";
                const customerIds = Object.keys(allDataLineByCustomer);

                customerIds.forEach((customerId, index) => {
                    const customerLines = allDataLineByCustomer[customerId];
                    log.debug('customerLines', customerLines)
                    log.debug('index', index)
                    if (index > 0) {
                        body += "<div style='page-break-before:always'></div>";
                    }
                
                    body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                    body += "<tbody>";
                    var addressShip = customerLines[0].shipAddr
                    log.debug('addressShip', addressShip)
                    const customerName = customerLines[0].customerName;

                    body += "<tr>"
                    body += "<td style='width:50%'></td>"
                    body += "<td style='width:50%'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='font-size:18px; align:center; font-weight:bold;' colspan='2'>Delivery Notes</td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='font-size:10px; border-top:1px solid black; border-left:1px solid black; border-right:4px solid black; border-bottom:1px solid black;'><p>"+escapeXmlSymbols(subsidiary)+"</p>"+escapeXmlSymbols(addr1)+"</td>"
                    body += "<td style='font-size:10px; border-top:1px solid black; border-bottom:1px solid black; border-right:1px solid black;'><p>Kepada Yth,"+escapeXmlSymbols(customerName)+"</p>"+escapeXmlSymbols(addressShip)+"</td>"
                    body += "</tr>"

                    body += "<tr>";
                    body += "<td colspan='2' style='width:2px; background-color:black; height:10px; padding:0;'></td>";
                    body += "</tr>";

                    body += "<tr>"
                    body += "<td style='font-size:10px; border: 1px solid black' colspan='2'><p>No. Bukti : ST"+escapeXmlSymbols(docNumb)+"</p>No. Refference : SL"+escapeXmlSymbols(docNumb)+"</td>"
                    body += "</tr>"

                    body += "</tbody>";
                    body += "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                    body += "<tbody>";

                    body += "<tr>"
                    body += "<td style='width:5%; align:center; border: solid black 1px; border-right:none;'>NO.</td>"
                    body += "<td style='width:20%; align:center; border: solid black 1px; border-right:none;'>NO. DO</td>"
                    body += "<td style='width:15%; align:center; border: solid black 1px; border-right:none;'>ITEM CODE</td>"
                    body += "<td style='width:35%; align:center; border: solid black 1px; border-right:none;'>ARTICLE</td>"
                    body += "<td style='width:7%; align:center; border: solid black 1px; border-right:none;'>COLOR</td>"
                    body += "<td style='width:10%; align:center; border: solid black 1px; border-right:none;'>SIZE</td>"
                    body += "<td style='width:8%; align:center; border: solid black 1px;'>QTY</td>"
                    body += "</tr>"
                    var Nomor = 1
                    var qtyTotal = 0
                    customerLines.forEach((line, idx) => {
                        let itemCode = "";
                        let itemBefore = line.itemName;

                        if (itemBefore) {
                            let parts = itemBefore.split(':');
                            itemCode = parts[0].trim();
                        }

                        let itemDesc = line.displayNameitem || ""
                        body += "<tr>"
                        body += "<td style='border: solid black 1px; border-right:none; border-top:none;'>"+Nomor+"</td>"
                        body += "<td style='border: solid black 1px; border-right:none; border-top:none;'>"+escapeXmlSymbols(line.doNo || '')+"</td>"
                        body += "<td style='border: solid black 1px; border-right:none; border-top:none;'>"+escapeXmlSymbols(itemCode || '')+"</td>"
                        body += "<td style='border: solid black 1px; border-right:none;  border-top:none;'>"+escapeXmlSymbols(itemDesc || '')+"</td>"
                        body += "<td style='border: solid black 1px; border-right:none;  border-top:none;'>"+escapeXmlSymbols(line.color || '')+"</td>"
                        body += "<td style='border: solid black 1px; border-right:none;  border-top:none;'>"+escapeXmlSymbols(line.size || '')+"</td>"
                        body += "<td style='border: solid black 1px; border-top:none;'>"+escapeXmlSymbols(line.qty || '')+"</td>"
                        body += "</tr>"

                        Nomor += 1
                        qtyTotal += parseInt(line.qty || 0)
                    });
                    body += "<tr>"
                    body += "<td style='border: solid black 1px; border-right:none;' colspan='6'>Total Quantity</td>"
                    body += "<td style='border: solid black 1px;'>"+qtyTotal+"</td>"
                    body += "</tr>"

                    body += "<tr style='height:20px;'>"
                    body += "</tr>"

                    body += "</tbody>";
                    body += "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                    body += "<tbody>";

                    body += "<tr>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='font-size:14px; align:center; background-color:black; color:white;' colspan='4'>PREPARED BY</td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='border: 1px solid black; border-right:none; border-bottom:none; align:center;'>Diserahkan Oleh,</td>"
                    body += "<td style='border: 1px solid black; border-right:none; border-bottom:none; align:center;'>Dikirim Oleh,</td>"
                    body += "<td style='border: 1px solid black; border-right:none; border-bottom:none; align:center;'>Mengetahui,</td>"
                    body += "<td style='border: 1px solid black; border-bottom:none; align:center;'>Diterima Oleh,</td>"
                    body += "</tr>"

                    body += "<tr style='height:60px;'>"
                    body += "<td style='border: 1px solid black; border-right:none; border-bottom:none; border-top:none; align:center;'></td>"
                    body += "<td style='border: 1px solid black; border-right:none; border-bottom:none; border-top:none; align:center;'>Bag. Expedisi</td>"
                    body += "<td style='border: 1px solid black; border-right:none; border-bottom:none; border-top:none; align:center;'>Ka. Gudang</td>"
                    body += "<td style='border: 1px solid black; border-bottom:none; border-top:none;'></td>"
                    body += "</tr>"


                    body += "<tr style=''>"
                    body += "<td style='border: 1px solid black; border-right:none; border-top:none; align:center;'>(.........................)</td>"
                    body += "<td style='border: 1px solid black; border-right:none; border-top:none; align:center;'>(.........................)</td>"
                    body += "<td style='border: 1px solid black; border-right:none; border-top:none; align:center;'>(.........................)</td>"
                    body += "<td style='border: 1px solid black; border-top:none; align:center;'>(.........................)</td>"
                    body += "</tr>"

                    body += "</tbody>";
                    body += "</table>";
                });

                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr style='height:40px;'>";
                footer += "</tr>";
                footer += "</tbody>";
                footer += "</table>";
                
                var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                xml += "<pdf xmlns:pdf=\"http://ns.adobe.com/pdf/1.3/\">";
                xml += "<head>";
                xml += style;
                xml += "<macrolist>";
                xml += "<macro id=\"nlheader\">";
                xml += header;
                xml += "</macro>";
                xml += "</macrolist>";
                xml += "</head>";

                // Persempit margin body
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif; margin:0; padding:0; padding-left:15px; padding-right:15px; height: 14cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "'>";
                xml += body;
                xml += footer;
                xml += "\n</body>\n</pdf>";
                xml = xml.replace(/ & /g, ' &amp; ');

                response.renderPdf({
                    xmlString: xml
                });
            }catch(e){
                log.debug('error', e)
            }
        }
          return {
            onRequest: onRequest,
        };
    }
);