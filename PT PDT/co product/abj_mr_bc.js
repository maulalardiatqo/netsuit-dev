/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @author NetSuite Developer
 * @description Map/Reduce untuk memproses WOC, mencari Co-Product, menghitung persentase, melakukan Upsert WO, WO Issue, & WOC, serta Create Inv Adjustment (dengan Inv Detail).
 */
define(['N/record', 'N/search', 'N/runtime'], 
    (record, search, runtime) => {

    /**
     * TAHAP 1: Get Input Data
     */
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

            // 1. Dapatkan hasil Saved Search Co-Product
            const coProducts = getCoProducts(assemblyItemId);

            // Ambil header info WOC yang dibutuhkan untuk Inventory Adjustment
            const wocHeaderInfo = {
                subsidiary: wocRecord.getValue('subsidiary'),
                class: wocRecord.getValue('class'),
                location: wocRecord.getValue('location'),
                department: wocRecord.getValue('department') || 16,
                trandate: wocRecord.getValue('trandate')
            };

            // 2. Dapatkan data sublist dari WOC 
            const wocSublistData = getWocSublistData(wocRecord);

            // 3. Kategorikan Data 
            const mapData = categorizeProcessData(coProducts, wocSublistData, wocId, originalWoId, wocHeaderInfo);

            log.debug('GetInputData Result', mapData);
            return mapData;

        } catch (error) {
            log.error('Error in getInputData', error);
            return [];
        }
    };

    /**
     * TAHAP 2: Map
     */
    const map = (mapContext) => {
        try {
            const data = JSON.parse(mapContext.value);
            log.debug('Processing in Map', data);

            let createdTransactionId = null;

            if (data.processType === 'WO') {
                const existingWoId = searchExistingWO(data.originalWoId, data.item);
                const newWoId = upsertWorkOrder(data, existingWoId);

                if (newWoId) {
                    createdTransactionId = newWoId; 
                    log.audit(existingWoId ? 'Work Order Updated' : 'Work Order Created', `WO ID: ${newWoId} for Item: ${data.item}`);
                    
                    const origWoIssueId = getOriginalWoIssueId(data.originalWoId);
                    if (origWoIssueId) {
                        const existingIssueId = searchExistingWoIssue(newWoId);
                        const newWoIssueId = upsertWorkOrderIssue(newWoId, origWoIssueId, data.prosent, existingIssueId);
                        if (newWoIssueId) {
                            log.audit(existingIssueId ? 'Work Order Issue Updated' : 'Work Order Issue Created', `Issue ID: ${newWoIssueId} linked to WO: ${newWoId}`);
                        }
                    }

                    const existingWocId = searchExistingWoc(newWoId);
                    const newWocId = upsertWorkOrderCompletion(newWoId, data, existingWocId);
                    log.audit(existingWocId ? 'Work Order Completion Updated' : 'Work Order Completion Created', `WOC ID: ${newWocId} linked to WO: ${newWoId}`);
                }
            } 
            else if (data.processType === 'IA') {
                createdTransactionId = createInvAdjustment(data);
                log.audit('Inventory Adjustment Created', `IA ID: ${createdTransactionId} for Item: ${data.item}`);
            }

            // Oper data ke reduce untuk proses update sublist master WOC
            if (createdTransactionId) {
                mapContext.write({
                    key: data.wocId,
                    value: JSON.stringify({
                        lineIndex: data.lineIndex,
                        createdTxId: createdTransactionId
                    })
                });
            }

        } catch (error) {
            log.error('Error in map', error);
        }
    };

    /**
     * TAHAP 3: Reduce
     */
    const reduce = (reduceContext) => {
        try {
            const wocId = reduceContext.key;
            const linkResults = reduceContext.values.map(val => JSON.parse(val));
            
            log.debug(`Updating Link for WOC ID: ${wocId}`, linkResults);

            const wocRec = record.load({
                type: record.Type.WORK_ORDER_COMPLETION,
                id: wocId,
                isDynamic: false 
            });

            let isUpdated = false;

            linkResults.forEach(res => {
                if (res.createdTxId && res.lineIndex !== undefined) {
                    wocRec.setSublistValue({
                        sublistId: 'recmachcustrecord_pdt_link_wo_completion',
                        fieldId: 'custrecord_pdt_link_transaction',
                        line: res.lineIndex,
                        value: res.createdTxId
                    });
                    isUpdated = true;
                }
            });

            if (isUpdated) {
                wocRec.save();
                log.audit('Success Link Transaction', `WOC Sublist updated for WOC ID: ${wocId}`);
            }

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

    /**
     * ENHANCEMENT: Pembuatan Inventory Adjustment beserta konfig Inventory Detail
     */
    const createInvAdjustment = (data) => {
        const { originalWoId, item, qtyResult, headerInfo } = data;

        const iaRec = record.create({
            type: record.Type.INVENTORY_ADJUSTMENT,
            isDynamic: true
        });

        // 1. Mapping Header
        iaRec.setValue({ fieldId: 'customform', value: 109 });
        iaRec.setValue({ fieldId: 'subsidiary', value: headerInfo.subsidiary });
        if (headerInfo.class) {
            iaRec.setValue({ fieldId: 'class', value: headerInfo.class });
        }
        iaRec.setValue({ fieldId: 'adjlocation', value: headerInfo.location });
        iaRec.setValue({ fieldId: 'department', value: headerInfo.department });
        
        if (headerInfo.trandate) {
            iaRec.setValue({ fieldId: 'trandate', value: new Date(headerInfo.trandate) });
        }
        
        iaRec.setValue({ fieldId: 'custbody_abj_pdt_adjustment_type', value: 4 });
        iaRec.setValue({ fieldId: 'account', value: 156 });
        iaRec.setValue({ fieldId: 'custbody_abj_pdt_link_identifier', value: originalWoId });

        // 2. Dapatkan Item Code (itemid) untuk Lot Number
        let itemCode = '';
        try {
            const itemLookup = search.lookupFields({
                type: search.Type.ITEM,
                id: item,
                columns: ['itemid']
            });
            itemCode = itemLookup.itemid || item;
        } catch (e) {
            log.error('Error lookup item', e.message);
            itemCode = item; // Fallback jika gagal lookup
        }

        const formattedLotNumber = `invadj/${itemCode}/1`;

        // 3. Mapping Sublist Inventory
        iaRec.selectNewLine({ sublistId: 'inventory' });
        iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item });
        iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: headerInfo.location });
        iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: qtyResult });
        iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: 0 });
        
        try {
            iaRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitconversionrate', value: 1 });
        } catch (e) { }

        // 4. Konfigurasi Inventory Detail (Subrecord)
        try {
            const invDetail = iaRec.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
            
            invDetail.selectNewLine({ sublistId: 'inventoryassignment' });
            
            // receiptinventorynumber digunakan untuk generate lot number baru masuk
            invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: formattedLotNumber });
            invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: qtyResult });
            invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 2 });
            
            invDetail.commitLine({ sublistId: 'inventoryassignment' });
        } catch (e) {
            log.error('Error setting Inventory Detail on IA', e.message);
        }

        // Commit Line Inventory utama
        iaRec.commitLine({ sublistId: 'inventory' });

        return iaRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
    };

    const getWocSublistData = (wocRecord) => {
        const sublistData = [];
        const lineCount = wocRecord.getLineCount({ sublistId: 'recmachcustrecord_pdt_link_wo_completion' });
        
        for (let i = 0; i < lineCount; i++) {
            sublistData.push({
                lineIndex: i, 
                item: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_pdt_item_result', line: i }),
                prosent: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_abj_pdt_actual_percent_prorat', line: i }),
                qtyPerLot: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_abj_pdt_qty_per_lot', line: i }),
                snLot: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_abj_pdt_sn_lot', line: i }),
                snBalance: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_abj_pdt_sn_balance_co_prod', line: i }),
                qtyResult: wocRecord.getSublistValue({ sublistId: 'recmachcustrecord_pdt_link_wo_completion', fieldId: 'custrecord_pdt_qty_result', line: i })
            });
        }
        return sublistData;
    };

    const categorizeProcessData = (coProducts, wocSublistData, wocId, originalWoId, headerInfo) => {
        const finalData = [];
        
        wocSublistData.forEach(sub => {
            if (!sub.item) return;

            const strProsent = sub.prosent ? sub.prosent.toString().replace('%', '').trim() : "0";
            const parsedProsent = parseFloat(strProsent);
            const parsedQtyResult = parseFloat(sub.qtyResult || 0);

            const isCoProduct = coProducts.includes(sub.item);

            if (isCoProduct && !isNaN(parsedProsent) && parsedProsent > 0) {
                finalData.push({
                    processType: 'WO',
                    wocId: wocId,
                    originalWoId: originalWoId,
                    lineIndex: sub.lineIndex,
                    item: sub.item,
                    prosent: parsedProsent,
                    qtyPerLot: sub.qtyPerLot,
                    snLot: sub.snLot,
                    snBalance: sub.snBalance
                });
            } 
            else if ((isNaN(parsedProsent) || parsedProsent === 0) && parsedQtyResult > 0) {
                finalData.push({
                    processType: 'IA',
                    wocId: wocId,
                    originalWoId: originalWoId,
                    lineIndex: sub.lineIndex,
                    item: sub.item,
                    qtyResult: parsedQtyResult,
                    headerInfo: headerInfo
                });
            }
        });

        return finalData;
    };

    const getCoProducts = (assemblyItemId) => {
        const coProducts = [];
        const customSearch = search.create({
            type: "customrecord_abj_pdt_config_co_product",
            filters: [
                ["custrecord_abj_pdt_assembly_item_link", "anyof", assemblyItemId], 
                "AND", 
                ["custrecord_abj_pdt_material_cost_factor", "greaterthan", "0"]
            ],
            columns: [ search.createColumn({name: "custrecord_abj_pdt_co_product", label: "Co-Product"}) ]
        });

        customSearch.run().each(result => {
            coProducts.push(result.getValue('custrecord_abj_pdt_co_product'));
            return true;
        });
        return coProducts;
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
                    const bomRevSearch = search.create({
                        type: "bomrevision",
                        filters: [
                            ["billofmaterials", "anyof", bomId], "AND",
                            ["name", "is", currentRevName]
                        ],
                        columns: ["internalid"]
                    });
                    bomRevSearch.run().each(res => {
                        bomRevisionId = res.getValue("internalid");
                        return false; 
                    });
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
                ["item", "anyof", itemId], "AND", 
                ["mainline", "is", "T"] 
            ],
            columns: ["internalid"]
        }).run().each(result => { existingId = result.getValue("internalid"); return false; });
        return existingId;
    };

    const searchExistingWoIssue = (createdFromId) => {
        let issueId = null;
        search.create({
            type: "workorderissue",
            filters: [
                ["type", "anyof", "WOIssue"], "AND",
                ["createdfrom", "anyof", createdFromId], "AND",
                ["mainline", "is", "T"]
            ],
            columns: ["internalid"]
        }).run().each(result => { issueId = result.getValue("internalid"); return false; });
        return issueId;
    };

    const searchExistingWoc = (createdFromId) => {
        let wocId = null;
        search.create({
            type: "workordercompletion",
            filters: [
                ["type", "anyof", "WOCmpl"], "AND",
                ["createdfrom", "anyof", createdFromId], "AND", 
                ["mainline", "is", "T"]
            ],
            columns: ["internalid"]
        }).run().each(result => { wocId = result.getValue("internalid"); return false; });
        return wocId;
    };

    const upsertWorkOrder = (data, existingWoId) => {
        const { originalWoId, item, prosent } = data;
        const originalWo = record.load({ type: record.Type.WORK_ORDER, id: originalWoId });
        const bomData = getActiveBomData(item);

        let newWo = existingWoId 
            ? record.load({ type: record.Type.WORK_ORDER, id: existingWoId, isDynamic: true })
            : record.create({ type: record.Type.WORK_ORDER, isDynamic: true });

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
                newWo.selectLine({ sublistId: 'item', line: i });
                let currentItem = newWo.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });

                let matchOrigLine = -1;
                for (let j = 0; j < origLineCount; j++) {
                    if (originalWo.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j }) == currentItem) {
                        matchOrigLine = j;
                        break;
                    }
                }

                if (matchOrigLine !== -1) {
                    let origInitialQty = originalWo.getSublistValue({ sublistId: 'item', fieldId: 'custcol_abj_pdt_initial_qty', line: matchOrigLine }) || 0;
                    let calculatedQty = (parseFloat(origInitialQty) * prosent) / 100;
                    newWo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: calculatedQty });
                }
                newWo.commitLine({ sublistId: 'item' });
            }
        } else {
            newWo.setValue({ fieldId: 'startdate', value: new Date() });
            newWo.setValue({ fieldId: 'trandate', value: new Date() });

            const currentLineCount = newWo.getLineCount({ sublistId: 'item' });
            for (let i = currentLineCount - 1; i >= 0; i--) {
                newWo.removeLine({ sublistId: 'item', line: i });
            }

            const origLineCount = originalWo.getLineCount({ sublistId: 'item' });
            for (let i = 0; i < origLineCount; i++) {
                let origAssemblyLevel = originalWo.getSublistValue({ sublistId: 'item', fieldId: 'assemblylevel', line: i });
                let origItem = originalWo.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                let origInitialQty = originalWo.getSublistValue({ sublistId: 'item', fieldId: 'custcol_abj_pdt_initial_qty', line: i }) || 0;
                let calculatedQty = (parseFloat(origInitialQty) * prosent) / 100;

                newWo.selectNewLine({ sublistId: 'item' });
                newWo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: origItem });
                newWo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: calculatedQty });
                
                try {
                    newWo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'assemblylevel', value: origAssemblyLevel });
                } catch (e) { }
                newWo.commitLine({ sublistId: 'item' });
            }
        }
        return newWo.save();
    };

    const getOriginalWoIssueId = (originalWoId) => {
        let issueId = null;
        search.create({
            type: "workorderissue",
            settings: [{"name": "consolidationtype", "value": "ACCTTYPE"}],
            filters: [
                ["type", "anyof", "WOIssue"], "AND", 
                ["createdfrom", "anyof", originalWoId], "AND", 
                ["mainline", "is", "T"]
            ],
            columns: ["internalid"]
        }).run().each(result => { issueId = result.getValue("internalid"); return false; });
        return issueId;
    };

    const copyInventoryDetail = (origDetail, newDetail, expectedTotalQty, itemId) => {
        while (newDetail.getLineCount({ sublistId: 'inventoryassignment' }) > 0) {
            newDetail.removeLine({ sublistId: 'inventoryassignment', line: 0 });
        }

        const detailLineCount = origDetail.getLineCount({ sublistId: 'inventoryassignment' });
        let totalOrigQty = 0;
        const origLinesData = [];
        
        for (let i = 0; i < detailLineCount; i++) {
            let qty = parseFloat(origDetail.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', line: i }) || 0);
            totalOrigQty += qty;
            origLinesData.push({
                invNumber: origDetail.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: i }),
                binNumber: origDetail.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', line: i }),
                invStatus: origDetail.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', line: i }),
                qty: qty
            });
        }

        let accumulatedQty = 0;
        for (let i = 0; i < detailLineCount; i++) {
            let lineData = origLinesData[i];
            let calcQty = 0;

            if (i === detailLineCount - 1) {
                calcQty = parseFloat((expectedTotalQty - accumulatedQty).toFixed(5));
            } else {
                let ratio = (totalOrigQty > 0) ? (lineData.qty / totalOrigQty) : 0;
                calcQty = parseFloat((expectedTotalQty * ratio).toFixed(5)); 
            }

            if (calcQty > 0) {
                newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                if (lineData.invNumber) newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: lineData.invNumber });
                if (lineData.binNumber) newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: lineData.binNumber });
                if (lineData.invStatus) newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: lineData.invStatus });
                
                newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: calcQty });
                newDetail.commitLine({ sublistId: 'inventoryassignment' });
                accumulatedQty += calcQty;
            }
        }
    };

    const upsertWorkOrderIssue = (newWoId, origWoIssueId, prosent, existingIssueId) => {
        const origWoIssue = record.load({ type: record.Type.WORK_ORDER_ISSUE, id: origWoIssueId });
        const newWo = record.load({ type: record.Type.WORK_ORDER, id: newWoId });

        let newWoIssue = existingIssueId
            ? record.load({ type: record.Type.WORK_ORDER_ISSUE, id: existingIssueId, isDynamic: true })
            : record.transform({ fromType: record.Type.WORK_ORDER, fromId: newWoId, toType: record.Type.WORK_ORDER_ISSUE, isDynamic: true });

        newWoIssue.setValue({ fieldId: 'subsidiary', value: newWo.getValue('subsidiary') });
        newWoIssue.setValue({ fieldId: 'location', value: newWo.getValue('location') });
        newWoIssue.setValue({ fieldId: 'item', value: newWo.getValue('assemblyitem') }); 
        
        if (newWo.getValue('billofmaterials')) newWoIssue.setValue({ fieldId: 'billofmaterials', value: newWo.getValue('billofmaterials') });
        if (newWo.getValue('billofmaterialsrevision')) newWoIssue.setValue({ fieldId: 'billofmaterialsrevision', value: newWo.getValue('billofmaterialsrevision') });
        if (newWo.getValue('manufacturingrouting')) newWoIssue.setValue({ fieldId: 'manufacturingrouting', value: newWo.getValue('manufacturingrouting') });
        
        newWoIssue.setValue({ fieldId: 'trandate', value: newWo.getValue('trandate') });

        const existingLineCount = newWoIssue.getLineCount({ sublistId: 'component' });
        const origLineCount = origWoIssue.getLineCount({ sublistId: 'component' });
        
        let lineDataToProcess = [];
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

            let calculatedQty = 0;
            if (matchOrigLine !== -1) {
                let origQty = origWoIssue.getSublistValue({ sublistId: 'component', fieldId: 'quantity', line: matchOrigLine }) || 0;
                calculatedQty = parseFloat(((parseFloat(origQty) * prosent) / 100).toFixed(5));
            }

            if (calculatedQty > 0) hasValidLines = true;
            
            lineDataToProcess.push({ index: i, item: currentItem, calcQty: calculatedQty, matchOrigLine: matchOrigLine });
        }

        if (!hasValidLines) {
            log.audit('Skip WO Issue', `Dibatalkan karena total seluruh qty komponen adalah 0. WO ID: ${newWoId}`);
            return null; 
        }

        for (let i = 0; i < lineDataToProcess.length; i++) {
            let lineInfo = lineDataToProcess[i];
            newWoIssue.selectLine({ sublistId: 'component', line: lineInfo.index });
            
            if (lineInfo.calcQty > 0) {
                let hasNewDetail = newWoIssue.hasCurrentSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail' });
                if (hasNewDetail) {
                    let tempDetail = newWoIssue.getCurrentSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail' });
                    while (tempDetail.getLineCount({ sublistId: 'inventoryassignment' }) > 0) {
                        tempDetail.removeLine({ sublistId: 'inventoryassignment', line: 0 });
                    }
                }

                newWoIssue.setCurrentSublistValue({ sublistId: 'component', fieldId: 'quantity', value: lineInfo.calcQty });
                let finalSystemQty = newWoIssue.getCurrentSublistValue({ sublistId: 'component', fieldId: 'quantity' }) || 0;
                
                let origHasDetail = origWoIssue.hasSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail', line: lineInfo.matchOrigLine });
                
                if (origHasDetail && finalSystemQty > 0) {
                    let origDetail = origWoIssue.getSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail', line: lineInfo.matchOrigLine });
                    try {
                        let newDetail = newWoIssue.getCurrentSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail' });
                        copyInventoryDetail(origDetail, newDetail, finalSystemQty, lineInfo.item);
                    } catch (e) {
                        throw new Error(`Inventory detail gagal dibuat untuk komponen ${lineInfo.item}. Penyebab: ${e.message}`);
                    }
                }
            } else {
                newWoIssue.setCurrentSublistValue({ sublistId: 'component', fieldId: 'quantity', value: 0 });
            }
            newWoIssue.commitLine({ sublistId: 'component' });
        }

        return newWoIssue.save();
    };

    const setWocInventoryDetail = (objRecord, itemId) => {
        try {
            let qtyString = objRecord.getValue({ fieldId: 'custbody_abj_pdt_qty_per_lot_woc' });
            if (!qtyString) return; 

            let pctString = objRecord.getValue({ fieldId: 'custbody_abj_pdt_sn_main_prod_woc' }) || '';
            let balString = objRecord.getValue({ fieldId: 'custbody_pdt_sn_balance_main_prod_woc' }) || '';

            let qtyArr = qtyString.split('|');
            let pctArr = pctString.split('|');
            let balArr = balString.split('|');

            let itemLookup = search.lookupFields({
                type: search.Type.ITEM, id: itemId, columns: ['custitem_aln_2_number_format', 'class']
            });
            let lotFormatId = itemLookup.custitem_aln_2_number_format.length > 0 ? itemLookup.custitem_aln_2_number_format[0].value : null;
            let itemClassId = objRecord.getValue('class') || '';
            
            let lotConfigs = [];
            let classInitialLot = "";

            if (lotFormatId) {
                let lotRec = record.load({ type: 'customrecord_aln_lot_format', id: lotFormatId });
                let lines = lotRec.getLineCount({ sublistId: 'recmachcustrecord_aln_lot_format' });
                
                for (let i = 0; i < lines; i++) {
                    lotConfigs.push({
                        sno: Number(lotRec.getSublistValue({ sublistId: 'recmachcustrecord_aln_lot_format', fieldId: 'custrecord_aln_sno', line: i }) || 0),
                        config: lotRec.getSublistValue({ sublistId: 'recmachcustrecord_aln_lot_format', fieldId: 'custrecord_aln_config', line: i }),
                        text: lotRec.getSublistValue({ sublistId: 'recmachcustrecord_aln_lot_format', fieldId: 'custrecord_aln_text', line: i })
                    });
                }
                lotConfigs.sort((a, b) => a.sno - b.sno);

                let needsClass = lotConfigs.some(c => c.config == '102');
                if (needsClass && itemClassId) {
                    let classLookup = search.lookupFields({ type: search.Type.CLASSIFICATION, id: itemClassId, columns: ['custrecord_abj_pdt_initial_lot'] });
                    classInitialLot = classLookup.custrecord_abj_pdt_initial_lot || "";
                }
            }

            let tranDateVal = objRecord.getValue({ fieldId: 'trandate' });
            let tranDate = (!tranDateVal) ? new Date() : (typeof tranDateVal === 'string' ? new Date(tranDateVal) : tranDateVal);
            
            let fullYear = tranDate.getFullYear();
            let yearStr = fullYear.toString().substring(2); 
            let month = tranDate.getMonth();
            let monthStr = (month + 1).toString().padStart(2, '0'); 
            
            let runNumberVal = "";
            let needsRunNumber = lotConfigs.some(c => c.config == '103');
            
            if (needsRunNumber) {
                let lastDayOfMonth = new Date(fullYear, month + 1, 0).getDate();
                let startDateStr = `01/${monthStr}/${fullYear} 12:00 am`;
                let endDateStr = `${lastDayOfMonth}/${monthStr}/${fullYear} 11:59 pm`;
                
                const workorderSearchObj = search.create({
                    type: "workorder",
                    settings: [{"name": "consolidationtype", "value": "ACCTTYPE"}],
                    filters: [
                        ["type", "anyof", "WorkOrd"], "AND", 
                        ["itemtype", "startswith", "Assembly"], "AND", 
                        ["datecreated", "within", startDateStr, endDateStr]
                    ],
                    columns: [search.createColumn({name: "internalid"})]
                });

                const searchResultCount = workorderSearchObj.runPaged().count;
                runNumberVal = (searchResultCount + 1).toString();
            }

            let invDetail = objRecord.getSubrecord({ fieldId: 'inventorydetail' });
            let existingLines = invDetail.getLineCount({ sublistId: 'inventoryassignment' });
            for (let i = existingLines - 1; i >= 0; i--) {
                invDetail.removeLine({ sublistId: 'inventoryassignment', line: i });
            }

            for (let i = 0; i < qtyArr.length; i++) {
                let currentQty = parseFloat(qtyArr[i]);
                if (isNaN(currentQty) || currentQty <= 0) continue;

                let lotName = "";
                let seqNum = i + 1;

                if (!lotFormatId) {
                    lotName = seqNum.toString();
                } else {
                    lotConfigs.forEach(cfg => {
                        if (cfg.config == '13') lotName += (cfg.text || '');
                        else if (cfg.config == '102') lotName += classInitialLot;
                        else if (cfg.config == '4') lotName += yearStr;
                        else if (cfg.config == '11') lotName += monthStr;
                        else if (cfg.config == '7') lotName += seqNum.toString();
                        else if (cfg.config == '103') lotName += runNumberVal;
                    });
                }

                invDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: lotName }); 
                invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: currentQty });
                invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 2 });

                let currentPct = pctArr[i] ? pctArr[i].replace('%', '').trim() : '';
                if (currentPct) invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'custitemnumber_abj_pdt_sn_percent', value: currentPct });
                
                let currentBal = balArr[i] || '';
                if (currentBal) invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'custitemnumber_abj_pdt_sn_balance', value: currentBal });
                
                invDetail.commitLine({ sublistId: 'inventoryassignment' });
            }

        } catch (e) {
            throw new Error("Gagal menyusun Inventory Detail: " + e.message);
        }
    };

    const upsertWorkOrderCompletion = (newWoId, data, existingWocId) => {
        const newWo = record.load({ type: record.Type.WORK_ORDER, id: newWoId });

        let newWoc = existingWocId
            ? record.load({ type: record.Type.WORK_ORDER_COMPLETION, id: existingWocId, isDynamic: true })
            : record.transform({ fromType: record.Type.WORK_ORDER, fromId: newWoId, toType: record.Type.WORK_ORDER_COMPLETION, isDynamic: true });

        newWoc.setValue({ fieldId: 'trandate', value: newWo.getValue('trandate') });

        let totalCompletedQty = 0;
        if (data.qtyPerLot) {
            let qtyArr = data.qtyPerLot.split('|');
            qtyArr.forEach(q => {
                let parsedQ = parseFloat(q);
                if (!isNaN(parsedQ) && parsedQ > 0) totalCompletedQty += parsedQ;
            });
        }

        if (totalCompletedQty > 0) {
            newWoc.setValue({ fieldId: 'completedquantity', value: totalCompletedQty });
        } else {
            newWoc.setValue({ fieldId: 'completedquantity', value: newWo.getValue('quantity') });
        }

        if (data.qtyPerLot) newWoc.setValue({ fieldId: 'custbody_abj_pdt_qty_per_lot_woc', value: data.qtyPerLot });
        if (data.snLot) newWoc.setValue({ fieldId: 'custbody_abj_pdt_sn_main_prod_woc', value: data.snLot });
        if (data.snBalance) newWoc.setValue({ fieldId: 'custbody_pdt_sn_balance_main_prod_woc', value: data.snBalance });

        const startOpField = newWoc.getField({ fieldId: 'startoperation' });
        if (startOpField) {
            const opOptions = startOpField.getSelectOptions();
            const validOptions = opOptions.filter(opt => opt.value !== "");
            if (validOptions.length > 0) {
                newWoc.setValue({ fieldId: 'startoperation', value: validOptions[0].value });
                newWoc.setValue({ fieldId: 'endoperation', value: validOptions[validOptions.length - 1].value });
            }
        }

        const opLineCount = newWoc.getLineCount({ sublistId: 'operation' });
        for (let i = 0; i < opLineCount; i++) {
            newWoc.selectLine({ sublistId: 'operation', line: i });
            
            let currentMachineRes = parseFloat(newWoc.getCurrentSublistValue({ sublistId: 'operation', fieldId: 'machineresources' }) || 0);
            let currentLaborRes = parseFloat(newWoc.getCurrentSublistValue({ sublistId: 'operation', fieldId: 'laborresources' }) || 0);

            let calcMachineRes = parseFloat(((currentMachineRes * data.prosent) / 100).toFixed(5));
            let calcLaborRes = parseFloat(((currentLaborRes * data.prosent) / 100).toFixed(5));

            newWoc.setCurrentSublistValue({ sublistId: 'operation', fieldId: 'machineresources', value: calcMachineRes });
            newWoc.setCurrentSublistValue({ sublistId: 'operation', fieldId: 'laborresources', value: calcLaborRes });

            newWoc.commitLine({ sublistId: 'operation' });
        }

        setWocInventoryDetail(newWoc, data.item);

        return newWoc.save();
    };

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});