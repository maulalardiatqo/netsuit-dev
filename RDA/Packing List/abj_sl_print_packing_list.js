    /**
     * @NApiVersion 2.1
     * @NScriptType Suitelet
     */
    define(['N/format', 'N/log', 'N/record', 'N/search', "N/file", 'N/runtime', './dateUtils' ],
        /**
     * @param{format} format
     * @param{log} log
     * @param{record} record
     * @param{search} search
     * @param{file} file
     * @param{runtime} runtime
     */
        (format, log, record, search, file, runtime, dateUtils) => {


            // function escapeXmlSymbols(input) {
            //     if (!input || typeof input !== "string") {
            //         return input;
            //     }
            //     return input.replace(/&/g, "&amp;")
            //                 .replace(/</g, "&lt;")
            //                 .replace(/>/g, "&gt;")
            //                 .replace(/"/g, "&quot;")
            //                 .replace(/'/g, "&apos;");
            // }

            function getHeader(data,type){
                let header = `<table width="100%"  style="table-layout:fixed;">
                    <tbody>
                        <tr>
                            <td ></td>
                            <td ></td>
                            <td style="width:10%;"></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colspan="2" style="">
                                <span style="font-weight:bold;font-size:12px;">${data.companyName}</span>
                                <br/>
                                <span style="font-size:10px;white-space:nowrap;">${data.companyAddress}</span>            
                            </td>
                            <td style="text-align:center;align:center;width:10%;">
                            </td>
                            <td colspan="2">
                                <span style="font-weight:bold;font-size:16px;">PACKING LIST (${type.toUpperCase()})</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <table width="100%" style="table-layout:fixed;">
                                <tbody>
                                        <tr>
                                            <td style='width:70px;'>Armada</td>
                                            <td>: ${data.armada}</td>
                                        </tr>
                                        <tr>
                                            <td>Kendaraan</td>
                                            <td>: ${data.kendaraan}</td>
                                        </tr>
                                        <tr>
                                            <td>Supir</td>
                                            <td>: ${data.supir}</td>
                                        </tr>
                                        <tr>
                                            <td>Helper</td>
                                            <td>: ${data.helper}</td>
                                        </tr>
                                        <tr>
                                            <td>Area</td>
                                            <td>: ${data.area}</td>
                                        </tr>
                                        
                                </tbody>                         
                                </table>
                            </td>
                            <td></td>
                            <td colspan="2">
                                <table width="100%" style="table-layout:fixed;">
                                    <tbody>
                                        <tr>
                                            <td style='width:70px;'>Nomor</td>
                                            <td>: ${data.nomor}</td>
                                        </tr>
                                        <tr>
                                            <td>Tanggal</td>
                                            <td>: ${data.tanggal}</td>
                                        </tr>
                                        <tr>
                                            <td>Gudang</td>
                                            <td style="white-space:nowrap;">:${data.gudang}</td>
                                        </tr>
                                        <tr>
                                            <td>Halaman</td>
                                            <td>: ${data.halaman}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>  
                        </tr>
                        <tr>
                            <td colspan="5" >
                                <table width="100%" style="table-layout:fixed;">
                                    <tbody>
                                        <tr>
                                            <td style='width:70px;'>Subarea</td>
                                            <td>: ${data.subarea?.join(',')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="5" >
                                <table width="100%" style="table-layout:fixed;">
                                    <tbody>
                                        <tr>
                                            <td style='width:70px;'>Salesman</td>
                                            <td>: ${data.salesman?.join(',')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        ${
                            type == 'barang' && (
                                `   
                                    <tr>
                                        <td colspan="5" >
                                            <table width="100%" style="table-layout:fixed;">
                                                <tbody>
                                                    <tr>
                                                        <td style='width:70px;'>#Faktur</td>
                                                        <td style='text-align:left; font-size:12px;'><p style='text-align:left'>: ${data.faktur?.join(',')}</p></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                `
                            )
                        }
                        
                    </tbody>
                </table>
                `;

                return header;
            }

            function searchTransactions(ids){
                log.debug('IDS PARAM', ids)
                let searchTrx = search.create({
                    type : 'transaction',
                    filters : [
                        ['type', 'anyof', 'CustInvc', 'ItemShip'],
                        'AND',
                        ['internalid', 'anyof', ids],
                        'AND',
                        ['mainline', 'anyof','F'],
                    ],
                    columns : [
                    search.createColumn({name : 'tranid'}),
                    search.createColumn({name : 'quantity'}),
                    search.createColumn({name:'createdfrom'}),
                    search.createColumn({name:'entity'}),
                    search.createColumn({ join:'createdfrom',name: 'salesrep' }),
                    
                    search.createColumn({ name: 'total', join: 'appliedtotransaction' }),
                    search.createColumn({ name: 'line', join: 'appliedtotransaction' }),
                    search.createColumn({
                            join: 'item',
                            name : 'displayname'
                        }),
                        search.createColumn({
                            join: 'item',
                            name : 'itemid'
                        }),
                        search.createColumn({ name: 'rate' }),
                        search.createColumn({ name: 'custcol_rda_total_afterdisc' }),
                        search.createColumn({ name: 'custcol_rda_quantity_1' }),
                        search.createColumn({ name: 'custcol_rda_quantity_2' }),
                        search.createColumn({ name: 'custcol_rda_quantity_3' }),
                        search.createColumn({ name: 'expirationdate', join: 'inventorydetail' }),
                        search.createColumn({ name: 'cseg_rda_sales_type'}),
                        search.createColumn({ name: 'line' }),
                        search.createColumn({ name: 'custcol_rda_conversion_number_largest' }),
                        search.createColumn({ name: 'custbody_rda_sub_area' }),
                        search.createColumn({ join:'createdfrom',name: 'custcol_rda_volume_barang' }),
                    ]
                })
                log.debug('Search', searchTrx)

                return searchTrx.run().getRange({start : 0, end :1000})
            }

            function searchVolumeBarangFromSO(soIds){
                let searchTrx = search.create({
                    type: 'salesorder',
                    filters : [
                        ['type', 'anyof', 'SalesOrd'],
                        'AND',
                        ['mainline', 'is', 'F'],
                        'AND',
                        ['internalid', 'anyof', soIds],
                    ],
                    columns : [
                        search.createColumn({ name: 'custcol_rda_volume_barang' }),
                        search.createColumn({ name: 'internalid' }),
                    ]
                })
                let volumeBarang = 0;
                searchTrx.run().each(function(result){
                    let vol = result.getValue({name : 'custcol_rda_volume_barang'});
                    
                    if (!isNaN(vol) && vol !== null && vol !== '') {
                        volumeBarang += Number(vol);
                    }
                    return true;
                    // volumeBarang = Number(volumeBarang) + Number(vol);
                })
                return volumeBarang;
            }

            /**
             * Defines the Suitelet script trigger point.
             * @param {Object} context
             * @param {ServerRequest} context.request - Incoming request
             * @param {ServerResponse} context.response - Suitelet response
             * @since 2015.2
             */
            const onRequest = (context) => {
                var response = context.response;
                var xml = "";
                var headerNota = "";
                var bodyNota = "";
                var headerBarang = "";
                var bodyBarang = "";
                var headerHeight = '20%';
                var style = "";
                var footer = "";
                var pdfFile = null;

                var logoUrl = '';
                var fileLogo = file.load({
                    id: 298
                })
                // log.debug('log url', fileLogo.url)
                logoUrl = fileLogo.url.replace(/&/g, "&amp;");

                var recid = context.request.parameters.id;

                let rec = record.load({
                    type : "customtransaction_rda_packing_list",
                    id : recid
                })

                let fulfillIDs = rec.getValue({fieldId : 'custbody_rda_packlist_do_number'});
                log.debug('FULFILL IDS',fulfillIDs)

                let itemFulfillTrx = searchTransactions(fulfillIDs)
                log.debug('trx', itemFulfillTrx)
                
                let subsidiaryId = rec.getValue({fieldId : 'subsidiary'})
                log.debug('SUbsidiaryID',subsidiaryId);
                let subsidiaryRec = record.load({
                    type : "subsidiary",
                    id : subsidiaryId
                })

                let dataHeader = {
                    companyName : "PT. REJEKI DAMAI ABADI",
                    companyAddress : subsidiaryRec.getValue({fieldId : 'name'}),
                    armada : rec.getValue({fieldId : 'custbody_rda_packlist_tipe_kendaraan'}),
                    kendaraan : rec.getText({fieldId : 'custbody_rda_packlist_nopol'}),
                    supir : rec.getValue({fieldId : 'custbody_rda_packlist_supir'}),
                    helper : rec.getValue({fieldId : 'custbody_rda_packlist_rit'}),
                    // rit : rec.getValue({fieldId : 'custbody_rda_packlist_supir'}),
                    rit : '?',
                    area : rec.getText({fieldId : 'custbody_rda_area'}),
                    subarea : [],
                    salesman : [],
                    nomor : rec.getValue({fieldId : 'tranid'}),
                    tanggal : rec.getText({fieldId : 'trandate'}),
                    gudang : subsidiaryRec.getText({fieldId : 'custrecord_rda_location_intransit_out'}).split(':').pop(),
                    nota : "?",
                    halaman : "<pagenumber/>",
                    type : 'nota'
                }


                style += "<style type='text/css'>";
                style += "*{margin:0;padding:0;}";

                style += "</style>";
                

                

                dataHeader.faktur = []
                

                let itemCount = itemFulfillTrx.length;
                log.debug('COUNT', itemCount);
                let itemRows = "";
                let itemRowsBarang = "";
                let tranIdPrinted = [];
                let noBin = 0;
                let totalPengiriman = 0;
                let totalJumlahBarang = 0;
                let totalKartonUtuh = 0;
                let totalrenteng = 0;
                let totalEceran = 0;
                
                
                let result = [];
                let uniqueItems = [];
                let soIDS = [];
                for (let i = 0; i < itemCount; i++) {
                    let noInvoice = itemFulfillTrx[i].getValue({name : 'tranid'})
                    let kodeBarang = itemFulfillTrx[i].getValue({ join : 'item', name : 'itemid'});
                    let line = itemFulfillTrx[i].getValue({name : 'line'});
                    let jumlahBarang = itemFulfillTrx[i].getValue({name : 'quantity'}) // base qty
                    let kartonUtuh = itemFulfillTrx[i].getValue({name : 'custcol_rda_quantity_1'}) || 0 // qty 1 (karton)
                    let rentenOrLusin = itemFulfillTrx[i].getValue({name : 'custcol_rda_quantity_2'}) || 0 // qty 2 (renteng)
                    let eceran = itemFulfillTrx[i].getValue({name : 'custcol_rda_quantity_3'}) || 0 // qty 3 (eceran)
                    let rate = itemFulfillTrx[i].getValue({ name : 'rate'});
                    let soID = itemFulfillTrx[i].getValue({ name : 'createdfrom'});
                    // log.debug('Quantity 1'+ i, kartonUtuh)
                    let indexSO = soIDS.findIndex(result => result === soID)
                    if(indexSO == -1){
                        soIDS.push(soID)
                    }
                    // log.debug('Jumlah Barang', jumlahBarang);
                    // if(jumlahBarang < 0 || !rate) continue; // dikomen 14 januari 2025
                    let item = {
                        kodeBarang : kodeBarang,
                        line : line,
                        jumlahBarang,
                        kartonUtuh,
                        rentenOrLusin,
                        eceran
                    };
                    let findItem = uniqueItems.find(it => it.kodeBarang == item.kodeBarang);
                    if(!findItem){
                        uniqueItems.push(item)
                    }else{
                        findItem.kartonUtuh = Number(findItem.kartonUtuh) + Number(item.kartonUtuh)
                        findItem.rentenOrLusin = Number(findItem.rentenOrLusin) + Number(item.rentenOrLusin)
                        findItem.eceran = Number(findItem.eceran) + Number(item.eceran)
                    }

                    let checkIfExist = result.findIndex(tran => tran.invoice == noInvoice);
                    // log.debug('Check if exist',checkIfExist)
                    if(checkIfExist !== -1){
                        let indexItems = result[checkIfExist].items.findIndex(itm => itm.line == line);
                        result[checkIfExist].karton = Number(result[checkIfExist].karton) + Number(kartonUtuh)
                        // log.debug('ADA HARUSNYA DITAMBAH',Number(result[checkIfExist].karton) + Number(kartonUtuh))
                        if(indexItems == -1){
                            result[checkIfExist].items.push(item)
                        }
                    }else{
                        // log.debug('GA ADA JADI DIPUSH', kartonUtuh)
                        result.push({
                            invoice : noInvoice,
                            karton : kartonUtuh,
                            items : [item]
                        })
                    }
                }

                log.debug('SO IDS', soIDS)
                log.debug('RESULT', result.map(res => res.invoice).join(','))
                
                let totalVolumeBarang = searchVolumeBarangFromSO(soIDS).toFixed(2);

                log.debug('unique items', uniqueItems);

                // log.debug('RES',result);
                // const date = new Date();

                // const offset = 7 * 60 * 60 * 1000; // Jakarta is UTC+7
                // const jakartaDate = new Date(date.getTime() + offset);

                // // Get the day name
                // const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Indonesian short day names
                // const dayName = days[jakartaDate.getUTCDay()]; // Use getUTCDay()

                // // Format the date in YYYY/MM/DD format
                // const year = jakartaDate.getUTCFullYear();
                // const month = ('0' + (jakartaDate.getUTCMonth() + 1)).slice(-2); // Months are 0-indexed
                // const day = ('0' + jakartaDate.getUTCDate()).slice(-2);
                // const formattedDate = `${year}/${month}/${day}`;

                // // Format the time in HH:mm format (24-hour clock)
                // const hours = ('0' + jakartaDate.getUTCHours()).slice(-2);
                // const minutes = ('0' + jakartaDate.getUTCMinutes()).slice(-2);
                // const formattedTime = `${hours}:${minutes}`;
                
                // // Combine the formatted date and time
                // const resultDate = `${dayName}, ${formattedDate} ${formattedTime}`;
                const resultDate = dateUtils.formatDateToJakarta();

                var currentUser = runtime.getCurrentUser();

            // Access user details
                var userId = currentUser.id;
                var userName = currentUser.name;
                var userRole = currentUser.role;
                var userEmail = currentUser.email;

                let autoHeight=72;
                let autoHeightNota=100;

                // // Loop through each line item in the purchase order
                log.debug('itemCount', itemCount)
                var cekLine = 0
                var page = 1;
                for (let i = 0; i < itemCount; i++) {
                    let noInvoice = itemFulfillTrx[i].getValue({name : 'tranid'})
                    let convertionLargestNumber = itemFulfillTrx[i].getValue({name : 'custcol_rda_conversion_number_largest'}) || 1;
                    
                    // NOTE :
                    // customerSalesman == Sales Rep != customer & salesman
                    // cust => customer
                    let customerSalesman = itemFulfillTrx[i].getText({join:'createdfrom' ,name : 'salesrep'});
                    const salesRepId = itemFulfillTrx[i].getValue({ name: 'salesrep', join: 'createdfrom' });
                    if (salesRepId) {
                        // Use search.lookupFields to get Sales Rep details
                        const salesRepDetails = search.lookupFields({
                            type: search.Type.EMPLOYEE,
                            id: salesRepId,
                            columns: ['firstname','lastname', 'entityid','custrecord_rda_mapsales_employee_id.name']
                        });
                        // log.debug('Sales Rep Details', salesRepDetails);
                        // customerSalesman = `${salesRepDetails.firstname} ${salesRepDetails.lastname} - ${salesRepDetails.custrecord_rda_mapsales_employee_id.name}`
                        customerSalesman = `${salesRepDetails.firstname} ${salesRepDetails.lastname}`
                    }

                    
                    let cust = itemFulfillTrx[i].getText({name : 'entity'});
                    
                    let subArea = itemFulfillTrx[i].getText({ name : 'custbody_rda_sub_area'});
                    
                    if(dataHeader.salesman.indexOf(customerSalesman) == -1){
                        dataHeader.salesman.push(customerSalesman);
                    }
                    if(dataHeader.subarea.indexOf(subArea) == -1){
                        dataHeader.subarea.push(subArea);
                    }
                    // let kartonQty = result.find(res => res.invoice == noInvoice).karton / Number(convertionLargestNumber);

                    let line = itemFulfillTrx[i].getValue({join : 'appliedtotransaction',name : 'line'});
                    
                    let nilai = itemFulfillTrx[i].getValue({join:'appliedtotransaction' ,name : 'total'}) || 0;
                    let salesType = itemFulfillTrx[i].getText({ name : 'cseg_rda_sales_type'});
                    let potongReturn = ""
                    let bayarTunai = ""
                    let bayarGiro = ""
                    let noGiroOrBank = ""

                    let checkIfExist = tranIdPrinted.find(tran => tran == noInvoice);
                    if(!checkIfExist){
                        cekLine = cekLine + 1;
                        if (cekLine % 11 === 0) { 
                            itemRows += `<tr style='height:30%'><td colspan="8"></td></tr>`;
                        }
                        if (cekLine > 11) { 
                            let excessLines = cekLine - 11;
                            autoHeightNota = Number(autoHeightNota) - (4 * Math.ceil(excessLines / 11));
                            log.debug('excessLines', excessLines)
                            
                        }
                        
                        if (autoHeightNota <= 0) {
                            autoHeightNota = 100;
                        }
                        if (salesRepId) {
                            // Use search.lookupFields to get Sales Rep details
                            const salesRepDetails = search.lookupFields({
                                type: search.Type.EMPLOYEE,
                                id: salesRepId,
                                columns: ['firstname','lastname', 'entityid','custrecord_rda_mapsales_employee_id.name']
                            });
                            // log.debug('Sales Rep Details', salesRepDetails);
                            // customerSalesman = `${salesRepDetails.firstname} ${salesRepDetails.lastname} - ${salesRepDetails.custrecord_rda_mapsales_employee_id.name}`
                            customerSalesman = `${salesRepDetails.firstname} ${salesRepDetails.lastname} - ${salesRepDetails["custrecord_rda_mapsales_employee_id.name"]}`
                        }
                        dataHeader.faktur.push(noInvoice)
                        totalPengiriman = Number(totalPengiriman) + Number(nilai)
                        let kartonQty = result.find(res => res.invoice == noInvoice).karton;
                        
                        itemRows += `
                            <tr height="4%">
                                <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;white-space:nowrap;font-stretch: condensed;">${noInvoice}</td>
                                <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:left;white-space:break-spaces;">
                                        <p>
                                            <span style="white-space:nowrap;font-stretch: condensed;">${cust}</span>
                                            <br/>
                                            <span  style="white-space:nowrap;font-stretch: condensed;">${customerSalesman}</span>
                                        </p>
                                </td>
                                <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:center;"><p>${kartonQty}</p></td>
                                <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:right;">${format.format({ value : nilai, type : format.Type.CURRENCY})}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:right;">${potongReturn}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:right;">${bayarTunai}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:right;">${bayarGiro}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:right;border-right:0;">${noGiroOrBank}</td>
                            </tr>
                        `;
                        tranIdPrinted.push(noInvoice)
                    }
                    
                    let kodeBarang = itemFulfillTrx[i].getValue({ join : 'item', name : 'itemid'})
                    let namaBarang = itemFulfillTrx[i].getValue({ join : 'item', name : 'displayname'})
                    let batchExpired = itemFulfillTrx[i].getValue({ join : 'inventorydetail', name : 'expirationdate'}) || '-'
                    let jumlahBarang = itemFulfillTrx[i].getValue({name : 'quantity'})
                    let kartonUtuh = itemFulfillTrx[i].getValue({name : 'custcol_rda_quantity_1'}) || 0
                    let rentenOrLusin = itemFulfillTrx[i].getValue({name : 'custcol_rda_quantity_2'}) || 0
                    let eceran = itemFulfillTrx[i].getValue({name : 'custcol_rda_quantity_3'}) || 0
                    let check1 =''
                    let check2 = ''
                    let barangKembali = ''
                    let totalAfterDiscount = itemFulfillTrx[i].getValue({ name : 'custcol_rda_total_afterdisc'});
                    let rate = itemFulfillTrx[i].getValue({ name : 'rate'});
                    // if(`${kartonUtuh}.${rentenOrLusin}.${eceran}` === '0.0.0'){
                        //     jumlahBarangConcat = jumlahBarang;
                        //     eceran = jumlahBarang
                        // }
                        
                        
                    let findItem = uniqueItems.find(ui => ui.kodeBarang == kodeBarang && !ui.printed);
                    if(line && findItem){
                        let jumlahBarangConcat = `${findItem.kartonUtuh}.${findItem.rentenOrLusin}.${findItem.eceran}`;
                        autoHeight = Number(autoHeight) - 3;
                        if(autoHeight <= 0){
                            autoHeight=72;
                        }

                        totalJumlahBarang = Number(totalJumlahBarang) + Number(jumlahBarang)
                        totalKartonUtuh = Number(totalKartonUtuh) + Number(findItem.kartonUtuh)
                        totalrenteng = Number(totalrenteng) + Number(findItem.rentenOrLusin)
                        totalEceran = Number(totalEceran) + Number(findItem.eceran)
                        noBin ++;
                        itemRowsBarang += `
                            <tr style="height:3%;">
                                <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:center;">${noBin}</td>
                                <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:left;">${kodeBarang}</td>
                                <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:left;">${namaBarang}</td>
                                <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:center;">${batchExpired}</td>
                                <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:right;">${jumlahBarangConcat}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:right;">${findItem.kartonUtuh}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:right;">${findItem.rentenOrLusin}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:right;">${findItem.eceran}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:center;">${check1}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:center;">${check2}</td>
                                <td style="border: 1px solid black;border-top:0;border-right:0;align:center;">${barangKembali}</td>
                            </tr>
                        `;
                        findItem.printed = true;
                    }
                }
                log.debug('cekLine', cekLine)
                headerNota = getHeader(dataHeader,'nota')

                log.debug('HEIGHT NOTA',autoHeightNota)
                // autoHeightNota = 0;
                
                bodyNota = `  <table width="100%" style="border-collapse: collapse;table-layout:auto;">
                    <thead>
                        <tr>
                            <td style="border: 1px solid black;border-left:0;border-right:0;align:left;width:15%;">No Invoice/<br/>PFI Tanggal</td>
                            <td style="border: 1px solid black;border-left:0;border-right:0;align:left;">Customer <br/>Salesman</td>
                            <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">#Karton</td>
                            <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">Nilai</td>
                            <td style="border: 1px solid black;border-right:0;align:left;">Potong <br/>Retur</td>
                            <td style="border: 1px solid black;border-right:0;align:left;">Bayar <br/>Tunai</td>
                            <td style="border: 1px solid black;border-right:0;align:left;">Bayar <br/>Giro</td>
                            <td style="border: 1px solid black;border-right:0;align:left;border-right:0;">No Giro/Bank</td>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                        <tr style="" height="${autoHeightNota - 62 <=0 ? 30 : (autoHeightNota - 62) }%">
                            <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:center;border-right:0;"></td>
                        </tr>
                        <tr height="2%">
                            <td colspan="4" style="border-bottom:1px solid black;padding:0;">
                                <table width="100%" height="100%" style="border-collapse: collapse;table-layout:fixed;height:100%;">
                                    <tbody>
                                        <tr>
                                            <td style="align:left;width:50%;border:0;border-right:1px solid black;">
                                                Berangkat <br/>
                                                Jam..........Km..........
                                            </td>
                                            <td style="align:left;width:50%;">
                                                Kembali <br/>
                                                Jam..........Km..........
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:center;"></td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:center;border-right:0;"></td>
                        </tr>
                        <tr height="2%">
                            <td style="border: 1px solid black;border-top:0;border-left:0;border-right:0;align:left;" colspan="4">
                                <span style="font-weight:bold;">PENYERAHAN TUGAS</span>
                            </td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;white-space:nowrap;" colspan="3">TOTAL PENGIRIMAN</td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;border-right:0;">${format.format({ value : Math.ceil(Number(totalPengiriman)), type : format.Type.CURRENCY})}</td>
                        </tr>
                        <tr height="2%">
                            <td style="border: 1px solid black;border-top:0;border-right:0;border-left:0;align:left;border-bottom:0;" colspan="4" rowspan="3">
                                
                            </td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;" colspan="3">KREDIT</td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;border-right:0;"></td>
                        </tr>
                        <tr height="2%">
                            
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;" colspan="3">GIRO</td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;border-right:0;"></td>
                        </tr>
                        <tr height="2%">

                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;" colspan="3">RETUR</td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;"></td>
                        </tr>
                        <tr height="2%">
                            <td style="border: 1px solid black;border-top:0;border-right:0;border-left:0;border-top:0;align:left;" colspan="4">
                                <table style="table-layout:fixed;width:100%;">
                                    <tr>
                                        <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                            Admin
                                        </td>
                                        <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                            Supir
                                        </td>
                                        <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                            Gudang
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;" colspan="3">LAIN-LAIN</td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;"></td>
                        </tr>
                        <tr height="2%">
                            <td style="border: 1px solid black;border-top:0;border-right:0;border-left:0;border-bottom:0;align:left;" colspan="4">
                                <span style="font-weight:bold;">PENYELESAIAN TUGAS</span>
                            </td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;" colspan="3">TUNAI</td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;border-right:0;"></td>
                        </tr>
                        <tr height="2%">
                            <td style="border: 1px solid black;border-top:0;border-right:0;border-left:0;align:left;border-bottom:0;" colspan="4" rowspan="3">
                                
                            </td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;" colspan="3">- Biaya</td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;border-right:0;"></td>
                        </tr>
                        <tr height="2%">
                            
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;" colspan="3">- Biaya</td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;border-right:0;"></td>
                        </tr>
                        <tr height="2%">

                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;" colspan="3"><p style="visibility: hidden">- Biaya</p></td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;border-right:0;"></td>
                        </tr>
                        <tr height="2%">
                            <td style="border:none;border-bottom:1px solid black;border-top:0;border-right:0;" colspan="4">
                                <table style="table-layout:fixed;width:100%;">
                                    <tr>
                                        <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                            Supir
                                        </td>
                                        <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                            Kasir
                                        </td>
                                        <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                            Admin
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:left;" colspan="3"><span style="font-weight:bold;">TOTAL SETORAN</span></td>
                            <td style="border: 1px solid black;border-top:0;border-right:0;align:right;border-right:0;"></td>
                        </tr>
                        <tr height="2%">
                            <td style="border:0;font-size:10px;align:right;" colspan="8">${resultDate} - ${userName}</td>
                        </tr>
                    </tbody>
                </table>
                <br/>
                `;

                headerBarang = getHeader(dataHeader,'barang')

                bodyBarang = `
                <div height="9cm">
                    <div >
                        <table width="100%" style="border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">No. <br/>Bin</td>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">Kode <br/>Barang</td>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:left;">Nama Barang <br/>Kemasan</td>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">Batch# <br/>Expired</td>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">Jumlah <br/>Barang</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;">Karton <br/>Utuh</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;">Renteng/ <br/>Lusin</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;">Eceran</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;" colspan="2">Check</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;">Barang <br/>Kembali</td>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemRowsBarang}
                                <tr>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:left;">
                                        <span style="font-weight:bold;">TOTAL</span>
                                    </td>
                                    <td style="border-right:0;align:center;"></td>
                                    <td style="border-right:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;">${totalKartonUtuh}</td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;">${totalrenteng}</td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;">${totalEceran}</td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                </tr>
                                <tr>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:left;visibility:hidden;">
                                        <span style="font-weight:bold;">TOTAL KARTON</span>
                                    </td>
                                    <td style="border-right:0;align:center;"></td>
                                    <td style="border-right:0;align:right;visibility:hidden;"><span style="font-weight:bold;">${totalKartonUtuh}</span></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                </tr>
                                <tr>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:left;">
                                        <span style="font-weight:bold;">TOTAL KARTON</span>
                                    </td>
                                    <td style="border-right:0;align:center;"></td>
                                    <td style="border-right:0;align:right;"><span style="font-weight:bold;">${totalKartonUtuh}</span></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                </tr>
                                <tr>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:left;">
                                        <span style="font-weight:bold;">TOTAL RENTENG/LUSIN</span>
                                    </td>
                                    <td style="border-right:0;align:center;"></td>
                                    <td style="border-right:0;align:right;"><span style="font-weight:bold;">${totalrenteng}</span></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                </tr>
                                <tr>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:left;">
                                        <span style="font-weight:bold;">TOTAL ECERAN</span>
                                    </td>
                                    <td style="border-right:0;align:center;"></td>
                                    <td style="border-right:0;align:right;"><span style="font-weight:bold;">${totalEceran}</span></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                </tr>
                                <tr>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:left;">
                                        <span style="font-weight:bold;">TOTAL VOLUME BARANG(m3)</span>
                                    </td>
                                    <td style="border-right:0;align:center;"></td>
                                    <td style="border-right:0;align:right;"><span style="font-weight:bold;">${totalVolumeBarang}</span></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div style="" vertical-align="bottom">
                        <table width="100%" style="border-collapse: collapse;">
                            <tbody>
                                <tr>
                                    <td style="border: 1px solid black;border-right:0;border-left:0;font-weight:bold;">
                                        PENYERAHAN TUGAS
                                    </td>
                                    <td style="border: 1px solid black;border-right:0;font-weight:bold;">
                                        PENYELESAIAN TUGAS
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height:100px;border-right:0;">
                                        Tandatangan & Nama Jelas
                                    </td>
                                    <td style="border-left:1px solid black;">
                                        Tandatangan & Nama Jelas
                                    </td>
                                </tr>
                                <tr>
                                    <td style="border-right: 0;border-bottom:1px solid black;">
                                        <table style="table-layout:fixed;width:100%;">
                                            <tr>
                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                    Admin
                                                </td>
                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                    Supir
                                                </td>
                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                    Gudang
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="border-bottom:1px solid black;border-left:1px solid black;">
                                    <table style="table-layout:fixed;width:100%;">
                                            <tr>
                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                    Supir
                                                </td>
                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                    Gudang
                                                </td>
                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                    Admin
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="border:0;font-size:10px;align:right;" colspan="2">${resultDate} - ${userName}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                `;
                log.debug('HEIGHT BARANG', autoHeight);
                // log.debug('HEIGHT BARANG', `${Number(autoHeight) - Number(55) > 0 ? Number(autoHeight) - Number(55) : 40}%`);
                let bodyBarang2 = `
                    <table width="100%" style="border-collapse: collapse;table-layout:auto;min-height:18cm;" height="18cm">
                            <thead>
                                <tr>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">No. <br/>Bin</td>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">Kode <br/>Barang</td>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:left;">Nama Barang <br/>Kemasan</td>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">Batch# <br/>Expired</td>
                                    <td style="border: 1px solid black;border-left:0;border-right:0;align:center;">Jumlah <br/>Barang</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;">Karton <br/>Utuh</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;">Renteng/ <br/>Lusin</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;">Eceran</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;" colspan="2">Check</td>
                                    <td style="border: 1px solid black;border-right:0;align:center;">Barang <br/>Kembali</td>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemRowsBarang}
                                <tr style="height:${autoHeight - 26 <= 30 ? 40 : autoHeight - 26 }%;">
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:center;"></td>
                                    <td style="border:0;align:left;" valign="top">
                                        <span style="font-weight:bold;">TOTAL</span><br/>
                                        <span style="font-weight:bold;">TOTAL KARTON</span><br/>
                                        <span style="font-weight:bold;">TOTAL RENTENG/LUSIN</span><br/>
                                        <span style="font-weight:bold;">TOTAL ECERAN</span><br/>
                                        <span style="font-weight:bold;">TOTAL VOLUME BARANG(m3)</span>
                                    </td>
                                    <td style="border-right:0;align:center;"></td>
                                    <td style="border-right:0;align:right;" valign="top">
                                        <span style="font-weight:bold;"></span><br/>
                                        <span style="font-weight:bold;">${totalKartonUtuh}</span><br/>
                                        <span style="font-weight:bold;">${totalrenteng}</span><br/>
                                        <span style="font-weight:bold;">${totalEceran}</span><br/>
                                        <span style="font-weight:bold;">${totalVolumeBarang}</span>
                                    </td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;">${totalKartonUtuh}</td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;">${totalrenteng}</td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:right;">${totalEceran}</td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                    <td style="border: 1px solid black;border-right:0;border-top:0;border-bottom:0;align:center;"></td>
                                </tr>
                                <tr style="height:20%" height="20%">
                                    <td colspan="11">

                                        <table width="100%" style="border-collapse: collapse;">
                                            <tbody>
                                                <tr>
                                                    <td style="border: 1px solid black;border-right:0;border-left:0;font-weight:bold;">
                                                        PENYERAHAN TUGAS
                                                    </td>
                                                    <td style="border: 1px solid black;border-right:0;font-weight:bold;">
                                                        PENYELESAIAN TUGAS
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="height:100px;border-right:0;">
                                                        Tandatangan & Nama Jelas
                                                    </td>
                                                    <td style="border-left:1px solid black;">
                                                        Tandatangan & Nama Jelas
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="border-right: 0;border-bottom:1px solid black;">
                                                        <table style="table-layout:fixed;width:100%;">
                                                            <tr>
                                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                                    Admin
                                                                </td>
                                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                                    Supir
                                                                </td>
                                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                                    Gudang
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                    <td style="border-bottom:1px solid black;border-left:1px solid black;">
                                                        <table style="table-layout:fixed;width:100%;">
                                                            <tr>
                                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                                    Supir
                                                                </td>
                                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                                    Gudang
                                                                </td>
                                                                <td style="border-top:1px dotted black; margin-left:10px;margin-rigth:10px;">
                                                                    Admin
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="border:0;font-size:10px;align:right;" colspan="2">${resultDate} - ${userName}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                    </table>
                `;

                // let test = context.request.parameters.test;
                // if(test){
                    bodyBarang = bodyBarang2
                // }

                

                var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                xml += "<pdf>";
                xml += "<head>";
                xml += style;
                xml += "<macrolist>";
                xml += "<macro id=\"nlheader\">";
                xml += headerNota;
                xml += "</macro>";
                xml += "<macro id=\"nlfooter\">";
                xml += footer;
                xml += "</macro>";
                xml += "</macrolist>";
                xml += "</head>"
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;padding:8px;' header='nlheader' header-height='6cm'>";
                xml += bodyNota;
                xml += "\n</body>";

                xml += "<head>";
                xml += style;
                xml += "<macrolist>";
                xml += "<macro id=\"nlheaderBarang\">";
                xml += headerBarang;
                xml += "</macro>";
                xml += "<macro id=\"nlfooter\">";
                xml += footer;
                xml += "</macro>";
                xml += "</macrolist>";
                xml += "</head>"
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;padding:8px;' header='nlheaderBarang' header-height='8cm' footer='nlfooter' footer-height='0'>";
                xml += bodyBarang;
                xml += "\n</body>\n</pdf>";

                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });


            }

            return {onRequest}

        });
