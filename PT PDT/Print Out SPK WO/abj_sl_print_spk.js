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

    function formatDateToDDMMYYYY(dateInput) {
        if (!dateInput) return "";
        
        let dateObj = new Date(dateInput);
        if (isNaN(dateObj.getTime())) return "";

        let day = String(dateObj.getDate()).padStart(2, '0');
        let month = String(dateObj.getMonth() + 1).padStart(2, '0');
        let year = dateObj.getFullYear();

        return `${day}/${month}/${year}`;
    }

    function onRequest(context) {
        var recid = context.request.parameters.recId;
        log.debug('recid', recid)
        if(!recid){
            return
        }
        var rec = record.load({
            type : "workorder",
            id : recid
        });
        var order = rec.getValue('tranid');
        var location = rec.getText('location');
        var itemId = rec.getValue('assemblyitem');
        var assemblyitem = "";
        var itemName = "";
        if(itemId){
            const assemblyitemSearchObj = search.create({
            type: "assemblyitem",
            filters:
            [
                ["type","anyof","Assembly"], 
                "AND", 
                ["internalid","anyof",itemId]
            ],
            columns:
            [
                search.createColumn({name: "itemid", label: "Name"}),
                search.createColumn({name: "displayname", label: "Display Name"})
            ]
            });
            const searchResultCount = assemblyitemSearchObj.runPaged().count;
            log.debug("assemblyitemSearchObj result count",searchResultCount);
            assemblyitemSearchObj.run().each(function(result){
                assemblyitem = result.getValue({
                    name: "itemid"
                })
                itemName = result.getValue({
                    name: "displayname"
                })
            return false;
            });
        }
        var createdDate = formatDateToDDMMYYYY(rec.getValue('createddate'));
        var startDate = rec.getText('startdate');
        var endDate = rec.getText('enddate');
        var billOffMaterial = rec.getText('billofmaterials');
        var bomRevision = rec.getText('billofmaterialsrevision');
        var bomId = rec.getValue('billofmaterialsrevision');
    
        
        var location = rec.getText('location');
        var qtyWO = Number(rec.getValue('quantity')) || 0;
        var estSetup = 0
        var estRunTime = 0
        var squence = "";
        var optName = "";
        var manWO = "";

        var manufacturingRouting = rec.getValue('manufacturingrouting');
        if(manufacturingRouting){
            const manufacturingroutingSearchObj = search.create({
                type: "manufacturingrouting",
                filters:
                [
                    ["internalid","anyof",manufacturingRouting]
                ],
                columns:
                [
                    search.createColumn({name: "sequence", label: "Operation Sequence"}),
                    search.createColumn({name: "operationname", label: "Operation Name"}),
                    search.createColumn({name: "manufacturingworkcenter", label: "Manufacturing Work Center"}),
                    search.createColumn({name: "setuptime", label: "Setup Time"}),
                    search.createColumn({name: "runrate", label: "Run Rate"})
                ]
                });
                const searchResultCount = manufacturingroutingSearchObj.runPaged().count;
                log.debug("manufacturingroutingSearchObj result count",searchResultCount);
                manufacturingroutingSearchObj.run().each(function(result){
                    squence = result.getValue({
                        name : "sequence"
                    });
                    optName = result.getValue({
                        name : "operationname"
                    })
                    manWO = result.getText({
                        name : "manufacturingworkcenter"
                    })
                    var setUpTIme = result.getValue({
                        name : "setuptime" 
                    }) || 0;
                    var runRate = result.getValue({
                        name : "runrate"
                    }) || 0;
                    estSetup = Number(setUpTIme) * qtyWO;
                    estRunTime = Number(runRate) * qtyWO;
                return true;
                });
        }
        
        let arrBomComponents = [];

        if (bomId) {
            const bomrevisionSearchObj = search.create({
                type: "bomrevision",
                filters: [
                    ["internalid", "anyof", bomId]
                ],
                columns: [
                    search.createColumn({ name: "item", join: "component", label: "Item" }),
                    search.createColumn({ name: "quantity", join: "component", label: "Quantity" }),
                    search.createColumn({ name: "units", join: "component", label: "Units" })
                ]
            });

            let rawComponents = [];
            let uniqueItemIds = [];

            bomrevisionSearchObj.run().each(function (resV) {
                let compItemId = resV.getValue({ name: "item", join: "component" });
                
                if (compItemId && uniqueItemIds.indexOf(compItemId) === -1) {
                    uniqueItemIds.push(compItemId);
                }

                rawComponents.push({
                    itemId: compItemId,
                    qtyUnit: Number(resV.getValue({ name: "quantity", join: "component" })) || 0,
                    units: resV.getValue({ name: "units", join: "component" }) || ""
                });

                return true;
            });
            log.debug('rawComponents', rawComponents)
            log.debug('uniqueItemIds', uniqueItemIds)
            let itemDataMap = {};

            if (uniqueItemIds.length > 0) {
                search.create({
                    type: "item",
                    filters: [
                        ["internalid", "anyof", uniqueItemIds]
                    ],
                    columns: ["itemid", "displayname"]
                }).run().each(function (itemRes) {
                    itemDataMap[itemRes.id] = {
                        itemCode: itemRes.getValue("itemid") || "",
                        itemName: itemRes.getValue("displayname") || ""
                    };
                    return true;
                });
            }

            for (let i = 0; i < rawComponents.length; i++) {
                let comp = rawComponents[i];
                let itemInfo = itemDataMap[comp.itemId] || { itemCode: "", itemName: "" };
                let estQtyRequire = comp.qtyUnit * (Number(qtyWO) || 0);

                arrBomComponents.push({
                    itemCode: itemInfo.itemCode,
                    itemName: itemInfo.itemName,
                    qtyUnit: comp.qtyUnit,
                    units: comp.units,
                    estQtyRequire: estQtyRequire
                });
            }
        }
        log.debug('arrBomComponents', arrBomComponents)
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

        // ================= HEADER =================
        header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
        header += "<tbody>";
        header += "<tr>";
        header += "<td style='width:15%'></td>"
        header += "<td style='width:30%'></td>"
        header += "<td style='width:10%'></td>"
        header += "<td style='width:45%'></td>"
        header += "</tr>";
        
        header += "<tr>";
        header += "<td class='tg-headerlogo' style='width:30%; align:left;' colspan='2' rowspan='3'><img src='" + urlLogo + "' width='180' height='40'></img></td>";
        header += "<td></td>"
        header += "<td>Work Order "+ order + "</td>"
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
        header += "<td></td>"
        header += "<td></td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Subsidiary</td>"
        header += "<td>:"+subsName+"</td>"
        header += "<td></td>"
        header += "<td>Date Created : "+createdDate+"</td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Location</td>"
        header += "<td>:"+location+"</td>"
        header += "<td></td>"
        header += "<td>Production Start Date: "+startDate+"</td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Assembly Item</td>"
        header += "<td>:"+assemblyitem+"</td>"
        header += "<td></td>"
        header += "<td>Production End Date: "+endDate+"</td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Item Display Name</td>"
        header += "<td>:"+itemName+"</td>"
        header += "<td></td>"
        header += "<td>Bill of Materials: "+billOffMaterial+"</td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Plan Quantity</td>"
        header += "<td>:"+qtyWO+"</td>"
        header += "<td></td>"
        header += "<td>Bill of Materials Revision: "+bomRevision+"</td>"
        header += "</tr>";


        header += "</tbody>";
        header += "</table>";

        // ================= PAGE 1: ROUTING =================
        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='width:15%'></td>"
        body += "<td style='width:20%'></td>"
        body += "<td style='width:18%'></td>"
        body += "<td style='width:12%'></td>"
        body += "<td style='width:10%'></td>"
        body += "<td style='width:10%'></td>"
        body += "<td style='width:15%'></td>"
        body += "</tr>";
        
        body += "<tr>";
        body += "<td style='border:1px solid black;' colspan='7'>Routing</td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border:1px solid black;'>Operation Squence</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Operation Name</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Manufacturing Work Center</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Est.Setup Time</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Est.Run Time</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Act.Run Time</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Note/Comment</td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border-left: 1px solid black; border-bottom: 1px solid black; '>"+squence+"</td>"
        body += "<td style='border-bottom: 1px solid black;'>"+optName+"</td>"
        body += "<td style='border-bottom: 1px solid black;'>"+manWO+"</td>"
        body += "<td style='border-bottom: 1px solid black;'>"+estSetup+"</td>"
        body += "<td style='border-bottom: 1px solid black;'>"+estRunTime+"</td>"
        body += "<td style='border-bottom: 1px solid black;'></td>"
        body += "<td style='border-right: 1px solid black; border-bottom: 1px solid black;'></td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border:1px solid black;' colspan='7'>Activity Detail</td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border-left: 1px solid black; border-bottom: 1px solid black; '>No</td>"
        body += "<td style='border-bottom: 1px solid black;'>Tanggal</td>"
        body += "<td style='border-bottom: 1px solid black;' colspan='5'>Ket</td>"
        body += "</tr>";

        body += "</tbody>";
        body += "</table>";

        // PAGE BREAK PERTAMA UNTUK MENUJU KE PAGE 2
        body += "<pbr/>"; 

        // ================= PAGE 2: BILL OF MATERIALS =================
        body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:8px;\">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='width:20%'></td>"
        body += "<td style='width:20%'></td>"
        body += "<td style='width:15%'></td>"
        body += "<td style='width:8%'></td>"
        body += "<td style='width:10%'></td>"
        body += "<td style='width:10%'></td>"
        body += "<td style='width:17%'></td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border:1px solid black;' colspan='7'>Bill of Materials</td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border:1px solid black'>Component Item</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Display Name</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Est.Quantity Required</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Units</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Location</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Actual Usage</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Note/Comment</td>"
        body += "</tr>";

        if (arrBomComponents && arrBomComponents.length > 0) {
            for (let j = 0; j < arrBomComponents.length; j++) {
                let comp = arrBomComponents[j];
                
                body += "<tr>";
                body += "<td style='border:1px solid black; border-bottom:none;' >" + (comp.itemCode || "") + "</td>";
                body += "<td style='border:1px solid black; border-left:none; border-bottom:none;' >" + (comp.itemName || "") + "</td>";
                body += "<td style='border:1px solid black; border-left:none; border-bottom:none;'>" + Number(comp.estQtyRequire || 0).toFixed(3) + "</td>";
                body += "<td style='border:1px solid black; border-left:none; border-bottom:none;'>" + (comp.units || "") + "</td>";
                body += "<td style='border:1px solid black; border-left:none; border-bottom:none;'>"+location+"</td>";
                body += "<td style='border:1px solid black; border-left:none; border-bottom:none;'></td>";
                body += "<td style='border:1px solid black; border-left:none; border-bottom:none;'></td>";
                
                body += "</tr>";
            }
        } 
        body += "<tr>";
        body += "<td style='border:1px solid black;' colspan='7'>Bill of Materials</td>"
        body += "</tr>";
        body += "</tbody>";
        body += "</table>";

        // PAGE BREAK KEDUA UNTUK MENUJU KE PAGE 3
        body += "<pbr/>"; 

        // ================= PAGE 3: OUTPUT DETAIL =================
        body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:8px;\">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='width:15%'></td>"
        body += "<td style='width:15%'></td>"
        body += "<td style='width:40%'></td>"
        body += "<td style='width:8%'></td>"
        body += "<td style='width:22%'></td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border:1px solid black;' colspan='5'>Output Detail</td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border:1px solid black'>Item Assembly</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Display Name</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Quantity/Lot</td>"
        body += "<td style='border:1px solid black; border-left:none;'>Units</td>"
        body += "<td style='border:1px solid black; border-left:none;'></td>"
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border:1px solid black; '>"+assemblyitem+"</td>"
        body += "<td style='border:1px solid black; border-left:none;'>"+itemName+"</td>"
        body += "<td style='border:1px solid black; border-left:none;'></td>"
        body += "<td style='border:1px solid black; border-left:none;'></td>"
        body += "<td style='border:1px solid black; border-left:none;'></td>"
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

        xml = xml.replace(/ & /g, ' &amp; ');
        response.renderPdf({
            xmlString: xml
        });

    }
    return {
        onRequest: onRequest,
    };
});