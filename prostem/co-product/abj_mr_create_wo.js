/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @author NetSuite Developer
 * @description Map/Reduce untuk memproses WOC, mencari Co-Product, dan melakukan Upsert WO, WO Issue, & WOC menggunakan auto-assign ketersediaan Lot yang aman untuk Dynamic Mode (Urutan Pengisian Field Diperbaiki + Validasi Use Bins).
 */
define(['N/record', 'N/search', 'N/runtime'], 
    (record, search, runtime) => {

    const getInputData = (inputContext) => {
        try {
            const currentScript = runtime.getCurrentScript();
            const wocId = currentScript.getParameter({ name: 'custscript_abj_woc_id' });
            
            if (!wocId) {
                log.error('Missing Parameter', 'Work Order Completion ID is missing.');
                return [];
            }

            const wocRecord = record.load({
                type: record.Type.WORK_ORDER_COMPLETION,
                id: wocId
            });

            const originalWoId = wocRecord.getValue({ fieldId: 'createdfrom' });
            const assemblyItemId = wocRecord.getValue({ fieldId: 'item' });

            const coProducts = getCoProducts(assemblyItemId);
            if (coProducts.length === 0) return [];

            const wocSublistData = getWocSublistData(wocRecord);
            const finalMapping = mappingCoProductsWithSublist(coProducts, wocSublistData);
            
            const mapData = finalMapping.map(data => ({
                wocId: wocId,
                originalWoId: originalWoId,
                item: data.item,
                qtyPerLot: data.qtyPerLot,      
                snLot: data.snLot,              
                snBalance: data.snBalance        
            }));

            log.debug('GetInputData Result', mapData);
            return mapData;

        } catch (error) {
            log.error('Error in getInputData', error);
            return [];
        }
    };

    const map = (mapContext) => {
        try {
            const data = JSON.parse(mapContext.value);
            log.debug('Processing in Map', data);

            const existingWoId = searchExistingWO(data.originalWoId, data.item);
            const newWoId = upsertWorkOrder(data, existingWoId);

            if (newWoId) {
                log.audit(existingWoId ? 'Work Order Updated' : 'Work Order Created', `WO ID: ${newWoId} for Item: ${data.item}`);
                
                const origWoIssueId = getOriginalWoIssueId(data.originalWoId);
                if (origWoIssueId) {
                    const existingIssueId = searchExistingWoIssue(newWoId);
                    const newWoIssueId = upsertWorkOrderIssue(newWoId, origWoIssueId, existingIssueId);
                    if (newWoIssueId) {
                        log.audit(existingIssueId ? 'Work Order Issue Updated' : 'Work Order Issue Created', `Issue ID: ${newWoIssueId} linked to WO: ${newWoId}`);
                    }
                }

                const existingWocId = searchExistingWoc(newWoId);
                const newWocId = upsertWorkOrderCompletion(newWoId, data, existingWocId);
                log.audit(existingWocId ? 'Work Order Completion Updated' : 'Work Order Completion Created', `WOC ID: ${newWocId} linked to WO: ${newWoId}`);
                
                mapContext.write({ key: data.wocId, value: newWoId });
            }
        } catch (error) {
            log.error('Error in map', error);
        }
    };

    const reduce = (reduceContext) => {
        try {
            const wocId = reduceContext.key;
            const newlyCreatedWoIds = reduceContext.values;
            log.debug(`Finished Processing WOC ID: ${wocId}`, `Linked Records: ${newlyCreatedWoIds}`);
        } catch (error) {
            log.error('Error in reduce', error);
        }
    };

    const summarize = (summaryContext) => {
        log.audit('Map/Reduce Script Completed', `Total Seconds: ${summaryContext.seconds}`);
    };

    // =========================================================================================
    // HELPER FUNCTIONS
    // =========================================================================================

    const getCoProducts = (assemblyItemId) => {
        const coProducts = [];
        search.create({
            type: "customrecord_abj_pdt_config_co_product",
            filters: [["custrecord_abj_pdt_assembly_item_link", "anyof", assemblyItemId]],
            columns: [search.createColumn({name: "custrecord_abj_pdt_co_product", label: "Co-Product"})]
        }).run().each(result => {
            coProducts.push(result.getValue('custrecord_abj_pdt_co_product'));
            return true;
        });
        return coProducts;
    };

    const getWocSublistData = (wocRecord) => {
        const sublistData = [];
        const lineCount = wocRecord.getLineCount({ sublistId: 'recmachcustrecord_pdt_link_wo_completion' });
        for (let i = 0; i < lineCount; i++) {
            sublistData.push({
                item: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_pdt_item_result', line: i }),
                qtyPerLot: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_abj_pdt_qty_per_lot', line: i }),
                snLot: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_abj_pdt_sn_lot', line: i }),
                snBalance: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_abj_pdt_sn_balance_co_prod', line: i })
            });
        }
        return sublistData;
    };

    const mappingCoProductsWithSublist = (searchResultItems, sublistData) => {
        const finalData = [];
        searchResultItems.forEach(searchItem => {
            const match = sublistData.find(sub => sub.item == searchItem); 
            if (match) finalData.push({ ...match, item: searchItem });
        });
        return finalData;
    };

    const getActiveBomData = (itemId) => {
        const itemRec = record.load({ type: record.Type.LOT_NUMBERED_ASSEMBLY_ITEM, id: itemId });
        const lineCount = itemRec.getLineCount({ sublistId: 'billofmaterials' });
        let selectedBom = null;
        let latestDate = null;

        for (let i = 0; i < lineCount; i++) {
            const startDate = itemRec.getSublistValue({ sublistId: 'billofmaterials', fieldId: 'effectivestartdate', line: i });
            const bomId = itemRec.getSublistValue({ sublistId: 'billofmaterials', fieldId: 'billofmaterials', line: i });
            const currentRevName = itemRec.getSublistValue({ sublistId: 'billofmaterials', fieldId: 'currentrevision', line: i });

            if (!latestDate || (startDate && startDate > latestDate)) {
                latestDate = startDate;
                let bomRevisionId = null;
                if (bomId && currentRevName) {
                    search.create({
                        type: "bomrevision",
                        filters: [["billofmaterials", "anyof", bomId], "AND", ["name", "is", currentRevName]],
                        columns: ["internalid"]
                    }).run().each(res => { bomRevisionId = res.getValue("internalid"); return false; });
                }
                selectedBom = { billofmaterials: bomId, currentrevision: bomRevisionId, effectivestartdate: startDate };
            }
        }
        return selectedBom;
    };

    const searchExistingWO = (originalWoId, itemId) => {
        let existingId = null;
        search.create({
            type: "workorder",
            settings: [{"name": "consolidationtype", "value": "ACCTTYPE"}],
            filters: [
                ["type", "anyof", "WorkOrd"], "AND",
                ["custbody_abj_pdt_link_identifier", "anyof", originalWoId], "AND",
                ["item", "anyof", itemId], "AND", ["mainline", "is", "T"] 
            ],
            columns: ["internalid"]
        }).run().each(res => { existingId = res.getValue("internalid"); return false; });
        return existingId;
    };

    const searchExistingWoIssue = (createdFromId) => {
        let issueId = null;
        search.create({
            type: "workorderissue",
            filters: [["type", "anyof", "WOIssue"], "AND", ["createdfrom", "anyof", createdFromId], "AND", ["mainline", "is", "T"]],
            columns: ["internalid"]
        }).run().each(res => { issueId = res.getValue("internalid"); return false; });
        return issueId;
    };

    const searchExistingWoc = (createdFromId) => {
        let wocId = null;
        search.create({
            type: "workordercompletion",
            filters: [["type", "anyof", "WOCmpl"], "AND", ["createdfrom", "anyof", createdFromId], "AND", ["mainline", "is", "T"]],
            columns: ["internalid"]
        }).run().each(res => { wocId = res.getValue("internalid"); return false; });
        return wocId;
    };

    const getOriginalWoIssueId = (originalWoId) => {
        let issueId = null;
        search.create({
            type: "workorderissue",
            settings: [{"name": "consolidationtype", "value": "ACCTTYPE"}],
            filters: [["type", "anyof", "WOIssue"], "AND", ["createdfrom", "anyof", originalWoId], "AND", ["mainline", "is", "T"]],
            columns: ["internalid"]
        }).run().each(res => { issueId = res.getValue("internalid"); return false; });
        return issueId;
    };

    const upsertWorkOrder = (data, existingWoId) => {
        const { originalWoId, item } = data;
        const originalWo = record.load({ type: record.Type.WORK_ORDER, id: originalWoId });
        const bomData = getActiveBomData(item);

        let newWo = existingWoId ? record.load({ type: record.Type.WORK_ORDER, id: existingWoId, isDynamic: true }) : record.create({ type: record.Type.WORK_ORDER, isDynamic: true });

        newWo.setValue({ fieldId: 'subsidiary', value: originalWo.getValue('subsidiary') });
        newWo.setValue({ fieldId: 'assemblyitem', value: item }); 
        newWo.setValue({ fieldId: 'custbody_abj_pdt_link_identifier', value: originalWoId });

        const origLocation = originalWo.getValue('location');
        if (origLocation) newWo.setValue({ fieldId: 'location', value: origLocation });

        if (bomData) {
            newWo.setValue({ fieldId: 'billofmaterials', value: bomData.billofmaterials });
            newWo.setValue({ fieldId: 'billofmaterialsrevision', value: bomData.currentrevision });
        }

        newWo.setValue({ fieldId: 'iswip', value: true });
        newWo.setValue({ fieldId: 'firmed', value: true });
        newWo.setValue({ fieldId: 'quantity', value: originalWo.getValue('quantity') });
        newWo.setValue({ fieldId: 'custbody_mfgmob_worealtime', value: true });

        if (existingWoId) {
            const currentLineCount = newWo.getLineCount({ sublistId: 'item' });
            const origLineCount = originalWo.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < currentLineCount; i++) {
                try{
                    newWo.selectLine({ sublistId: 'item', line: i });
                    let currentItem = newWo.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                    let matchOrigLine = -1;
                    for (let j = 0; j < origLineCount; j++) {
                        if (originalWo.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j }) == currentItem) {
                            matchOrigLine = j; break;
                        }
                    }
                    if (matchOrigLine !== -1) {
                        let origInitialQty = originalWo.getSublistValue({ sublistId: 'item', fieldId: 'custcol_abj_pdt_initial_qty', line: matchOrigLine }) || 0;
                        newWo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: parseFloat(origInitialQty) });
                    }
                    newWo.commitLine({ sublistId: 'item' });
                }catch(e){
                    log.debug('error', e)
                }
                
            }
        } else {
            newWo.setValue({ fieldId: 'startdate', value: new Date() });
            newWo.setValue({ fieldId: 'trandate', value: new Date() });

            while (newWo.getLineCount({ sublistId: 'item' }) > 0) newWo.removeLine({ sublistId: 'item', line: 0 });

            const origLineCount = originalWo.getLineCount({ sublistId: 'item' });
            for (let i = 0; i < origLineCount; i++) {
                let origAssemblyLevel = originalWo.getSublistValue({ sublistId: 'item', fieldId: 'assemblylevel', line: i });
                let origItem = originalWo.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                let origInitialQty = originalWo.getSublistValue({ sublistId: 'item', fieldId: 'custcol_abj_pdt_initial_qty', line: i }) || 0;

                newWo.selectNewLine({ sublistId: 'item' });
                newWo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: origItem });
                newWo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: parseFloat(origInitialQty) });
                try { newWo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'assemblylevel', value: origAssemblyLevel }); } catch (e) {}
                newWo.commitLine({ sublistId: 'item' });
            }
        }
        return newWo.save();
    };

    /**
     * MENDAPATKAN LOT YANG TERSEDIA
     */
    const getAvailableLots = (itemId, locationId) => {
        const availableLots = [];
        search.create({
            type: "inventorybalance",
            filters: [
                ["item", "anyof", itemId], "AND",
                ["location", "anyof", locationId], "AND",
                ["available", "greaterthan", "0"]
            ],
            columns: ["inventorynumber", "binnumber", "status", "available"]
        }).run().each(result => {
            availableLots.push({
                invNumber: result.getValue("inventorynumber"),
                binNumber: result.getValue("binnumber"),
                invStatus: result.getValue("status"),
                availableQty: parseFloat(result.getValue("available"))
            });
            return true;
        });
        return availableLots;
    };

    /**
     * LOGIKA BARU: UPSERT WORK ORDER ISSUE
     */
    const upsertWorkOrderIssue = (newWoId, origWoIssueId, existingIssueId) => {
        const origWoIssue = record.load({ type: record.Type.WORK_ORDER_ISSUE, id: origWoIssueId });
        const newWo = record.load({ type: record.Type.WORK_ORDER, id: newWoId });

        let newWoIssue = existingIssueId 
            ? record.load({ type: record.Type.WORK_ORDER_ISSUE, id: existingIssueId, isDynamic: true })
            : record.transform({ fromType: record.Type.WORK_ORDER, fromId: newWoId, toType: record.Type.WORK_ORDER_ISSUE, isDynamic: true });

        const locationId = newWo.getValue('location');
        newWoIssue.setValue({ fieldId: 'subsidiary', value: newWo.getValue('subsidiary') });
        newWoIssue.setValue({ fieldId: 'location', value: locationId });
        newWoIssue.setValue({ fieldId: 'item', value: newWo.getValue('assemblyitem') }); 
        
        if (newWo.getValue('billofmaterials')) newWoIssue.setValue({ fieldId: 'billofmaterials', value: newWo.getValue('billofmaterials') });
        if (newWo.getValue('billofmaterialsrevision')) newWoIssue.setValue({ fieldId: 'billofmaterialsrevision', value: newWo.getValue('billofmaterialsrevision') });
        if (newWo.getValue('manufacturingrouting')) newWoIssue.setValue({ fieldId: 'manufacturingrouting', value: newWo.getValue('manufacturingrouting') });
        newWoIssue.setValue({ fieldId: 'trandate', value: newWo.getValue('trandate') });

        const existingLineCount = newWoIssue.getLineCount({ sublistId: 'component' });
        const origLineCount = origWoIssue.getLineCount({ sublistId: 'component' });
        let hasValidLines = false;

        for (let i = 0; i < existingLineCount; i++) {
            newWoIssue.selectLine({ sublistId: 'component', line: i });
            let currentItem = newWoIssue.getCurrentSublistValue({ sublistId: 'component', fieldId: 'item' });
            
            let matchOrigLine = -1;
            for (let j = 0; j < origLineCount; j++) {
                if (origWoIssue.getSublistValue({ sublistId: 'component', fieldId: 'item', line: j }) == currentItem) {
                    matchOrigLine = j; break;
                }
            }

            let requestedQty = 0;
            if (matchOrigLine !== -1) {
                requestedQty = parseFloat(origWoIssue.getSublistValue({ sublistId: 'component', fieldId: 'quantity', line: matchOrigLine }) || 0);
            }

            if (requestedQty > 0) {
                hasValidLines = true;
                let origHasDetail = origWoIssue.hasSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail', line: matchOrigLine });
                
                let qtyToSet = requestedQty;
                let lotsToAssign = [];

                if (origHasDetail) {
                    // --- TAMBAHAN LOGIKA PENGECEKAN USE BINS ---
                    let isUseBins = false;
                    try {
                        const itemLookup = search.lookupFields({
                            type: search.Type.ITEM,
                            id: currentItem,
                            columns: ['usebins']
                        });
                        isUseBins = itemLookup.usebins === true || itemLookup.usebins === 'T';
                    } catch (e) {
                        log.debug('Gagal lookup usebins untuk item ' + currentItem, e.message);
                    }

                    let availableLots = getAvailableLots(currentItem, locationId);

                    // Jika item disetting usebins = true, filter lot yang memiliki binnumber
                    if (isUseBins) {
                        availableLots = availableLots.filter(lot => lot.binNumber);
                    }
                    // -------------------------------------------

                    let remainingNeeded = requestedQty;
                    let totalAvailableFound = 0;

                    for (let lot of availableLots) {
                        if (remainingNeeded <= 0) break;
                        let takeQty = Math.min(lot.availableQty, remainingNeeded);
                        lotsToAssign.push({ ...lot, qtyToUse: takeQty });
                        totalAvailableFound += takeQty;
                        remainingNeeded -= takeQty;
                    }

                    if (totalAvailableFound < requestedQty) {
                        log.audit(`Stok Kurang untuk Item ${currentItem}`, `Kebutuhan ${requestedQty}, tapi stok tersedia hanya ${totalAvailableFound}. Line quantity akan disesuaikan otomatis.`);
                        qtyToSet = parseFloat(totalAvailableFound.toFixed(5));
                    }
                }

                if (qtyToSet > 0) {
                    newWoIssue.setCurrentSublistValue({ sublistId: 'component', fieldId: 'quantity', value: qtyToSet });

                    if (origHasDetail && lotsToAssign.length > 0) {
                        try {
                            let newDetail = newWoIssue.getCurrentSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail' });
                            
                            while (newDetail.getLineCount({ sublistId: 'inventoryassignment' }) > 0) {
                                newDetail.removeLine({ sublistId: 'inventoryassignment', line: 0 });
                            }

                            for (let lot of lotsToAssign) {
                                log.debug('lot assigned', lot)
                                newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                                if (lot.invNumber) {
                                    newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: lot.invNumber });
                                }
                                
                                if (lot.binNumber) {
                                    newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: lot.binNumber });
                                }
                                
                                if (lot.invStatus) {
                                    newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: lot.invStatus });
                                }
                                
                                // 4. Set Qty sebagai penutup baris
                                newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: lot.qtyToUse });
                                
                                newDetail.commitLine({ sublistId: 'inventoryassignment' });
                            }
                        } catch (e) {
                            log.error(`Gagal mengisi detail untuk Item ${currentItem}`, e.message);
                            throw new Error(`Inventory detail gagal dibuat. Penyebab: ${e.message}`);
                        }
                    }
                } else {
                    newWoIssue.setCurrentSublistValue({ sublistId: 'component', fieldId: 'quantity', value: 0 });
                }
            } else {
                newWoIssue.setCurrentSublistValue({ sublistId: 'component', fieldId: 'quantity', value: 0 });
            }

            newWoIssue.commitLine({ sublistId: 'component' });
        }

        if (!hasValidLines) {
            log.audit('Skip WO Issue', `Dibatalkan karena seluruh komponen = 0. WO ID: ${newWoId}`);
            return null; 
        }

        return newWoIssue.save();
    };

    const setWocInventoryDetail = (objRecord) => {
        let totalQty = parseFloat(objRecord.getValue({ fieldId: 'completedquantity' }) || 0);
        if (totalQty <= 0) return;

        let invDetail = objRecord.getSubrecord({ fieldId: 'inventorydetail' });
        while (invDetail.getLineCount({ sublistId: 'inventoryassignment' }) > 0) {
            invDetail.removeLine({ sublistId: 'inventoryassignment', line: 0 });
        }

        invDetail.selectNewLine({ sublistId: 'inventoryassignment' });
        invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: 'Lot-1' }); 
        invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: totalQty });
        invDetail.commitLine({ sublistId: 'inventoryassignment' });
    };

    const upsertWorkOrderCompletion = (newWoId, data, existingWocId) => {
        const newWo = record.load({ type: record.Type.WORK_ORDER, id: newWoId });
        let newWoc = existingWocId 
            ? record.load({ type: record.Type.WORK_ORDER_COMPLETION, id: existingWocId, isDynamic: true }) 
            : record.transform({ fromType: record.Type.WORK_ORDER, fromId: newWoId, toType: record.Type.WORK_ORDER_COMPLETION, isDynamic: true });

        newWoc.setValue({ fieldId: 'trandate', value: newWo.getValue('trandate') });

        let totalCompletedQty = 0;
        if (data.qtyPerLot) {
            data.qtyPerLot.split('|').forEach(q => {
                let parsedQ = parseFloat(q);
                if (!isNaN(parsedQ) && parsedQ > 0) totalCompletedQty += parsedQ;
            });
        }
        newWoc.setValue({ fieldId: 'completedquantity', value: totalCompletedQty > 0 ? totalCompletedQty : newWo.getValue('quantity') });

        if (data.qtyPerLot) newWoc.setValue({ fieldId: 'custbody_abj_pdt_qty_per_lot_woc', value: data.qtyPerLot });
        if (data.snLot) newWoc.setValue({ fieldId: 'custbody_abj_pdt_sn_main_prod_woc', value: data.snLot });
        if (data.snBalance) newWoc.setValue({ fieldId: 'custbody_pdt_sn_balance_main_prod_woc', value: data.snBalance });

        const startOpField = newWoc.getField({ fieldId: 'startoperation' });
        if (startOpField) {
            const validOptions = startOpField.getSelectOptions().filter(opt => opt.value !== "");
            if (validOptions.length > 0) {
                newWoc.setValue({ fieldId: 'startoperation', value: validOptions[0].value });
                newWoc.setValue({ fieldId: 'endoperation', value: validOptions[validOptions.length - 1].value });
            }
        }

        const opLineCount = newWoc.getLineCount({ sublistId: 'operation' });
        for (let i = 0; i < opLineCount; i++) {
            newWoc.selectLine({ sublistId: 'operation', line: i });
            let mRes = parseFloat(newWoc.getCurrentSublistValue({ sublistId: 'operation', fieldId: 'machineresources' }) || 0);
            let lRes = parseFloat(newWoc.getCurrentSublistValue({ sublistId: 'operation', fieldId: 'laborresources' }) || 0);
            newWoc.setCurrentSublistValue({ sublistId: 'operation', fieldId: 'machineresources', value: mRes });
            newWoc.setCurrentSublistValue({ sublistId: 'operation', fieldId: 'laborresources', value: lRes });
            newWoc.commitLine({ sublistId: 'operation' });
        }

        setWocInventoryDetail(newWoc);
        return newWoc.save();
    };

    return { getInputData, map, reduce, summarize };
});