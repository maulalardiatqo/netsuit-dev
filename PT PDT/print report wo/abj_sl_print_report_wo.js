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
    function parseNum(val) {
            if (!val) return 0;
            var num = parseFloat(String(val).replace(/,/g, '').replace('%', ''));
            return isNaN(num) ? 0 : num;
        }
    function getLotDetails(lotId) {
        var dataLot = { sn: '', pb: '', snBalance: '' };
        if (!lotId) return dataLot;

        const invNumSearch = search.create({
            type: "inventorynumber",
            filters: [ ["internalid", "anyof", lotId] ],
            columns: [
                search.createColumn({name: "custitemnumber_abj_pdt_sn_percent"}),
                search.createColumn({name: "custitemnumber_abj_pdt_pb"}),
                search.createColumn({name: "custitemnumber_abj_pdt_sn_balance"})
            ]
        });
        
        invNumSearch.run().each(function(dataInv){
            dataLot.sn = dataInv.getValue({ name: "custitemnumber_abj_pdt_sn_percent" });
            dataLot.pb = dataInv.getValue({ name: "custitemnumber_abj_pdt_pb" });
            dataLot.snBalance = dataInv.getValue({ name: "custitemnumber_abj_pdt_sn_balance" });
            return false; // Cukup return false agar loop berhenti di hasil pertama (hemat limit)
        });
        return dataLot;
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
        var dateTran = rec.getValue('trandate'); 
        var namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        var hari = namaHari[dateTran.getDay()];

        log.debug('Nama Hari', hari);
    
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); 
        var yyyy = today.getFullYear();

        var currentDate = dd + '/' + mm + '/' + yyyy;

        var initialLot = rec.getValue('custbody_pdt_initial_lot_number');
        var startDate = rec.getText('actualproductionstartdate');
        var endDate = rec.getText('actualproductionenddate');

        // get item
       var allItem = []; 
        var getItemCount = rec.getLineCount({
            sublistId : "item"
        });
        log.debug('getItemCount', getItemCount);
        
        if(getItemCount > 0){
            for(var i = 0; i < getItemCount; i++){
                var itemId = rec.getSublistValue({
                    sublistId : "item",
                    fieldId : "item",
                    line : i
                });
                var itemText = rec.getSublistText({
                    sublistId : "item",
                    fieldId : "item",
                    line : i
                }) || '';

                var qtyBuild = rec.getSublistValue({
                    sublistId : "item",
                    fieldId : "quantityfulfilled",
                    line : i
                });
                
                var units = rec.getSublistText({
                    sublistId : "item",
                    fieldId : "units_display",
                    line : i
                }) || rec.getSublistValue({
                    sublistId : "item",
                    fieldId : "units_display",
                    line : i
                }) || '';
                
                allItem.push({
                    itemId : itemId,
                    itemText : itemText,
                    qtyBuild : qtyBuild,
                    units : units
                });
            }
        }
        log.debug('allItem', allItem);
        
       var dataFromSearch = [];
        const workorderissueSearchObj = search.create({
            type: "workorderissue",
            settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
            filters:
            [
                ["type","anyof","WOIssue"], 
                "AND", 
                ["createdfrom","anyof",recid], 
                "AND", 
                ["inventorydetail.quantity","isnotempty",""]
            ],
            columns:
            [
                search.createColumn({name: "item", label: "Item"}),
                search.createColumn({
                    name: "quantity",
                    join: "inventoryDetail",
                    label: "Quantity"
                }),
                search.createColumn({
                    name: "inventorynumber",
                    join: "inventoryDetail",
                    label: " Number"
                })
            ]
        });
        
        workorderissueSearchObj.run().each(function(data){
            var itemSearch = data.getValue({ name: "item" });
            var qty = data.getValue({ name: "quantity", join: "inventoryDetail" });
            
            var lotId = data.getValue({ name: "inventorynumber", join: "inventoryDetail" });
            var lotNumberText = data.getText({ name: "inventorynumber", join: "inventoryDetail" }) || '';
            
            // Panggil Helper Function yang sudah dibuat sebelumnya
            var lotDetails = getLotDetails(lotId);
            
            dataFromSearch.push({
                itemSearch : itemSearch,
                qty : qty,
                lotNumberText : lotNumberText,
                sn : lotDetails.sn,
                pb : lotDetails.pb,
                snBalance : lotDetails.snBalance
            });
            return true;
        });


        // ==========================================
        // 2. KELOMPOKKAN KE allItemA & allItemB
        // ==========================================
        var allItemA = []; 
        var allItemB = []; 
        var groupedSearchData = {};

        // Grouping data search berdasarkan Item ID
        for (var idx = 0; idx < dataFromSearch.length; idx++) {
            var searchRow = dataFromSearch[idx];
            if (!groupedSearchData[searchRow.itemSearch]) {
                groupedSearchData[searchRow.itemSearch] = [];
            }
            groupedSearchData[searchRow.itemSearch].push(searchRow);
        }

        // Looping allItem (dari sublist) sebagai acuan
        for (var x = 0; x < allItem.length; x++) {
            var currentBaseItem = allItem[x];
            var matchedLots = groupedSearchData[currentBaseItem.itemId] || [];
            var lotCount = matchedLots.length;

            if (lotCount > 1) {
                // Masuk ke allItemA jika Lot > 1
                for (var y = 0; y < matchedLots.length; y++) {
                    allItemA.push({
                        itemText: currentBaseItem.itemText,
                        lotNumberText: matchedLots[y].lotNumberText,
                        quantity: matchedLots[y].qty, 
                        units: currentBaseItem.units,
                        sn: matchedLots[y].sn,
                        pb: matchedLots[y].pb,
                        snBalance: matchedLots[y].snBalance
                    });
                }
            } else {
                // Masuk ke allItemB jika Lot hanya 1 atau kosong
                if (lotCount === 1) {
                    allItemB.push({
                        itemText: currentBaseItem.itemText,
                        lotNumberText: matchedLots[0].lotNumberText,
                        quantity: matchedLots[0].qty, 
                        units: currentBaseItem.units,
                        sn: matchedLots[0].sn,
                        pb: matchedLots[0].pb,
                        snBalance: matchedLots[0].snBalance
                    });
                } else {
                    allItemB.push({
                        itemText: currentBaseItem.itemText,
                        lotNumberText: "",
                        quantity: currentBaseItem.qtyBuild, 
                        units: currentBaseItem.units,
                        sn: "",
                        pb: "",
                        snBalance: ""
                    });
                }
            }
        }

        log.debug('allItemA Result', allItemA);
        log.debug('allItemB Result', allItemB);

        // data for item C dan item D
       var allItemC = [];
        const workordercompletionSearchObj = search.create({
            type: "workordercompletion",
            settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
            filters:
            [
                ["type","anyof","WOCompl"], 
                "AND", 
                ["createdfrom","anyof",recid], 
                "AND", 
                ["mainline","is","T"]
            ],
            columns:
            [
                search.createColumn({name: "item", label: "Item"}),
                search.createColumn({
                    name: "inventorynumber",
                    join: "inventoryDetail",
                    label: " Number"
                }),
                search.createColumn({
                    name: "quantity",
                    join: "inventoryDetail",
                    label: "Quantity"
                }),
                search.createColumn({name: "unitabbreviation", label: "Units"})
            ]
        });
        
        workordercompletionSearchObj.run().each(function(dataWOC){
            var itemWOC = dataWOC.getText({ name: "item" });
            var lotTextWOC = dataWOC.getText({ name: "inventorynumber", join: "inventoryDetail" });
            var qtyLotWOC = dataWOC.getValue({ name: "quantity", join: "inventoryDetail" }); // Diganti getValue agar mudah dihitung
            var unitsWOC = dataWOC.getText({ name: "unitabbreviation" });
            var lotId = dataWOC.getValue({ name: "inventorynumber", join: "inventoryDetail" });
            
            // Panggil Helper Function
            var lotDetails = getLotDetails(lotId);
            
            allItemC.push({
                itemWOC : itemWOC,
                lotTextWOC : lotTextWOC,
                qtyLotWOC : qtyLotWOC,
                unitsWOC : unitsWOC,
                sn : lotDetails.sn,
                pb : lotDetails.pb,
                snBalance : lotDetails.snBalance
            });
            return true;
        });
        log.debug('allItemC', allItemC);


        // ==========================================
        // PROSES DATA ITEM D
        // ==========================================
        var allItemD = [];
        var processedLinkIds = []; // TAMBAHAN: Array untuk melacak ID yang sudah diproses

        const wocGetForItemD = search.create({
            type: "workordercompletion",
            settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
            filters:
            [
                ["type","anyof","WOCompl"], 
                "AND", 
                ["createdfrom","anyof",recid], 
                "AND", 
                ["mainline","is","T"], 
                "AND", 
                ["custrecord_pdt_link_wo_completion.custrecord_pdt_link_transaction","noneof","@NONE@"]
            ],
            columns:
            [
                search.createColumn({
                    name: "custrecord_pdt_item_result",
                    join: "CUSTRECORD_PDT_LINK_WO_COMPLETION",
                    label: "Item Result"
                }),
                search.createColumn({
                    name: "custrecord_pdt_link_transaction",
                    join: "CUSTRECORD_PDT_LINK_WO_COMPLETION",
                    label: "Link Transaction Result"
                })
            ]
        });
        
        wocGetForItemD.run().each(function(resultwoc){
            var linkTrxText = resultwoc.getText({
                name: "custrecord_pdt_link_transaction",
                join: "CUSTRECORD_PDT_LINK_WO_COMPLETION"
            }) || '';
            
            var linkTrxId = resultwoc.getValue({
                name: "custrecord_pdt_link_transaction",
                join: "CUSTRECORD_PDT_LINK_WO_COMPLETION"
            });

            // 1. TAMBAHAN: Cek apakah ID transaksi ini sudah diproses di putaran loop sebelumnya
            if (!linkTrxId || processedLinkIds.indexOf(linkTrxId) !== -1) {
                return true; // Jika sudah ada, lewati agar tidak dobel
            }
            processedLinkIds.push(linkTrxId); // Masukkan ke dalam daftar pelacakan

            // LOGIC KONDISI BERDASARKAN PREFIX NAMA TRANSAKSI
            if (linkTrxText.indexOf("Work Order") === 0) {
                
                var searchWOComplD = search.create({
                    type: "workordercompletion",
                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                    filters: [
                        ["type","anyof","WOCompl"], "AND", 
                        ["createdfrom","anyof",linkTrxId], "AND",  
                        ["mainline","is","T"]
                    ],
                    columns: [
                        search.createColumn({name: "item", label: "Item"}),
                        search.createColumn({name: "inventorynumber", join: "inventoryDetail", label: " Number"}),
                        search.createColumn({name: "quantity", join: "inventoryDetail", label: "Quantity"}),
                        search.createColumn({name: "unitabbreviation", label: "Units"})
                    ]
                });

                searchWOComplD.run().each(function(dataWOC_D){
                    var itemD = dataWOC_D.getText({ name: "item" });
                    var lotTextD = dataWOC_D.getText({ name: "inventorynumber", join: "inventoryDetail" });
                    var qtyLotD = dataWOC_D.getValue({ name: "quantity", join: "inventoryDetail" });
                    var unitsD = dataWOC_D.getText({ name: "unitabbreviation" });
                    var lotId = dataWOC_D.getValue({ name: "inventorynumber", join: "inventoryDetail" });

                    var lotDetails = getLotDetails(lotId); // Panggil Helper Function yang tadi

                    allItemD.push({
                        itemD : itemD,
                        lotTextD : lotTextD,
                        qtyLotD : qtyLotD,
                        unitsD : unitsD,
                        sn : lotDetails.sn,
                        pb : lotDetails.pb,
                        snBalance : lotDetails.snBalance
                    });
                    return true;
                });

            } else if (linkTrxText.indexOf("Inventory Adjustment") === 0) {
                
                const inventoryadjustmentSearchObj = search.create({
                    type: "inventoryadjustment",
                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                    filters: [
                        ["type","anyof","InvAdjst"], "AND", 
                        // 2. PERBAIKAN: Gunakan internalid dengan linkTrxId (Bukan recid)
                        ["internalid","anyof",linkTrxId], "AND", 
                        // 3. TAMBAHAN: Mainline = F agar tidak menarik header transaksi
                        ["mainline","is","F"], "AND",
                        ["inventorydetail.inventorynumber","noneof","@NONE@"]
                    ],
                    columns: [
                        search.createColumn({name: "item", label: "Item"}),
                        search.createColumn({name: "inventorynumber", join: "inventoryDetail", label: " Number"}),
                        search.createColumn({name: "quantity", join: "inventoryDetail", label: "Quantity"})
                    ]
                });

                inventoryadjustmentSearchObj.run().each(function(resultAdj){
                    var itemD = resultAdj.getText({ name: "item" }) || resultAdj.getValue({ name: "item" });
                    var lotTextD = resultAdj.getText({ name: "inventorynumber", join: "inventoryDetail" });
                    var qtyLotD = resultAdj.getValue({ name: "quantity", join: "inventoryDetail" });
                    var lotId = resultAdj.getValue({ name: "inventorynumber", join: "inventoryDetail" });
                    
                    var lotDetails = getLotDetails(lotId);

                    allItemD.push({
                        itemD : itemD,
                        lotTextD : lotTextD,
                        qtyLotD : qtyLotD,
                        unitsD : "", 
                        sn : lotDetails.sn,
                        pb : lotDetails.pb,
                        snBalance : lotDetails.snBalance
                    });
                    return true;
                });
            }

            return true;
        });
        log.debug('allItemD Cleaned', allItemD);

        var forLabel = '';
        var manufWoC = '';
        const manufacturingoperationtaskSearchObj = search.create({
        type: "manufacturingoperationtask",
        filters:
        [
            ["status","anyof","PROGRESS","NOTSTART"], 
            "AND", 
            ["workorder","anyof",recid]
        ],
        columns:
        [
            search.createColumn({name: "internalid", label: "Internal ID"}),
            search.createColumn({name: "manufacturingworkcenter", label: "Manufacturing Work Center"})
        ]
        });
        const searchResultCount = manufacturingoperationtaskSearchObj.runPaged().count;
        log.debug("manufacturingoperationtaskSearchObj result count",searchResultCount);
        manufacturingoperationtaskSearchObj.run().each(function(result){
            manufWoC = result.getValue({
                name : "manufacturingworkcenter"
            });
        return true;
        });
        if(manufWoC == 1503 || manufWoC == 2208){
            forLabel = 'Furnace'
        }else if( manufWoC == 2209){
            forLabel = 'CL'
        }else if(manufWoC == 2212 ){
            forLabel = 'Refining'
        }
        var formatLabel = "Laporan Harian " + forLabel 
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
        var headerHeight = '13%';
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
        style += "</style>";

        header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
        header += "<tbody>";
        header += "<tr>";
        header += "<td style='width:20%'></td>"
        header += "<td style='width:16%'></td>"
        header += "<td style='width:16%'></td>"
        header += "<td style='width:16%'></td>"
        header += "<td style='width:16%'></td>"
        header += "<td style='width:16%'></td>"
        header += "</tr>";
        
        header += "<tr>";
        header += "<td class='tg-headerlogo' style='width:20%; align:left;' colspan='2' rowspan='3'><img src='" + urlLogo + "' width='120' height='30'></img></td>";
        header += "<td  colspan='2' rowspan='3' style='font-size:16px; font-weight:bold;'>"+formatLabel+"</td>"
        header += "<td>No Dokumen</td>"
        header += "<td>: "+ order + "</td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Tanggal Terbit </td>"
        header += "<td>: "+ currentDate + "</td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>No Revision </td>"
        header += "<td>:</td>"
        header += "</tr>";

        header += "<tr style='height:20px'>";
        header += "<td colspan='6'></td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Hari </td>"
        header += "<td>:"+hari+"</td>"
        header += "<td></td>"
        header += "<td></td>"
        header += "<td>No Charging</td>"
        header += "<td></td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Tanggal Mulai </td>"
        header += "<td>:"+startDate+"</td>"
        header += "<td>Jam Mulai</td>"
        header += "<td></td>"
        header += "<td>No.Pot</td>"
        header += "<td></td>"
        header += "</tr>";

        header += "<tr>";
        header += "<td>Tanggal Selesai </td>"
        header += "<td>:"+endDate+"</td>"
        header += "<td>Jam Selesai</td>"
        header += "<td></td>"
        header += "<td></td>"
        header += "<td></td>"
        header += "</tr>";

        header += "</tbody>";
        header += "</table>";

        body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:9px; border-collapse:collapse;\">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='width:5%'></td>";
        body += "<td style='width:25%'></td>";
        body += "<td style='width:20%'></td>";
        body += "<td style='width:14%'></td>";
        body += "<td style='width:8%'></td>";
        body += "<td style='width:8%'></td>";
        body += "<td style='width:10%'></td>";
        body += "<td style='width:10%'></td>";
        body += "</tr>";
        
        body += "<tr style='background-color:#7cb5ec;'>";
        body += "<td style='border:1px solid black; align:center;' colspan='8'>Detail Material</td>";
        body += "</tr>";

        body += "<tr style='background-color:#a9d08e;'>";
        body += "<td style='border:1px solid black;'>No</td>";
        body += "<td style='border:1px solid black;'>Component Item</td>";
        body += "<td style='border:1px solid black;'>Lot Number</td>";
        body += "<td style='border:1px solid black;'>Quantity</td>";
        body += "<td style='border:1px solid black;'>Sat</td>";
        body += "<td style='border:1px solid black;'>Sn</td>";
        body += "<td style='border:1px solid black;'>Pb</td>";
        body += "<td style='border:1px solid black;'>Sn Balance</td>";
        body += "</tr>";

        var nomor = 1;

        // ==============================
        // LOOPING GRUP A (allItemA)
        // ==============================
        var sumQtyA = 0;
        var sumSnA = 0;
        var countSnA = 0;
        var sumSnBalanceA = 0;

        for (var a = 0; a < allItemA.length; a++) {
            var row = allItemA[a];
            var qty = parseNum(row.quantity) || 0;
            var sn = parseNum(row.sn) || 0;
            var snBalance = (Number(qty) * Number(sn)) / 100;

            // Perhitungan Summary A
            sumQtyA += qty;
            sumSnBalanceA += snBalance;
            if (sn > 0) {
                sumSnA += sn;
                countSnA++;
            }

            body += "<tr>";
            body += "<td style='border:1px solid black; align:center;'>" + nomor + "</td>";
            body += "<td style='border:1px solid black;'>" + (row.itemText || '') + "</td>";
            body += "<td style='border:1px solid black;'>" + (row.lotNumberText || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + qty + "</td>";
            body += "<td style='border:1px solid black; align:center;'>" + (row.units || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (row.sn ? sn + "%" : "") + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (row.pb || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + snBalance.toFixed(2) + "</td>";
            body += "</tr>";
            nomor++;
        }

        // BARIS SUMMARY A (Kuning)
        var avgSnA = countSnA > 0 ? (sumSnA / countSnA).toFixed(2) : 0;
        body += "<tr style='background-color:#ffff00; font-weight:bold;'>";
        body += "<td style='border:1px solid black; align:center; color:red;'>A</td>";
        body += "<td style='border:1px solid black; border-right:none;'></td>";
        body += "<td style='border:1px solid black; border-left:none;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + sumQtyA.toFixed(2) + "</td>";
        body += "<td style='border:1px solid black;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + avgSnA + "%</td>";
        body += "<td style='border:1px solid black;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + sumSnBalanceA.toFixed(2) + "</td>";
        body += "</tr>";

        var sumQtyB = 0;
        var sumSnB = 0;
        var countSnB = 0;
        var sumSnBalanceB = 0;

        for (var b = 0; b < allItemB.length; b++) {
            var rowB = allItemB[b];
            var qtyB = parseNum(rowB.quantity) || 0;
            var snB = parseNum(rowB.sn) || 0;
            var snBalanceB = (Number(qtyB) * Number(snB)) / 100;
            sumQtyB += qtyB;
            sumSnBalanceB += snBalanceB;
            if (snB > 0) {
                sumSnB += snB;
                countSnB++;
            }

            body += "<tr>";
            body += "<td style='border:1px solid black; align:center;'>" + nomor + "</td>";
            body += "<td style='border:1px solid black;'>" + (rowB.itemText || '') + "</td>";
            body += "<td style='border:1px solid black;'>" + (rowB.lotNumberText || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + qtyB + "</td>";
            body += "<td style='border:1px solid black; align:center;'>" + (rowB.units || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (rowB.sn ? snB + "%" : "") + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (rowB.pb || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + snBalanceB.toFixed(2) + "</td>";
            body += "</tr>";
            nomor++;
        }

        var avgSnB = countSnB > 0 ? (sumSnB / countSnB).toFixed(2) : 0;
        body += "<tr style='background-color:#ffff00; font-weight:bold;'>";
        body += "<td style='border:1px solid black; align:center; color:red;'>B</td>";
        body += "<td style='border:1px solid black; border-right:none;'></td>";
        body += "<td style='border:1px solid black; border-left:none;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + sumQtyB.toFixed(2) + "</td>";
        body += "<td style='border:1px solid black;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + avgSnB + "%</td>";
        body += "<td style='border:1px solid black;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + sumSnBalanceB.toFixed(2) + "</td>";
        body += "</tr>";

        body += "</tbody>";
        body += "</table>";

         body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed; font-size:9px; border-collapse:collapse;\">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='width:5%'></td>";
        body += "<td style='width:25%'></td>";
        body += "<td style='width:20%'></td>";
        body += "<td style='width:14%'></td>";
        body += "<td style='width:8%'></td>";
        body += "<td style='width:8%'></td>";
        body += "<td style='width:10%'></td>";
        body += "<td style='width:10%'></td>";
        body += "</tr>";
        
        body += "<tr style='background-color:#7cb5ec;'>";
        body += "<td style='border:1px solid black; align:center;' colspan='8'>Detail Output</td>";
        body += "</tr>";

        body += "<tr style='background-color:#a9d08e;'>";
        body += "<td style='border:1px solid black;'>No</td>";
        body += "<td style='border:1px solid black;'>Main Item Ouput</td>";
        body += "<td style='border:1px solid black;'>Lot Number</td>";
        body += "<td style='border:1px solid black;'>Quantity</td>";
        body += "<td style='border:1px solid black;'>Sat</td>";
        body += "<td style='border:1px solid black;'>Sn</td>";
        body += "<td style='border:1px solid black;'>Pb</td>";
        body += "<td style='border:1px solid black;'>Sn Balance</td>";
        body += "</tr>";

        // ==============================
        // LOOPING GRUP C (Main Item Output)
        // ==============================
        var sumQtyC = 0;
        var sumSnC = 0;
        var countSnC = 0;
        var sumSnBalanceC = 0;
        var lastItemC = "";
        var noC = 1;

        for (var c = 0; c < allItemC.length; c++) {
            var rowC = allItemC[c];
            var qtyC = parseNum(rowC.qtyLotWOC);
            var snC = parseNum(rowC.sn);
            var snBalanceC = (Number(qtyC) * Number(snC)) / 100;

            // Perhitungan Summary C
            sumQtyC += qtyC;
            sumSnBalanceC += snBalanceC;
            if (snC > 0) {
                sumSnC += snC;
                countSnC++;
            }

            var displayNoC = "";
            var displayItemC = "";
            if (rowC.itemWOC !== lastItemC) {
                displayNoC = noC;
                displayItemC = rowC.itemWOC || '';
                lastItemC = rowC.itemWOC;
                noC++;
            }

            body += "<tr>";
            body += "<td style='border:1px solid black; align:center;'>" + displayNoC + "</td>";
            body += "<td style='border:1px solid black;'>" + displayItemC + "</td>";
            body += "<td style='border:1px solid black;'>" + (rowC.lotTextWOC || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + qtyC + "</td>";
            body += "<td style='border:1px solid black; align:center;'>" + (rowC.unitsWOC || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (rowC.sn ? snC.toFixed(2) + "%" : "") + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (rowC.pb || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (snBalanceC > 0 ? snBalanceC.toFixed(2) : "") + "</td>";
            body += "</tr>";
        }

        // BARIS SUMMARY C (Kuning)
        var avgSnC = countSnC > 0 ? (sumSnC / countSnC).toFixed(2) : 0;
        body += "<tr style='background-color:#ffff00; font-weight:bold;'>";
        body += "<td style='border:1px solid black; align:center; color:red;'>C</td>";
        body += "<td style='border:1px solid black; border-right:none;'></td>";
        body += "<td style='border:1px solid black; border-left:none;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + sumQtyC.toFixed(2) + "</td>";
        body += "<td style='border:1px solid black;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + avgSnC + "%</td>";
        body += "<td style='border:1px solid black;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + sumSnBalanceC.toFixed(2) + "</td>";
        body += "</tr>";

        // ==============================
        // SUB-HEADER GRUP D (Co Product)
        // ==============================
        body += "<tr style='background-color:#a9d08e;'>";
        body += "<td style='border:1px solid black;'>No</td>";
        body += "<td style='border:1px solid black;'>Co Product</td>";
        body += "<td style='border:1px solid black;'>Lot Number</td>";
        body += "<td style='border:1px solid black;'>Quantity</td>";
        body += "<td style='border:1px solid black;'>Sat</td>";
        body += "<td style='border:1px solid black;'>Sn</td>";
        body += "<td style='border:1px solid black;'>Pb</td>";
        body += "<td style='border:1px solid black;'>Sn Balance</td>";
        body += "</tr>";

        // ==============================
        // LOOPING GRUP D (Co Product)
        // ==============================
        var sumQtyD = 0;
        var sumSnD = 0;
        var countSnD = 0;
        var sumSnBalanceD = 0;
        var lastItemD = "";
        var noD = 1;

        for (var d = 0; d < allItemD.length; d++) {
            var rowD = allItemD[d];
            var qtyD = parseNum(rowD.qtyLotD);
            var snD = parseNum(rowD.sn);
            var snBalanceD = (Number(qtyD) * Number(snD)) / 100;

            // Perhitungan Summary D
            sumQtyD += qtyD;
            sumSnBalanceD += snBalanceD;
            if (snD > 0) {
                sumSnD += snD;
                countSnD++;
            }

            var displayNoD = "";
            var displayItemD = "";
            if (rowD.itemD !== lastItemD) {
                displayNoD = noD;
                displayItemD = rowD.itemD || '';
                lastItemD = rowD.itemD;
                noD++;
            }

            body += "<tr>";
            body += "<td style='border:1px solid black; align:center;'>" + displayNoD + "</td>";
            body += "<td style='border:1px solid black;'>" + displayItemD + "</td>";
            body += "<td style='border:1px solid black;'>" + (rowD.lotTextD || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + qtyD + "</td>";
            body += "<td style='border:1px solid black; align:center;'>" + (rowD.unitsD || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (rowD.sn ? snD.toFixed(2) + "%" : "") + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (rowD.pb || '') + "</td>";
            body += "<td style='border:1px solid black; align:right;'>" + (snBalanceD > 0 ? snBalanceD.toFixed(2) : "") + "</td>";
            body += "</tr>";
        }

        // BARIS SUMMARY D (Kuning)
        var avgSnD = countSnD > 0 ? (sumSnD / countSnD).toFixed(2) : 0;
        body += "<tr style='background-color:#ffff00; font-weight:bold;'>";
        body += "<td style='border:1px solid black; align:center; color:red;'>D</td>";
        body += "<td style='border:1px solid black; border-right:none;'></td>";
        body += "<td style='border:1px solid black; border-left:none;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + sumQtyD.toFixed(2) + "</td>";
        body += "<td style='border:1px solid black;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + avgSnD + "%</td>";
        body += "<td style='border:1px solid black;'></td>";
        body += "<td style='border:1px solid black; align:right;'>" + sumSnBalanceD.toFixed(2) + "</td>";
        body += "</tr>";

        body += "</tbody>";
        body += "</table>";

        footer += "<table class='tg' style='table-layout: fixed;'>";
        footer += "<tbody>";
        footer += "<tr style=''>";
        footer += "<td style='width:70%'></td>"
        footer += "<td style='width:30%'>Mengetahui Oleh</td>"
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