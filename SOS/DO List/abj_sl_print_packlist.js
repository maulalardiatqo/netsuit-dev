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
                var subsidiary = packRecord.getValue({name :'subsidiarynohierarchy'});
                var addr1 = packRecord.getValue({name :'name: "address1",join: "subsidiary"'});
                var docNumb = packRecord.getValue({name :'tranid'});
                var shipDate = packRecord.getValue({name :'trandate'});
                var listDo = packRecord.getValue({name :'custbody_do_list'});
                log.debug('listDo', listDo);
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
                        var carton = result.getValue({ name: 'custrecord_packship_carton' });
                        var item = result.getValue({ name: 'custrecord_packship_fulfillmentitem' });
                        var totalPickedQty = result.getValue({ name: 'custrecord_packship_totalpickedqty' });
                        var totalPackedQty = result.getValue({ name: 'custrecord_packship_totalpackedqty' });
                        var customer = result.getValue({
                            name: "entity",
                            join: "CUSTRECORD_PACKSHIP_ITEMFULFILLMENT"
                        });

                        // Cek apakah customer sudah ada di object
                        if (!allDataLineByCustomer[customer]) {
                            allDataLineByCustomer[customer] = [];
                        }

                        // Push data line ke array berdasarkan customer
                        allDataLineByCustomer[customer].push({
                            itemFulfillmentId: itemFulfillmentId,
                            carton: carton,
                            item: item,
                            totalPickedQty: totalPickedQty,
                            totalPackedQty: totalPackedQty
                        });
                    });
                }
                log.debug('allDataLineByCustomer', JSON.stringify(allDataLineByCustomer));
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '26%';
                var style = "";
                var footer = "";
                var pdfFile = null;
                
                // css
                style += "<style type='text/css'>";
                style += "*{padding : 0; margin:0;}";
                style += "body{padding-left : 5px; padding-right : 5px;}";
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

                    // render XML
                var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                xml += "<pdf>";
                xml += "<head>";
                xml += style;
                xml += "<macrolist>";
                xml += "<macro id=\"nlheader\">";
                xml += header;
                xml += "</macro>";
                xml += "</macrolist>";
                xml += "</head>";

                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 21cm; width: 29.7cm;' header='nlheader' header-height='" + headerHeight + "'>";
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