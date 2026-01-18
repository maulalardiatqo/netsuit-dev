/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search', 'N/runtime'], function (currentRecord, search, runtime) {

    function formatDateDDMMYYYY(dateStr) {
        if (!dateStr) return null;
        var parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1;
        var year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }

    function pageInit(context) {
        var rec = currentRecord.get();
        if (rec.getValue('custbody_exp_autofilled')) return;

        var payload = getParam('dataParamsString');
        if (!payload) return;

        var data;
        try {
            data = JSON.parse(decodeURIComponent(payload));
        } catch (e) {
            console.log('Invalid payload', e);
            return;
        }

        if (!data || !data.length) return;

        /** =========================
         * OPTIMISASI: PRE-FETCH DATA
         * ========================= */
        
        // 1. Kumpulkan semua Item ID dari payload
        var itemIds = [];
        data.forEach(function(line){
            if(line.item) itemIds.push(line.item);
        });

        // Object untuk menyimpan hasil mapping (Cache)
        // Format: { itemId: expenseAccountId }
        var itemAccountMap = {}; 
        var uniqueAccountIds = [];

        // 2. Search Item (Hanya 1 kali Search untuk semua item)
        if (itemIds.length > 0) {
            search.create({
                type: "item",
                filters: [
                    ["internalid", "anyof", itemIds]
                ],
                columns: ["expenseaccount"]
            }).run().each(function(result){
                var accId = result.getValue('expenseaccount');
                itemAccountMap[result.id] = accId;
                
                if(accId && uniqueAccountIds.indexOf(accId) === -1){
                    uniqueAccountIds.push(accId);
                }
                return true;
            });
        }

        // Object untuk menyimpan mapping Account ke Category
        // Format: { accountId: categoryId }
        var accountCategoryMap = {};

        // 3. Search Category (Hanya 1 kali Search untuk semua akun)
        // Kita butuh logika: Jika 1 akun punya > 1 kategori, jangan ambil (sesuai logika asli: searchResultCount === 1)
        if (uniqueAccountIds.length > 0) {
            var tempCatCount = {}; // Helper untuk menghitung jumlah kategori per akun

            search.create({
                type: "expensecategory",
                filters: [
                    ["account", "anyof", uniqueAccountIds]
                ],
                columns: ["internalid", "account"]
            }).run().each(function(result){
                var catId = result.getValue('internalid');
                var accId = result.getValue('account');

                if(!tempCatCount[accId]) {
                    tempCatCount[accId] = { count: 0, catId: null };
                }
                
                tempCatCount[accId].count++;
                tempCatCount[accId].catId = catId; // Simpan sementara
                
                return true;
            });

            // Hanya masukkan ke map final jika count === 1
            for (var acc in tempCatCount) {
                if (tempCatCount[acc].count === 1) {
                    accountCategoryMap[acc] = tempCatCount[acc].catId;
                }
            }
        }

        /** =========================
         * HEADER (setValue)
         * ========================= */
        var currentUser = runtime.getCurrentUser();
        // Mengurangi log berlebihan
        
        rec.setValue({ fieldId: 'custbody_id_to', value: data[0].idTor, ignoreFieldChange: true });
        rec.setValue({ fieldId: 'custbody_stc_link_to_tor', value: data[0].idTor, ignoreFieldChange: true });
        rec.setValue({ fieldId: 'custbody_stc_expense_report_type', value: '1', ignoreFieldChange: true }); // Tambah ignoreFieldChange jika aman
        rec.setValue({ fieldId: 'entity', value: currentUser.id }); // Langsung pakai currentUser.id
        rec.setValue({ fieldId: 'expensereportcurrency', value: '1' });
        rec.setValue({ fieldId: 'trandate', value: formatDateDDMMYYYY(data[0].date) });
        rec.setValue({ fieldId: 'department', value: data[0].costCenter });
        rec.setValue({ fieldId: 'class', value: data[0].projectCode || '114' });
        rec.setValue({ fieldId: 'location', value: '3' });
        rec.setValue({ fieldId: 'cseg_stc_sof', value: data[0].sof || '66' });
        rec.setValue({ fieldId: 'custbody_stc_activity_date_from', value: formatDateDDMMYYYY(data[0].timeFrom) });
        rec.setValue({ fieldId: 'custbody_stc_activity_date_to', value: formatDateDDMMYYYY(data[0].timeTo) });

        /** =========================
         * LINES (expense sublist)
         * ========================= */
        // Loop sekarang berjalan di memori browser (sangat cepat) tanpa request network
        data.forEach(function (line) {
            rec.selectNewLine({ sublistId: 'expense' });

            rec.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'expensedate',
                value: formatDateDDMMYYYY(data[0].date),
                ignoreFieldChange: true
            });

            rec.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'memo',
                value: line.noTor,
                ignoreFieldChange: true
            });

            // --- BAGIAN OPTIMISASI ---
            var expAcc = null;
            var category = null;

            // Ambil dari Item Map (O(1) lookup speed)
            if (line.item && itemAccountMap[line.item]) {
                expAcc = itemAccountMap[line.item];
            }

            // Ambil dari Category Map (O(1) lookup speed)
            if (expAcc && accountCategoryMap[expAcc]) {
                category = accountCategoryMap[expAcc];
            }
            // -------------------------

            if (category) {
                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'category',
                    value: category,
                    ignoreFieldChange: true
                });
            }

            rec.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'amount',
                value: line.amount,
                ignoreFieldChange: true
            });

            if (line.costCenter) {
                rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'department', value: line.costCenter, ignoreFieldChange: true });
            }

            if (line.projectCode) {
                rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'class', value: line.projectCode, ignoreFieldChange: true });
            }

            rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'currency', value: '1', ignoreFieldChange: true });
            rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'expenseaccount', value: '488', ignoreFieldChange: true });

            if (line.project) {
                rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'customer', value: line.project, ignoreFieldChange: true });
            }

            if (line.projectTask) {
                rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'projecttask', value: line.projectTask, ignoreFieldChange: true });
                rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custrecord_tare_project_task', value: line.projectTask, ignoreFieldChange: true });
            }

            if (line.drc) {
                rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'cseg_stc_drc_segmen', value: line.drc, ignoreFieldChange: true });
            }

            if (line.dea) {
                rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'cseg_stc_segmentdea', value: line.dea, ignoreFieldChange: true });
            }

            if (line.sof) {
                rec.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'cseg_stc_sof', value: line.sof, ignoreFieldChange: true });
            }

            rec.commitLine({ sublistId: 'expense' });
        });

        rec.setValue({
            fieldId: 'custbody_exp_autofilled',
            value: true,
            ignoreFieldChange: true
        });
    }

    function getParam(name) {
        return new URL(window.location.href).searchParams.get(name);
    }

    return {
        pageInit: pageInit
    };
});