/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/format', 'N/log', 'N/record', 'N/search', "N/file","./dateUtils",'N/render',],
    /**
 * @param{format} format
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{file} file
 */
    (format, log, record, search, file,dateUtils,render) => {
        

        function terbilangRupiah(angka) {
            // log.debug("angka",angka)
            const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"];
            const belasan = ["Sepuluh", "Sebelas", "Dua Belas", "Tiga Belas", "Empat Belas", "Lima Belas", "Enam Belas", "Tujuh Belas", "Delapan Belas", "Sembilan Belas"];
            const puluhan = ["", "", "Dua Puluh", "Tiga Puluh", "Empat Puluh", "Lima Puluh", "Enam Puluh", "Tujuh Puluh", "Delapan Puluh", "Sembilan Puluh"];
            const ribuan = ["", "Ribu", "Juta", "Miliar", "Triliun"];
        
            function terbilangRatusan(n) {
                let output = "";
                if (n >= 100) {
                    let ratusanTerbilang = satuan[Math.floor(n / 100)] + " Ratus ";
                    // log.debug('RATUSAN TERBILANG', ratusanTerbilang);
                    if(ratusanTerbilang.toLocaleLowerCase().includes('satu ratus')){
                        ratusanTerbilang = 'Seratus '
                    }
                    // log.debug('RATUSAN TERBILANG 2', ratusanTerbilang);
                    output += ratusanTerbilang;
                    n = n % 100;
                }
                if (n >= 20) {
                    output += puluhan[Math.floor(n / 10)] + " ";
                    n = n % 10;
                } else if (n >= 10) {
                    output += belasan[n - 10] + " ";
                    n = 0;
                }
                if (n > 0) {
                    output += satuan[n] + " ";
                }
                return output.trim();
            }
        
            function terbilangUtuh(n) {
                let output = "";
                let i = 0;
                while (n > 0) {
                    const ratusan = n % 1000;
                    if (ratusan > 0) {
                        output = terbilangRatusan(ratusan) + " " + ribuan[i] + " " + output;
                    }
                    n = Math.floor(n / 1000);
                    i++;
                }
                return output.trim();
            }
        
            // Pisahkan angka utuh dan desimal
            const [angkaUtuh, angkaDesimal] = angka.toString().split(".");
        
            let hasil = terbilangUtuh(parseInt(angkaUtuh)) + " Rupiah";
            // log.debug("Angka Decimal", angkaDesimal)
            if (angkaDesimal && parseInt(angkaDesimal) > 0) {
                hasil += " "+ terbilangUtuh(parseInt(angkaDesimal))+ " Sen";
                // for (let i = 0; i < angkaDesimal.length; i++) {
                //     hasil += " " + satuan[parseInt(angkaDesimal[i])];
                // }
            }
        
            return hasil.trim();
        }
        
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

        function findTaxRate(soID,itemID){
            log.debug('SO ID', soID)
            log.debug('itemID', itemID)
            try {
                var searchRec = search.create({
                    type: 'transaction',
                    filters: [
                        ['type', 'anyof', 'SalesOrd'],
                        'AND',
                        ['internalid', 'anyof', soID],
                        'AND',
                        ['item', 'anyof', itemID],
                        'AND',
                        ['mainline', 'is','F'],
                    ],
                    columns :[
                        search.createColumn({ name : 'item'}),
                        search.createColumn({ name: 'rate', join: 'taxitem' }),
                    ]
                });
                let taxRate;
                searchRec.run().each(item =>{
                    let itemId = item.getValue({ name : 'item'});
                    let taxRateItem = item.getValue({ join : 'taxitem', name : 'rate'});
                    if(itemID == itemId){
                        taxRate = taxRateItem;
                    }
                    return true;
                });
                return taxRate;
            } catch (error) {
                log.debug('Error Search tax rate', error)
            }
        }

        const invoiceAndFulfillmentSearch = (type,recid, mainLine) => {
            var searchRec = search.create({
                type: 'transaction',
                filters: [
                    ['type', 'anyof', 'CustInvc', 'ItemShip'],
                    'AND',
                    ['internalid', 'anyof', recid],
                    'AND',
                    ['mainline', 'anyof',mainLine],
                    'AND',
                    ['cogs', 'is','F'],
                    'AND',
                    ['taxline', 'is','F'],
                    'AND',
                    ['customgl', 'is','F'],
                ],
                columns: [
                    search.createColumn({ name: 'tranid' }),     
                    search.createColumn({ name: 'entity' }),
                    search.createColumn({
                        join: 'customer',
                        name : 'altname'
                    }),     
                    search.createColumn({
                        join: 'customer',
                        name : 'entityid'
                    }),     
                    search.createColumn({
                        join: 'customer',
                        name : 'address'
                    }),     
                    search.createColumn({
                        join: 'customer',
                        name : 'addresslabel'
                    }),     
                    search.createColumn({ name: 'custbody_fcn_faktur_pajak' }), 
                    search.createColumn({ name: 'cseg_rda_sales_type' }), 
                    search.createColumn({ name: 'trandate' }),       
                    search.createColumn({ name: 'createdfrom' }),   
                    search.createColumn({ name: 'salesrep' }),   
                    search.createColumn({ join:'createdfrom',name: 'salesrep' }), 
                    search.createColumn({ name: 'location' }), 
                    search.createColumn({ name : 'item'}),
                    search.createColumn({
                        join: 'item',
                        name : 'itemid'
                    }), 
                    search.createColumn({
                        join: 'item',
                        name : 'displayname'
                    }), 
                    search.createColumn({ name: 'quantity' }), 
                    search.createColumn({ name: 'subsidiarynohierarchy' }), 
                    search.createColumn({ name: 'unit' }),
                    search.createColumn({ name: 'rate' }),           // Rate of the item
                    search.createColumn({ name: 'itemtype' }) ,
                    search.createColumn({ name: 'custcol_rda_disc1_' }) ,
                    search.createColumn({ name: 'custcol_rda_disc2_' }) ,
                    search.createColumn({ name: 'custcol_rda_disc3_' }) ,
                    search.createColumn({ name: 'custcol_rda_disc4_' }) ,
                    search.createColumn({ name: 'custcol_rda_disc5_' }) ,
                    search.createColumn({ name: 'custcol_rda_disc6_' }),
                    search.createColumn({ name: 'custcol_rda_disc1_amount' }),
                    search.createColumn({ name: 'custcol_rda_disc2_amount' }),
                    search.createColumn({ name: 'custcol_rda_disc3_amount' }),
                    search.createColumn({ name: 'custcol_rda_disc4_amount' }),
                    search.createColumn({ name: 'custcol_rda_disc5_amount' }),
                    search.createColumn({ name: 'custcol_rda_disc6_amount' }),
                    search.createColumn({ name: 'custcol_rda_total_afterdisc' }),
                    search.createColumn({ name: 'terms' }),
                    search.createColumn({ name: 'terms', join : 'createdfrom' }),
                    search.createColumn({ name: 'custbody_rda_principal_trx_number', join : 'createdfrom' }),
                    search.createColumn({ name: 'tranid', join : 'createdfrom' }),
                    search.createColumn({ name: 'custbody_rda_total_header_disc' }),
                    search.createColumn({ name: 'custbody_rda_discount1_header' }),
                    search.createColumn({ name: 'custbody_rda_discount2_header' }),
                    search.createColumn({ name: 'custbody_rda_discount3_header' }),
                    search.createColumn({ name: 'custbody_rda_bank_name' }),
                    search.createColumn({ name: 'custbody_rda_bank_account_number2' }),
                    search.createColumn({ name: 'custbody_rda_bank_name_2' }),
                    search.createColumn({ name: 'custbody_rda_bank_account2' }),
                    search.createColumn({ name: 'status' }),
                    // search.createColumn({ name: 'shiprecvstatus' }),
                    search.createColumn({ name: 'shiprecvstatusline' }),
                    search.createColumn({ name: 'quantityshiprecv' }),
                    search.createColumn({ name: 'rate', join: 'appliedtotransaction' }),
                    search.createColumn({ name: 'taxtotal', join: 'appliedtotransaction' }),
                    search.createColumn({ name: 'total', join: 'appliedtotransaction' }),
                    search.createColumn({ name: 'locationnohierarchy' }),
                    // search.createColumn({ name: 'taxrate1' }),
                    search.createColumn({ name: 'line' }),
                    search.createColumn({ name: 'custcol_rda_quantity_1' }),
                    search.createColumn({ name: 'custcol_rda_quantity_2' }),
                    search.createColumn({ name: 'custcol_rda_quantity_3' }),
                    search.createColumn({ name: 'custcol_rda_tax_amount' }),
                    search.createColumn({ name: 'custbody_rda_tax_amount_disc_header' }),
                    search.createColumn({ name: 'taxamount' }),
                    
                    

                    // search.createColumn({ join:'fulfillingtransaction',name: 'custcol_rda_total_afterdisc' }),
                    // search.createColumn({ name: 'quantityshiprecv' }),
                    
                ]
            });

            if(type !== 'itemfulfillment'){
                searchRec.columns.push(search.createColumn({ name: 'custbody_rda_canvas_trx' }));
                searchRec.columns.push(search.createColumn({ name: 'custbody_rda_van_loading_number' }));
                // searchRec.filters.push(
                //     search.createFilter({
                //         name: "custcol_rda_total_afterdisc",
                //         operator: search.Operator.GREATERTHAN,
                //         values: "0.00" 
                //     })
                // );
                // ["custcol_rda_total_afterdisc","greaterthan","0.00"]
                // searchRec.filters.push(
                //     search.createFilter({
                //         name: "taxline",
                //         operator: search.Operator.IS,
                //         values: "F" 
                //     })
                // );
            }


            if(mainLine === "T") {
                searchRec.columns.push(
                    search.createColumn({
                        name: 'formulacurrency',
                        formula: '{amount} - NVL({taxamount}, 0)',
                        label: 'Calculated Subtotal'
                    }),
                    search.createColumn({ name: 'taxtotal' }),
                    search.createColumn({ name: 'total' })
                );
            }

            var itemSearchSet = searchRec.run();
            var result = itemSearchSet.getRange(0, 1000);

            return result;
        };
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
            var header = "";
            var body = "";
            var headerHeight = '28%';
            var style = "";
            var footer = "";
            var pdfFile = null;
            // var totalPages = 1;
            // log.debug("TOTAL PAGE", totalPages)
            var isA4 = context.request.parameters.isa4;
            var fontSize = 10
            if(isA4){
                fontSize = 12
            }
            var logoUrl = '';
            var fileLogo = file.load({
                id: 298
            })
            // log.debug('log url', fileLogo.url)
            logoUrl = fileLogo.url.replace(/&/g, "&amp;");

            var recid = context.request.parameters.id;
            var recType = context.request.parameters.type;
            
            let newRecType = recType
            // let createdFromId = data[0].getValue({name : 'createdfrom'})
            if(recType == 'itemfulfillment') newRecType = 'itemShip'
            let data = invoiceAndFulfillmentSearch(newRecType,recid,"T")
            // log.debug('Result',data)
            const resultDate = dateUtils.formatDateToJakarta(true);


            
            let companyName = "PT. REJEKI DAMAI ABADI";
            let companyAddress = data[0].getText({name : "subsidiarynohierarchy"}) || '';
            let isCanvasTrx = data[0].getValue({name : "custbody_rda_canvas_trx"});

            // log.debug('IS CANVAS TRX', isCanvasTrx);
            let custName = data[0].getValue({name : "altname", join: 'customer'});
            let custCode = data[0].getValue({name : "entityid", join: 'customer'});
            let custAdress = data[0].getValue({join:'customer',name :"addresslabel"});
            let listFaktur = {
                "Credit": "KREDIT",
                "Cash": "TUNAI"
            };  
            let typeFaktur = listFaktur[data[0].getText({ name: "cseg_rda_sales_type" })];
            if(isCanvasTrx){
                typeFaktur = 'KANVAS';
            }
            let noFaktur = data[0].getValue({name :"tranid"});
            let tanggalFaktur = data[0].getValue({name :"trandate"});
            
            let term = data[0].getText({name :"terms", join : 'createdfrom'}) || data[0].getText({name :"terms"});
            let termDay = term.match(/\d+(\.\d+)?/g);
            // termDay= [14];

            let [day, month, year] = tanggalFaktur.split('/').map(Number);
            let date = new Date(year, month - 1, day); // Month is 0-based in JavaScript Date

            log.debug('Date', date)
            if(termDay){
                date.setDate(date.getDate() + Number(termDay[0]));
                // log.debug('Date 2', date)
    
                // Format the new date back to DD/MM/YYYY
                let newDateString = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                // log.debug('TERM DAY', termDay);
                // log.debug('NEW DATE', newDateString);
    
                term = `${term}, ${newDateString}`;
            }


            let noSO = data[0].getValue({name :"custbody_rda_principal_trx_number", join : 'createdfrom'}) || data[0].getValue({name :"tranid", join : 'createdfrom'});
            let noVanLoading = data[0].getValue({name :"custbody_rda_van_loading_number"});
            let salesman =data[0].getValue({join:'createdfrom',name :"salesrep"}) || data[0].getValue({name :"salesrep"});
            if (salesman) {
                // Use search.lookupFields to get Sales Rep details
                const salesRepDetails = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: salesman,
                    columns: ['firstname','lastname', 'entityid','custrecord_rda_mapsales_employee_id.name']
                });
                // log.debug('Sales Rep Details', salesRepDetails);
                // customerSalesman = `${salesRepDetails.firstname} ${salesRepDetails.lastname} - ${salesRepDetails.custrecord_rda_mapsales_employee_id.name}`
                salesman = `${salesRepDetails.firstname} ${salesRepDetails.lastname}`
            }
            let gudang = data[0].getText({name :"locationnohierarchy"});
            let totalPPN = 0;
            let total =data[0].getValue({name :"total"}) ||  0;
            // if(recType == 'itemfulfillment') {
            //     totalPPN = data[0].getValue({join:'appliedtotransaction',name :"taxtotal"}) || 0;
            //     total =data[0].getValue({join:'appliedtotransaction',name :"total"}) ||  0;
            // }
            let subTotal = 0;
            let discountHeaderList = [
                `${data[0].getValue({name : 'custbody_rda_discount1_header'}) || 0 }%`,
                `${data[0].getValue({name : 'custbody_rda_discount2_header'}) || 0 }%`,
                `${data[0].getValue({name : 'custbody_rda_discount3_header'}) || 0 }%`,
            ]
            let discountHeader = discountHeaderList.filter(item => item != '0%').join("+")
            
            let totalQtyPCS = 0;
            let totalQtyKarton = 0;
            let items = 0;
            let bankName1 = data[0].getValue({name: "custbody_rda_bank_name"})
            let bankNumber1 = data[0].getValue({name :"custbody_rda_bank_account_number2"})
            let bankName2 = data[0].getValue({name: "custbody_rda_bank_name_2"})
            let bankNumber2 = data[0].getValue({name :"custbody_rda_bank_account2"})

            // round up
            total = Math.ceil(Number(total))
            let terbilang =terbilangRupiah(total)


            

            header = `<table width="100%"  style="table-layout:auto;">
                <tbody>
                    <tr>
                        <td style="width:45%;table-layout:fixed;">
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td colspan="2" >
                                            <span style="font-weight:bold;font-size:14px;">${escapeXmlSymbols(companyName)}</span>
                                            <br/>
                                            ${escapeXmlSymbols(companyAddress)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="white-space:nowrap;width:10%;">Kepada yth : </td>
                                        <td style="font-weight:bold;align:left;width:90%;"><p style="text-align:left;">${escapeXmlSymbols(custName)} (${escapeXmlSymbols(custCode)}) <br/> ${escapeXmlSymbols(custAdress)}</p></td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                        <td style="text-align:center;align:center;width:10%;">
                        </td>
                        <td style="width:45%;">
                            <table width="100%">
                                <tbody>
                                    <tr>
                                        <td colspan="2" style="font-weight:bold;font-size:14px;">
                                            ${recType == "itemfulfillment" ? "DO" : "FAKTUR"} ${escapeXmlSymbols(typeFaktur?.toUpperCase())}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>${recType == "itemfulfillment" ? "Nomor DO" : "No Faktur"}</td>
                                        <td style="font-weight:bold;">: ${escapeXmlSymbols(noFaktur)}</td>
                                    </tr>
                                    <tr>
                                        <td>Tanggal</td>
                                        <td style="font-weight:bold;">: ${escapeXmlSymbols(tanggalFaktur)}</td>
                                    </tr>
                                    <tr>
                                        <td>Term</td>
                                        <td style="font-weight:bold;">: ${escapeXmlSymbols(term)}</td>
                                    </tr>
                                    <tr>
                                        <td style="">${isCanvasTrx ? 'Nomor Van Loading' : 'Nomor SO'}</td>
                                        <td style="font-weight:bold;">: ${isCanvasTrx ? escapeXmlSymbols(noVanLoading) : escapeXmlSymbols(noSO)}</td>
                                    </tr>
                                    <tr>
                                        <td>Salesman</td>
                                        <td style="font-weight:bold;">: ${escapeXmlSymbols(salesman)}</td>
                                    </tr>
                                    <tr>
                                        <td>Halaman</td>
                                        <td style="font-weight:bold;">: <pagenumber/></td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
            `;

            // let newRecType = recType
            // let createdFromId = data[0].getValue({name : 'createdfrom'})
            if(recType == 'itemfulfillment') newRecType = 'itemship'
            // let dataItems = invoiceAndFulfillmentSearch(newRecType,createdFromId,"F")
            let dataItems = invoiceAndFulfillmentSearch(recType,recid,"F")
            log.debug('ITEM SEARCH', dataItems);

            let itemCount = dataItems.length;
            let itemRows = "";
            let linePrinted = [];
            let perPage = 4;
            let currentPage = 1;

            // Loop through each line item in the purchase order
            
                for (let i = 0; i < itemCount; i++) {
                    let itemType = dataItems[i].getValue({name : 'itemtype'});
                    let kode = dataItems[i].getValue({join:'item',name :"itemid"});
                    let namaProduk = dataItems[i].getValue({join:'item',name :"displayname"});
                    let jumlahBarang = dataItems[i].getValue({name :"quantity"}) +" PCS";
                    // if(recType == 'itemfulfillment') jumlahBarang = dataItems[i].getValue({name :"quantityshiprecv"}) +" "+ dataItems[i].getValue({name :"unit"});
                    let hargaJual = dataItems[i].getValue({name : 'rate'}) || 0;
                    let discountPercent = [
                        dataItems[i].getValue({ name: "custcol_rda_disc1_" }) 
                            ? `${dataItems[i].getValue({ name: "custcol_rda_disc1_" })}%` 
                            : dataItems[i].getValue({ name: "custcol_rda_disc1_amount" }) 
                                ? format.format({ value: dataItems[i].getValue({ name: "custcol_rda_disc1_amount" }), type: format.Type.CURRENCY }) 
                                : 0,
                                
                        dataItems[i].getValue({ name: "custcol_rda_disc2_" }) 
                            ? `${dataItems[i].getValue({ name: "custcol_rda_disc2_" })}%` 
                            : dataItems[i].getValue({ name: "custcol_rda_disc2_amount" }) 
                                ? format.format({ value: dataItems[i].getValue({ name: "custcol_rda_disc2_amount" }), type: format.Type.CURRENCY }) 
                                : 0,
                                
                        dataItems[i].getValue({ name: "custcol_rda_disc3_" }) 
                            ? `${dataItems[i].getValue({ name: "custcol_rda_disc3_" })}%` 
                            : dataItems[i].getValue({ name: "custcol_rda_disc3_amount" }) 
                                ? format.format({ value: dataItems[i].getValue({ name: "custcol_rda_disc3_amount" }), type: format.Type.CURRENCY }) 
                                : 0,
                                
                        dataItems[i].getValue({ name: "custcol_rda_disc4_" }) 
                            ? `${dataItems[i].getValue({ name: "custcol_rda_disc4_" })}%` 
                            : dataItems[i].getValue({ name: "custcol_rda_disc4_amount" }) 
                                ? format.format({ value: dataItems[i].getValue({ name: "custcol_rda_disc4_amount" }), type: format.Type.CURRENCY }) 
                                : 0,
                                
                        dataItems[i].getValue({ name: "custcol_rda_disc5_" }) 
                            ? `${dataItems[i].getValue({ name: "custcol_rda_disc5_" })}%` 
                            : dataItems[i].getValue({ name: "custcol_rda_disc5_amount" }) 
                                ? format.format({ value: dataItems[i].getValue({ name: "custcol_rda_disc5_amount" }), type: format.Type.CURRENCY }) 
                                : 0,
                                
                        dataItems[i].getValue({ name: "custcol_rda_disc6_" }) 
                            ? `${dataItems[i].getValue({ name: "custcol_rda_disc6_" })}%` 
                            : dataItems[i].getValue({ name: "custcol_rda_disc6_amount" }) 
                                ? format.format({ value: dataItems[i].getValue({ name: "custcol_rda_disc6_amount" }), type: format.Type.CURRENCY }) 
                                : 0
                    ];
                    let detailQty = [
                        dataItems[i].getValue({ name : 'custcol_rda_quantity_1'}) || 0,
                        dataItems[i].getValue({ name : 'custcol_rda_quantity_2'}) || 0,
                        dataItems[i].getValue({ name : 'custcol_rda_quantity_3'}) || 0,
                    ];
    
                    let detailQtyConcat = '';
                    if(detailQty.find(dc => dc > 0)){
                        detailQtyConcat= detailQty.join('.');
    
                    }
    
    
                    let line = dataItems[i].getValue({ name : 'line'});
    
                    if(linePrinted.includes(line)){
                        continue;
                    }
                    
    
                    // if(Number(dataItems[i].getValue({name :"quantity"})) <= 0) continue;
                    let rebateOrPotongan= discountPercent.filter(item => item != 0 && item != '0%').join('+');
                    let discountAmounts = [
                        dataItems[i].getValue({ name: "custcol_rda_disc1_amount" }) || 0,
                        dataItems[i].getValue({ name: "custcol_rda_disc2_amount" }) || 0,
                        dataItems[i].getValue({ name: "custcol_rda_disc3_amount" }) || 0,
                        dataItems[i].getValue({ name: "custcol_rda_disc4_amount" }) || 0,
                        dataItems[i].getValue({ name: "custcol_rda_disc5_amount" }) || 0,
                        dataItems[i].getValue({ name: "custcol_rda_disc6_amount" }) || 0,
                    ];
    
                    log.debug('DISCOUNT AMOUNT ARRAY', discountAmounts.join(' | '));
    
                    
                   
                    
                    if(recType == 'itemfulfillment') {
                        hargaJual = dataItems[i].getValue({ name: 'rate', join: 'appliedtotransaction' }) || 0
                        // jumlahBarang = dataItems[i].getValue({name :"quantityshiprecv"}) +" "+ dataItems[i].getValue({name :"unit"});
                        // jumlahRP = dataItems[i].getValue({ join: 'fulfillingtransaction', name: "custcol_rda_total_afterdisc" });
                    }
                    let totalDiscountAmount = discountAmounts.reduce(function(acc,num){
                        return Number(acc) + Number(num)
                    },0);
                    let jumlahRP = dataItems[i].getValue({ name: "custcol_rda_total_afterdisc" });
                    // round up
                    jumlahRP = Math.ceil(Number(jumlahRP))
                    log.debug('data',`${line} | ${kode} | ${namaProduk} | ${detailQtyConcat} | ${jumlahBarang} | ${hargaJual} | ${rebateOrPotongan} | ${jumlahRP}`)
                        // subTotal = Number(subTotal) + Number(totalAmount);
                    if(itemType !== "Discount" && itemType !== 'TaxItem' && Number(jumlahRP) > 0){
                        items++;
                        
                        // if(recType == 'invoice'){
                        //     let soId = data[0].getValue({ name : 'createdfrom'});
                        //     let itemId = dataItems[i].getValue({name : 'item'});
                        //     let taxRate = findTaxRate(soId, itemId);
                        //     log.debug('TAX RATE', taxRate);
                        //     // taxRate = Number(parseFloat(taxRate));
                        //     // let jumlahIncludePPN = Number(jumlahRP) * taxRate/ 100;
                        //     // totalPPN = Number(totalPPN) + Number(jumlahIncludePPN);
                        // }
                        let taxAmount = dataItems[i].getValue({ name : 'custcol_rda_tax_amount'}) || 0;
                        if(recType  == 'invoice'){
                            taxAmount = dataItems[i].getValue({ name : 'taxamount'}) || 0;
                        }
                        
                        totalPPN = Number(totalPPN) + Number(taxAmount);
                        log.debug('TAX AMOUNT', taxAmount);
                        totalQtyPCS = Number(totalQtyPCS) +Number(dataItems[i].getValue({name :"quantity"}));
                        totalQtyKarton = Number(totalQtyKarton) + Number(dataItems[i].getValue({name :"custcol_rda_quantity_1"}) || 0) ;
                        subTotal = Number(subTotal) + Number(jumlahRP)
                        itemRows += `
                            <tr style="height:35px;">     
                                <td style="border-bottom: 1px solid black;border-right: 1px solid black;border-left: 1px solid black;align:left;font-size:${fontSize}"><p>${escapeXmlSymbols(kode)}</p></td>
                                <td style="border-bottom: 1px solid black;border-right: 1px solid black;align:left;font-size:${fontSize}"><p>${escapeXmlSymbols(namaProduk)}</p></td>
                                <td style="border-bottom: 1px solid black;border-right: 1px solid black;align:right;font-size:${fontSize}"><p>${escapeXmlSymbols(detailQtyConcat)}</p></td>
                                <td style="border-bottom: 1px solid black;border-right: 1px solid black;align:right;font-size:${fontSize}">${jumlahBarang}</td>
                                <td style="border-bottom: 1px solid black;border-right: 1px solid black;align:right;font-size:${fontSize}">${format.format({value: hargaJual, type : format.Type.CURRENCY})}</td>
                                <td style="border-bottom: 1px solid black;border-right: 1px solid black;align:right;font-size:${fontSize}">${escapeXmlSymbols(rebateOrPotongan)}</td>
                                <td style="border-bottom: 1px solid black;border-right: 1px solid black;align:right;font-size:${fontSize}">${jumlahRP && format.format({value: jumlahRP, type : format.Type.CURRENCY})}</td>
                            </tr>
                        `;
                        if(items%perPage == 0){
                            currentPage++;
                            // itemRows += `
                            // <tr style="height:20px;">     
                            //     <td style="border:1px solid black;" colspan="7">
                            //         <br style="page-break-before: always"/>
                            //     </td>
                            // </tr>
                            // `;
                        }
                        linePrinted.push(line);
    
                    }
                   
                }
            

            // log.debug('ITEM ROWS',itemRows);
           
            body = `
            <table width="100%" style="border-collapse: collapse;">
                <thead>
                    <tr>
                        <td style="border-bottom: 1px solid black;border-right: 1px solid black;border-top: 1px solid black;border-left: 1px solid black;align:center;font-weight:bold;font-size:${fontSize}">Kode</td>
                        <td style="border-bottom: 1px solid black;border-right: 1px solid black;border-top: 1px solid black;align:center;font-weight:bold;font-size:${fontSize}">Nama Produk</td>
                        <td style="border-bottom: 1px solid black;border-right: 1px solid black;border-top: 1px solid black;align:center;font-weight:bold;font-size:${fontSize}"><p style='text-align:left;'>Detail Qty</p></td>
                        <td style="border-bottom: 1px solid black;border-right: 1px solid black;border-top: 1px solid black;align:center;font-weight:bold;font-size:${fontSize}">Jumlah Brg in Pcs</td>
                        <td style="border-bottom: 1px solid black;border-right: 1px solid black;border-top: 1px solid black;align:center;font-weight:bold;font-size:${fontSize}">Hrg Jual</td>
                        <td style="border-bottom: 1px solid black;border-right: 1px solid black;border-top: 1px solid black;align:center;font-weight:bold;font-size:${fontSize}">Rabat/Potongan</td>
                        <td style="border-bottom: 1px solid black;border-right: 1px solid black;border-top: 1px solid black;align:center;font-weight:bold;font-size:${fontSize}">Jumlah RP</td>
                    </tr>
                </thead>a
                <tbody>
                    ${itemRows}
                </tbody>
            </table>
            `;
            
            log.debug('ITEMS', items);
            let totalPage = Math.ceil(items / perPage);
            log.debug('totalPage', totalPage);
           
            style += "<style type='text/css'>";
            style += "*{margin:0;padding:0;}";
            // style += "#page2 {footer:nlfooter}";
            // style += "#page {footer:nlfooter}";
            if(totalPage > 1){
                for (let page = 1; page < totalPage; page++) {
                    
                    style += "#page"+page+" {footer:nlfooter;footer-height:35%;}";
                    
                }
            }
            style += "#page"+totalPage+" {footer:nlfooterlastpage;footer-height:35%;}";

            style += "</style>";

            // totalPPN = subTotal * 11 /100;
            let totalHeaderDiscount = Number(data[0].getValue({name :"custbody_rda_total_header_disc"})) ||  0;
            let totalPPNHeader = Number(data[0].getValue({name :"custbody_rda_tax_amount_disc_header"})) ||  0;
            // totalPPN = totalPPN + totalPPNHeader;
            // totalPPN = totalPPNHeader;
            if(recType == 'invoice'){
                totalPPN = data[0].getValue({name :"taxtotal"}) ||  0;
            }
            total = subTotal + Number(totalPPN) - totalHeaderDiscount;

            footerRegular = `
            <div style="height:90%;"></div>
            ${typeFaktur == "KREDIT" && recType == "itemfulfillment" ? `
            <p style="font-size:11px;font-style:italic;margin-top:1px;"> 
                 "Faktur ini Tidak digunakan untuk Penagihan"
            </p>` : ''}
            <table width="100%" style="border-collapse: collapse;">
                <tbody>
                    <tr>
                        <td style="align:right;font-size:10px;">${escapeXmlSymbols(resultDate)}</td>
                    </tr>
                </tbody>
            </table>`

            footerlastPage = `
            <table width="100%" style="border-collapse: collapse;margin-bottom:0;" top="-${minTopFooter}">
                <tbody>
                    <tr>
                        <td style="width:60%;border-bottom: 1px solid black;border-top: 1px solid black;border-right:1px solid black;">
                            <p>
                                <span style="font-size:10px;">
                                Barang telah diterima dengan baik dan cukup
                                <br/>
                                    <span style="white-space:nowrap;">Pembayaran cek-giro dianggap lunas setelah cair dan Faktur adalah bukti sah penagihan.</span>
                                    <br/>
                                    <span style="white-space:nowrap;">Pembayaran transfer hanya melalui ${escapeXmlSymbols(bankName1)}: ${escapeXmlSymbols(bankNumber1)} / ${escapeXmlSymbols(bankName2)}: ${escapeXmlSymbols(bankNumber2)} </span> 
                                </span>
                            </p>
                            <p>Cap dan Tanda-Tangan</p>
                            <br/>
                            <br/>
                            <table width="100%" style="border-collapse: collapse;" vertical-align="bottom">
                                <tbody>
                                    <tr>
                                        <td colspan="3" style="height:30px"></td>
                                    </tr>
                                    <tr>
                                        <td ><div style="border-bottom:1px dotted black;width:100px;height:1px;"></div></td>
                                        <td ><div style="border-bottom:1px dotted black;width:100px;height:1px;"></div></td>
                                        <td ><div style="border-bottom:1px dotted black;width:100px;height:1px;"></div></td>
                                        
                                    </tr>
                                    <tr>
                                        <td>Toko/Pembeli</td>
                                        <td>Otorisasi</td>
                                        <td>Pengiriman</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                       
                        <td style="width:40%;border-bottom: 1px solid black;border-top: 1px solid black;">
                            <table width="100%" style="border-collapse: collapse;">
                                <tbody>
                                    <tr>
                                        <td>Subtotal</td>
                                        <td style="align:right">${format.format({value: subTotal, type : format.Type.CURRENCY})}</td>
                                    </tr>
                                    <tr>
                                        <td>Discount Header</td>
                                        <td style="align:right">${discountHeader ? format.format({value: discountHeader, type : format.Type.CURRENCY}) : ''}</td>
                                    </tr>
                                    <tr>
                                        <td>PPN</td>
                                        <td style="align:right">${format.format({value: totalPPN, type : format.Type.CURRENCY})}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-weight:bold;font-size:12px;">TOTAL</td>
                                        <td style="align:right;font-size:12px;">${format.format({value: total, type : format.Type.CURRENCY})}</td>
                                    </tr>
                                    
                                </tbody>
                            </table>

                            <p style="font-size:11px;font-style:italic;margin-bottom:1px;">#${escapeXmlSymbols(terbilang)}</p>
                            <table width="100%" style="border-collapse: collapse;">
                                <tbody>
                                    <tr>
                                        <td style="font-size:11px;">#Karton</td>
                                        <td style="font-size:11px;">#Items</td>
                                        <td style="font-size:11px;"></td>
                                        <td style="font-size:11px;"></td>
                                    </tr>
                                    <tr>
                                        <td>${totalQtyKarton}</td>
                                        <td>${items}</td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
            ${typeFaktur == "KREDIT" && recType == "itemfulfillment" ? `
                <p style="font-size:11px;font-style:italic;margin-top:1px;">
                     "Faktur ini Tidak digunakan untuk Penagihan"
                </p>` : ''}
           
                <p style="align:right;font-size:10px;text-align:right;margin-top:1px;">${resultDate}</p>
                `

            var pageWidth = 21;
            var pageHeight = 14.8;
            var paddingBottom = '0';
            
            var paddingTop = 10
            var paddingRight = 5
            var paddingLeft = 5
            var minTopFooter = 10
            
            if(isA4){
                pageHeight = 14;
                pageWidth = 25.4;
                paddingTop = 10;
                paddingLeft = 10;
                paddingRight = 10;
                minTopFooter = 30;
            }

            var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            xml += "<pdf>";
            xml += "<head>";
            xml += style;
            xml += "<macrolist>";
            xml += "<macro id=\"nlheader\">";
            xml += header;
            xml += "</macro>";
            xml += "<macro id=\"nlfooter\">";
            xml += footerRegular;
            xml += "</macro>";
            xml += "<macro id=\"nlfooterlastpage\">";
            xml += footerlastPage;
            xml += "</macro>";
            xml += "</macrolist>";
            xml += "</head>"
            xml += `<body font-size='9' size="A4" orientation="landscape" class='page' style="font-family: Tahoma, sans-serif;font-weight:500;width: ${pageWidth}cm; height: ${pageHeight}cm;padding-left:'${paddingLeft}';padding-right:'${paddingRight}';padding-top:'${paddingTop}';padding-bottom:${paddingBottom}" header='nlheader' header-height='${headerHeight}'>`;
            xml += body;
            // xml += "<pbr pagenumber='"+totalPages+"' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter2' footer-height='20%'/>";
            xml += "\n</body>\n</pdf>";

            xml = xml.replace(/ & /g, ' &amp; ');
            response.renderPdf({
                xmlString: xml
            });

             // Generate the PDF
            //  var pdfFile = render.xmlToPdf({
            //     xmlString: xml
            // });

            // // Get the total number of pages
            // // var totalPages = pdfFile.getPageCount();
            // log.debug('PDF FILE', pdfFile)

            // context.response.writeFile({
            //     file: pdfFile,
            //     isInline: true // Set to false for download, true to display in browser
            // });
        


        }

        return {onRequest}

    });
