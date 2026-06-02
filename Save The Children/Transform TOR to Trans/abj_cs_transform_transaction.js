/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message", "N/ui/dialog", "N/https"], 
function (runtime, log, url, currentRecord, currency, record, search, message, dialog, https) {

    function pageInit(context) {
        console.log("Page init: script aktif");
    }

    function getData(transType) {
        var records = currentRecord.get();
        var recId = records.id;

        console.log('recId', recId);
        console.log('transType', transType);

        if (!recId) return [];

        var recLoad = record.load({
            type: 'customrecord_tor',
            id: recId
        });

        var date = recLoad.getText('custrecord_tor_date');
        var emp  = recLoad.getValue('custrecord_tor_create_by');
        var timeFrom = recLoad.getText('custrecord_tor_timeline_p_from');
        var timeTo = recLoad.getText('custrecord_tor_timeline_period_to');
        var noTor = recLoad.getValue('name');

        var cekLine = recLoad.getLineCount({
            sublistId: 'recmachcustrecord_tori_id'
        });

        console.log('cekLine', cekLine);

        var dataTransform = [];

        // --- VARIABEL KHUSUS UNTUK GROUPING EXPENSE REPORT ---
        var linkedExpenseIds = [];
        var sofLineCountMap = {}; // Menyimpan total baris per SOF {"ID_SOF": total_line}
        var sofTorAmountMap = {}; // Menyimpan total nominal budget TOR asli {"ID_SOF": total_amt}
        var expenseSummaryMap = {}; // Menyimpan nominal terpakai dari search {"ID_SOF": amt_terpakai}
        // -----------------------------------------------------

        if (cekLine > 0) {
            // STEP 1: Loop Pertama untuk Mengumpulkan Data Dasar & Grouping Awal
            for (var i = 0; i < cekLine; i++) {
                var transactionType = recLoad.getSublistValue({
                    sublistId: 'recmachcustrecord_tori_id',
                    fieldId: 'custrecord_tor_transaction_type',
                    line: i
                });

                if (transactionType === transType) {
                    var sof = recLoad.getSublistValue({
                        sublistId: 'recmachcustrecord_tori_id',
                        fieldId: 'custrecord_tor_project',
                        line: i
                    });

                    var amount = parseFloat(recLoad.getSublistValue({
                        sublistId: 'recmachcustrecord_tori_id',
                        fieldId: 'custrecord_tori_amount',
                        line: i
                    })) || 0;

                    var cekLink = recLoad.getSublistValue({
                        sublistId: 'recmachcustrecord_tori_id',
                        fieldId: 'custrecord_tor_link_trx_no',
                        line: i
                    });

                    var createdTransTAR = recLoad.getSublistValue({
                        sublistId: 'recmachcustrecord_tori_id',
                        fieldId: 'custrecord_tor_link_tar',
                        line: i
                    });

                    // Logika Khusus Tipe Expense '2' untuk mengumpulkan ID Dokumen Terkait dan menghitung baris
                    if (transType === '2' && sof) {
                        var sofStr = sof.toString();

                        // 1. Hitung akumulasi budget TOR asli per SOF
                        if (!sofTorAmountMap[sofStr]) sofTorAmountMap[sofStr] = 0;
                        sofTorAmountMap[sofStr] += amount;

                        // 2. Hitung ada berapa baris line yang menggunakan SOF ini
                        if (!sofLineCountMap[sofStr]) sofLineCountMap[sofStr] = 0;
                        sofLineCountMap[sofStr] += 1;

                        // 3. Bersihkan format ID Expense Report penampung terlink agar tidak rusak/duplikat
                        if (cekLink && cekLink !== '') {
                            var cleanExpenseId = Array.isArray(cekLink) ? cekLink[0] : cekLink;
                            if (cleanExpenseId && linkedExpenseIds.indexOf(cleanExpenseId.toString()) === -1) {
                                linkedExpenseIds.push(cleanExpenseId.toString());
                            }
                        }
                    }

                    // Push object sementara (nilai amount nanti akan kita timpa/update khusus untuk tipe '2')
                    dataTransform.push({
                        noTor : noTor,
                        date: date,
                        emp: emp,
                        timeFrom : timeFrom,
                        timeTo : timeTo,
                        dea: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_dea', line: i }),
                        drc: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_drc', line: i }),
                        project: sof,
                        projectTask: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tor_project_task', line: i }),
                        transactionType: transactionType,
                        idTor : recId,
                        amount: amount, // Nilai default asal
                        approver: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_approver', line: i }),
                        approverFa: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_approver_fa', line: i }),
                        costCenter: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_cost_center', line: i }),
                        item: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_item', line: i }),
                        projectCode: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_project_code', line: i }),
                        sof: recLoad.getSublistValue({ sublistId: 'recmachcustrecord_tori_id', fieldId: 'custrecord_tori_source_of_funding', line: i }),
                        bussinessUnit: recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_business_unit', line : i }),
                        idLine : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'id', line : i }),
                        activityCode : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_activity_code', line : i }),
                        description : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_description', line : i }),
                        unitCost : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_unit_cost', line : i }),
                        qty : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_quantity', line : i }),
                        uom : recLoad.getSublistValue({ sublistId : 'recmachcustrecord_tori_id', fieldId : 'custrecord_tor_uom', line : i })
                    });
                }
            }

            // STEP 2: Cari Penggunaan Terpakai via Saved Search (Hanya jika tipe '2' dan memiliki Dokumen Link)
            if (transType === '2' && linkedExpenseIds.length > 0) {
                console.log('Menjalankan Search Expense Report untuk IDs:', linkedExpenseIds);
                
                var expensereportSearchObj = search.create({
                    type: "expensereport",
                    filters: [
                        ["type", "anyof", "ExpRept"], "AND", 
                        ["internalid", "anyof", linkedExpenseIds], "AND", 
                        ["mainline", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({name: "amount", label: "Amount"}),
                        search.createColumn({name: "internalid", join: "customer"})
                    ]
                });

                expensereportSearchObj.run().each(function(result) {
                    var expAmount = parseFloat(result.getValue({ name: 'amount' })) || 0;
                    var expSof = result.getValue({ name: 'internalid', join: 'customer' });
                    if (expSof) {
                        var expSofStr = expSof.toString();
                        if (!expenseSummaryMap[expSofStr]) expenseSummaryMap[expSofStr] = 0;
                        expenseSummaryMap[expSofStr] += expAmount;
                    }
                    return true;
                });
                console.log('Expense Terpakai Map:', expenseSummaryMap);
            }

            // STEP 3: Hitung Pembagian Saldo Rata Khusus untuk Tipe Expense '2'
            if (transType === '2') {
                dataTransform.forEach(function(item) {
                    if (item.project) {
                        var itemSofStr = item.project.toString();
                        var totalTorBudget = sofTorAmountMap[itemSofStr] || 0;
                        var totalUsedBudget = expenseSummaryMap[itemSofStr] || 0;
                        var totalLinesForThisSof = sofLineCountMap[itemSofStr] || 1;

                        // Rumus Pembagian Rata Sisa Nominal Budget
                        var remainingBudget = totalTorBudget - totalUsedBudget;
                        if (remainingBudget < 0) remainingBudget = 0; // proteksi minus

                        var allocatedAmountPerLine = remainingBudget / totalLinesForThisSof;
                        
                        // Perbarui nilai target limit sisa yang dibagi rata untuk baris ini
                        item.amount = allocatedAmountPerLine;
                        
                        // Opsional tambahan: Anda juga bisa menitipkan nilai limit murni per SOF 
                        // ke parameter objek agar dibaca otomatis oleh field custom 'custcol_amount_limit_from_tor' di baris item
                        item.custcol_amount_limit_from_tor = allocatedAmountPerLine; 
                    }
                });
            }
        }
        
        console.log('dataTransform Final Result:', dataTransform);
        return dataTransform;
    }

    function transformPO(){
        var dataParams = getData('1');
        console.log('dataParams', dataParams);
        var dataParamsString = JSON.stringify(dataParams);
        var createURL = url.resolveRecord({
            recordType: "purchaseorder",
            isEditMode: true,
            params: {
                cf: 130,  
                dataParamsString : dataParamsString
            },
        });
        window.open(createURL, "_blank");
    }

    function transformPR(){
        var dataParams = getData('3');
        var dataParamsString = JSON.stringify(dataParams);
        console.log('dataParamsString', dataParamsString);
        var createURL = url.resolveRecord({
            recordType: "purchaserequisition",
            isEditMode: true,
            params: { dataParamsString },
        });
        window.open(createURL, "_blank");
    }

    function transformTar(){
        var dataParams = getData('4');
        var dataParamsString = JSON.stringify(dataParams);
        console.log('dataParamsString', dataParamsString);
        var createURL = url.resolveRecord({
            recordType: "customrecord_tar",
            isEditMode: true,
            params: { dataParamsString },
        });
        window.open(createURL, "_blank");
    }

    function transformExp(){
        var dataParams = getData('2');
        console.log('dataParams', dataParams);
        var dataParamsString = JSON.stringify(dataParams);
        var createURL = url.resolveRecord({
            recordType: "expensereport",
            isEditMode: true,
            params: { dataParamsString },
        });
        window.open(createURL, "_blank");
    }

    return {
        pageInit : pageInit,
        transformPO : transformPO,
        transformPR : transformPR,
        transformExp : transformExp,
        transformTar : transformTar
    };
});