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
                        id: 'customsearch514'
                    });

                    var filters = doSearch.filters;
                    filters.push(search.createFilter({
                        name: 'custrecord_packship_itemfulfillment',
                        operator: search.Operator.ANYOF,
                        values: doIds
                    }));

                    var searchResult = doSearch.run().getRange({ start: 0, end: 1000 });
                    log.debug('search result count', searchResult.length);

                    searchResult.forEach(function (result) {
                        var itemFulfillmentId = result.getValue({ name: 'custrecord_packship_itemfulfillment' });
                        var itemFulfillmentText = result.getText({ name: 'custrecord_packship_itemfulfillment' });
                        var carton = result.getText({ name: 'custrecord_packship_carton' });
                        var item = result.getText({ name: 'custrecord_packship_fulfillmentitem' });
                        var totalPickedQty = result.getValue({ name: 'custrecord_packship_totalpickedqty' });
                        var totalPackedQty = result.getValue({ name: 'custrecord_packship_totalpackedqty' });
                        var customer = result.getValue({
                            name: "entity",
                            join: "CUSTRECORD_PACKSHIP_ITEMFULFILLMENT"
                        });
                        var customerName = result.getText({
                            name: "entity",
                            join: "CUSTRECORD_PACKSHIP_ITEMFULFILLMENT"
                        });
                        var displayNameitem = result.getValue({
                            name: "itemid",
                            join: "CUSTRECORD_PACKSHIP_FULFILLMENTITEM",
                        });
                        var sizeItem = result.getText({
                            name: "custitem_item_size",
                            join: "CUSTRECORD_PACKSHIP_FULFILLMENTITEM",
                        })
                        // Cek apakah customer sudah ada di object
                        if (!allDataLineByCustomer[customer]) {
                            allDataLineByCustomer[customer] = [];
                        }

                        // Push data line ke array berdasarkan customer
                        allDataLineByCustomer[customer].push({
                            itemFulfillmentId: itemFulfillmentId,
                            itemFulfillmentText: itemFulfillmentText,
                            customerName : customerName,
                            carton: carton,
                            item: item,
                            totalPickedQty: totalPickedQty,
                            totalPackedQty: totalPackedQty,
                            displayNameitem : displayNameitem,
                            sizeItem : sizeItem
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
                style += "*{padding : 0; margin:0, 2, 0, 2;}";
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

                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";

                

                header += "</tbody>";
                header += "</table>";
                const customerIds = Object.keys(allDataLineByCustomer);

                customerIds.forEach((customerId, index) => {
                    const customerLines = allDataLineByCustomer[customerId];
                    log.debug('index', index)
                    if (index > 0) {
                         body += "<div style='page-break-before:always'></div>";
                    }
                
                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                    body += "<tbody>";

                    body += "<tr>"
                    body += "<td style='width:40%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:15%'></td>"
                    body += "<td style='width:25%'></td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='font-size:18px; align:center; font-weight:bold;' colspan='4'>Packing List</td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='font-size:12px;'>"+escapeXmlSymbols(subsidiary)+"</td>"
                    body += "<td style='font-size:12px;'></td>"
                    body += "<td style='font-size:12px;'>Paking List No </td>"
                    body += "<td style='font-size:12px;'>: "+escapeXmlSymbols(docNumb)+"</td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='font-size:12px;' rowspan='3'>"+escapeXmlSymbols(addr1)+"</td>"
                    body += "<td style='font-size:12px;'></td>"
                    body += "<td style='font-size:12px;'>Tanggal Kirim </td>"
                    body += "<td style='font-size:12px;'>: "+escapeXmlSymbols(shipDate)+"</td>"
                    body += "</tr>"

                    body += "<tr>"
                    body += "<td style='font-size:12px;'></td>"
                    body += "<td style='font-size:12px;'>Tanggal Terima </td>"
                    body += "<td style='font-size:12px;'>:</td>"
                    body += "</tr>"

                    body += "<tr style='height:30px;'>"
                    body += "<td style='font-size:12px;' colspan='3'></td>"
                    body += "</tr>"

                    const customerName = customerLines[0].customerName;

                    const noDOList = [...new Set(
                        customerLines.map(line => line.itemFulfillmentText.replace('Item Fulfillment ', ''))
                    )].join(', ');
                    body += "<tr>"
                    body += "<td style='font-size:12px;'> Customer : "+ escapeXmlSymbols(customerName) + "</td>";
                    body += "<td style='font-size:12px; align:right;'>No DO :</td>";
                    body += "<td style='font-size:12px;' colspan='2'>"+ escapeXmlSymbols(noDOList) +"</td>";
                    body += "</tr>"

                    body += "</tbody>";
                    body += "</table>";
                    
                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:12px;\">";
                    body += "<tbody>";

                    body += "<tr>"
                    body += "<td style='width:5%; align:center; border: solid black 1px; border-right:none;'>No.</td>"
                    body += "<td style='width:15%; align:center; border: solid black 1px; border-right:none;'>Item Code</td>"
                    body += "<td style='width:35%; align:center; border: solid black 1px; border-right:none;'>Item Description</td>"
                    body += "<td style='width:10%; align:center; border: solid black 1px; border-right:none;'>Size</td>"
                    body += "<td style='width:10%; align:center; border: solid black 1px; border-right:none;'>Qty</td>"
                    body += "<td style='width:25%; align:center; border: solid black 1px; '>Box. No.</td>"
                    body += "</tr>"
                    var Nomor = 1
                    var qtyTotal = 0
                    customerLines.forEach((line, idx) => {
                        log.debug('line.displayNameitem', line.displayNameitem)
                        var itemFullName = line.displayNameitem
                        var afterSplit = itemFullName.split(':')[1].trim();
                        let firstSpaceIndex = afterSplit.indexOf(' ');
                        let itemCode = afterSplit.substring(0, firstSpaceIndex);
                        let itemDesc = afterSplit.substring(firstSpaceIndex + 1);
                        body += "<tr>"
                        body += "<td style='border: solid black 1px; border-right:none;'>"+Nomor+"</td>"
                        body += "<td style='border: solid black 1px; border-right:none;'>"+escapeXmlSymbols(itemCode || '')+"</td>"
                        body += "<td style='border: solid black 1px; border-right:none;'>"+escapeXmlSymbols(itemDesc || '')+"</td>"
                        body += "<td style='border: solid black 1px; border-right:none; align:center;'>"+escapeXmlSymbols(line.sizeItem || '')+"</td>"
                        body += "<td style='border: solid black 1px; border-right:none;'>"+escapeXmlSymbols(line.totalPickedQty || '')+"</td>"
                        body += "<td style='border: solid black 1px;'>"+escapeXmlSymbols(line.carton || '')+"</td>"
                        body += "</tr>"
                        Nomor += 1
                        qtyTotal += parseInt(line.totalPickedQty || 0)
                        
                    });
                    body += "<tr>"
                    body += "<td style='border: solid black 1px; border-right:none; align:center;' colspan='4'>Total Quantity</td>"
                    body += "<td style='border: solid black 1px;' colspan='2'>"+qtyTotal+"</td>"
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

                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "'>";
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