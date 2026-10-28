/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/log', 'N/https', 'N/url', 'N/runtime', 'N/record', 'N/format'], (search, log, https, url, runtime, record, format) => {

    const afterSubmit = (scriptContext) => {
        try {
            const { newRecord, type, UserEventType } = scriptContext;
            if (type !== UserEventType.CREATE && type !== UserEventType.EDIT && type !== UserEventType.COPY) return;
            
            const idRec = newRecord.id;
            // Ambil value link allocation (multiselect mengembalikan array)
            const linkAllocation = newRecord.getValue('custentity_stc_link_to_allocation_schdl') || [];
            
            log.debug('linkAllocation', linkAllocation);
            log.debug('linkAllocation.length', linkAllocation.length);
            
            var cekEmpType = newRecord.getValue('custentity_stc_employee_type');
            
            // Jika employee type = 1, jalankan validasi pembuatan allocation
            // Pengecekan limit hardcode dihapus agar dinamis menyesuaikan data search
            if (cekEmpType == 1) {
                createAllocation(idRec, linkAllocation);
            }
        } catch(e) {
            log.error('error in afterSubmit', e);
        }
    }

    function createAllocation(idRec, existingLinks) {
        var recLoad = record.load({
            type : "employee",
            id : idRec
        });

        // Pastikan format existingLinks adalah array
        var currentLinks = existingLinks ? (Array.isArray(existingLinks) ? existingLinks : [existingLinks]) : [];

        var fName = recLoad.getValue('firstname') || '';
        var lName = recLoad.getValue('lastname') || '';
        var fullName = (fName + ' ' + lName).trim();
        var costCenter = recLoad.getValue('department');

        // 1. Ambil Mapping secara Dinamis dari Custom Record menggunakan Saved Search
        var masterMappings = [];
        var customrecord_mapping_account_allocationSearchObj = search.create({
            type: "customrecord_mapping_account_allocation",
            filters: [],
            columns: [
                search.createColumn({name: "custrecord_account_source"}),
                search.createColumn({name: "custrecord_account_destination"})
            ]
        });

        customrecord_mapping_account_allocationSearchObj.run().each(function(result) {
            var sourceAcc = result.getValue("custrecord_account_source");
            var destAcc = result.getValue("custrecord_account_destination");
            
            if (sourceAcc && destAcc) {
                masterMappings.push({
                    source: sourceAcc,
                    destination: destAcc
                });
            }
            return true;
        });

        log.debug('Dynamic Master Mappings', masterMappings);

        // Jika tidak ada data mapping sama sekali di custom record, hentikan proses
        if (masterMappings.length === 0) {
            log.debug('Status', 'Tidak ada data di mapping account allocation.');
            return;
        }

        var usedDestAccounts = [];
        if (currentLinks.length > 0) {
            currentLinks.forEach(function(allocId) {
                try {
                    var allocRec = record.load({
                        type: 'allocationschedule',
                        id: allocId
                    });
                    var destCount = allocRec.getLineCount({ sublistId: 'allocationdestination' });
                    for (var i = 0; i < destCount; i++) {
                        var accId = allocRec.getSublistValue({ sublistId: 'allocationdestination', fieldId: 'account', line: i });
                        usedDestAccounts.push(String(accId));
                    }
                } catch(e) {
                    log.error('Error loading existing allocation schedule ' + allocId, e);
                }
            });
        }

        // 2. Filter mapping untuk mencari Pasangan Akun yang BELUM ter-create
        var missingMappings = masterMappings.filter(function(mapping) {
            return usedDestAccounts.indexOf(String(mapping.destination)) === -1;
        });

        log.debug('Missing Mappings to Create', missingMappings);

        // Jika ternyata semuanya sudah lengkap, hentikan proses untuk menghemat resource
        if (missingMappings.length === 0) {
            log.debug('Status', 'Semua Allocation Schedule dari mapping sudah ter-create.');
            return;
        }

        // 3. Dapatkan nama akun untuk destination yang belum ter-create saja melalui Saved Search
        var missingDestIds = missingMappings.map(function(m) { return m.destination; });
        var accountNames = {};

        var accountSearch = search.create({
            type: search.Type.ACCOUNT,
            filters: [
                ['internalid', 'anyof', missingDestIds]
            ],
            columns: [
                'internalid',
                'number'
            ]
        });

        accountSearch.run().each(function(result) {
            var id = result.getValue('internalid');
            var acctname = result.getValue('number');
            accountNames[id] = acctname;
            return true;
        });

        var newAllocationIds = [];
        missingMappings.forEach(function(mapping) {
            var accDesId = mapping.destination;
            var accountSouc = mapping.source;

            var acctnameFull = accountNames[accDesId] || '';
            var accountName = acctnameFull.split(':').pop().trim();
            var recName = accountName + " - " + fullName;

            log.debug('Creating missing allocation', 'Name: ' + recName);

            var recCreate = record.create({
                type : "allocationschedule",
                isDynamic: true
            });
            
            recCreate.setValue({ fieldId : "name", value : recName });
            recCreate.setValue({ fieldId : "frequency", value : "RUNBYBATCH" });
            recCreate.setValue({ fieldId : "remindforever", value : "T" });
            recCreate.setValue({ fieldId : "allocationmode", value : "DYNAMIC" });
            recCreate.setValue({ fieldId : "weightsource", value : 723 });
            recCreate.setValue({ fieldId : "datebasis", value : "PTD" });
            recCreate.setValue({ fieldId : "unit", value : 1 });
            
            // --- Source Tab ---
            recCreate.selectNewLine({ sublistId : "allocationsource" });
            recCreate.setCurrentSublistValue({ sublistId : "allocationsource", fieldId : "account", value : accountSouc });
            recCreate.setCurrentSublistValue({ sublistId : "allocationsource", fieldId : "entity", value : idRec });
            recCreate.setCurrentSublistValue({ sublistId : "allocationsource", fieldId : "class", value : "114" });
            recCreate.setCurrentSublistValue({ sublistId : "allocationsource", fieldId : "department", value : 3 });
            recCreate.setCurrentSublistValue({ sublistId : "allocationsource", fieldId : "cseg1", value : "2" });
            recCreate.setCurrentSublistValue({ sublistId : "allocationsource", fieldId : "cseg_stc_sof", value : "66" });
            recCreate.setCurrentSublistValue({ sublistId : "allocationsource", fieldId : "location", value : "-1" });
            recCreate.commitLine({ sublistId: "allocationsource" });

            // --- Destination Tab ---
            recCreate.selectNewLine({ sublistId : "allocationdestination" });
            recCreate.setCurrentSublistValue({ sublistId : "allocationdestination", fieldId : "account", value : accDesId });
            recCreate.setCurrentSublistValue({ sublistId : "allocationdestination", fieldId : "department", value : costCenter });
            recCreate.setCurrentSublistValue({ sublistId : "allocationdestination", fieldId : "entity", value : idRec });
            recCreate.setCurrentSublistValue({ sublistId : "allocationdestination", fieldId : "class", value : "0" });
            recCreate.setCurrentSublistValue({ sublistId : "allocationdestination", fieldId : "cseg_stc_sof", value : "0" });
            recCreate.setCurrentSublistValue({ sublistId : "allocationdestination", fieldId : "cseg1", value : "2" });
            recCreate.setCurrentSublistValue({ sublistId : "allocationdestination", fieldId : "cseg_stc_drc_segmen", value : "0" });
            recCreate.setCurrentSublistValue({ sublistId : "allocationdestination", fieldId : "cseg_stc_segmentdea", value : "0" });
            recCreate.commitLine({ sublistId: "allocationdestination" });

            var recId = recCreate.save();
            if (recId) {
                newAllocationIds.push(recId);
            }
        });

        if (newAllocationIds.length > 0) {
            var combinedIds = currentLinks.concat(newAllocationIds);
            
            log.debug('Updating Employee with Total IDs', combinedIds);
            
            recLoad.setValue({
                fieldId : "custentity_stc_link_to_allocation_schdl",
                value : combinedIds
            });
            recLoad.save();
        }
    }

    return {
        afterSubmit : afterSubmit
    };
});