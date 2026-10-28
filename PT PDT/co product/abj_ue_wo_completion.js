/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/log', 'N/task'], (record, search, log, task) => {

    const SUBLIST_CO_PRODUCT = 'recmachcustrecord_pdt_link_wo_completion';
    const SUBLIST_OPERATION = 'operation';

    /**
     * @param {string|number} itemId 
     * @returns {Set} 
     */
    const getCoProductConfig = (itemId) => {
        const productMapSet = new Set();
        const coProductSearch = search.create({
            type: "customrecord_abj_pdt_config_co_product",
            filters: [
                ["custrecord_abj_pdt_assembly_item_link", "anyof", itemId],
                "AND",
                ["custrecord_abj_pdt_material_cost_factor", "greaterthan", "0"]
            ],
            columns: [
                search.createColumn({ name: "custrecord_abj_pdt_co_product" })
            ]
        });

        coProductSearch.run().each((result) => {
            const coProductId = result.getValue({ name: 'custrecord_abj_pdt_co_product' });
            if (coProductId) {
                productMapSet.add(coProductId);
            }
            return true; 
        });

        return productMapSet;
    };

    const customRoundPercent = (value) => {
        const shiftedValue = value * 100;
        const intPart = Math.floor(shiftedValue);
        const decimalPart = shiftedValue - intPart;
        let roundedValue;
        if (decimalPart <= 0.5) {
            roundedValue = intPart;
        } else {
            roundedValue = intPart + 1;
        }
        return roundedValue / 100;
    };

    const getRatioPercent = (objRecord) => {
        const headerItem = objRecord.getValue({ fieldId: 'item' });
        if (!headerItem) return 0;

        const mappedCoProducts = getCoProductConfig(headerItem);
        let sublistTotalQty = 0;
        const lineCountCoProd = objRecord.getLineCount({ sublistId: SUBLIST_CO_PRODUCT });

        for (let i = 0; i < lineCountCoProd; i++) {
            let sublistItem = objRecord.getSublistValue({
                sublistId: SUBLIST_CO_PRODUCT,
                fieldId: 'custrecord_pdt_item_result',
                line: i
            });

            if (mappedCoProducts.has(sublistItem)) {
                let sublistQty = Number(objRecord.getSublistValue({
                    sublistId: SUBLIST_CO_PRODUCT,
                    fieldId: 'custrecord_pdt_qty_result',
                    line: i
                }) || 0);
                sublistTotalQty += sublistQty;
            }
        }

        const completedQty = Number(objRecord.getValue({ fieldId: 'completedquantity' }) || 0);
        const totalQuantity100 = completedQty + sublistTotalQty;

        if (totalQuantity100 <= 0) return 0;

        let rawMainPercent = (completedQty / totalQuantity100) * 100;
        const mainMaterialPercent = customRoundPercent(rawMainPercent);
        return mainMaterialPercent / 100;
    };

    const deleteWorkOrderHierarchy = (woId) => {
        try {
            search.create({
                type: search.Type.WORK_ORDER_COMPLETION,
                filters: [
                    ["createdfrom", "anyof", woId], "AND", 
                    ["mainline", "is", "T"]
                ],
                columns: ["internalid"]
            }).run().each(result => {
                log.audit('Deleting Cascade', `Deleting Child WOC ID: ${result.id} for WO: ${woId}`);
                record.delete({ type: record.Type.WORK_ORDER_COMPLETION, id: result.id });
                return true;
            });

            search.create({
                type: search.Type.WORK_ORDER_ISSUE,
                filters: [
                    ["createdfrom", "anyof", woId], "AND", 
                    ["mainline", "is", "T"]
                ],
                columns: ["internalid"]
            }).run().each(result => {
                log.audit('Deleting Cascade', `Deleting Child WO Issue ID: ${result.id} for WO: ${woId}`);
                record.delete({ type: record.Type.WORK_ORDER_ISSUE, id: result.id });
                return true;
            });

            log.audit('Deleting Target WO', `Deleting Target Work Order ID: ${woId}`);
            record.delete({ type: record.Type.WORK_ORDER, id: woId });

        } catch (e) {
            log.error('Error in deleteWorkOrderHierarchy', `Failed to delete hierarchy for WO ${woId}: ${e.message}`);
        }
    };

    const updateWorkOrder = (workOrderId, ratioPercent) => {
        try {
            const woRecord = record.load({
                type: record.Type.WORK_ORDER,
                id: workOrderId,
                isDynamic: false
            });

            const lineCount = woRecord.getLineCount({ sublistId: 'item' });
            let isUpdated = false;

            for (let i = 0; i < lineCount; i++) {
                let currentQty = Number(woRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                }) || 0);

                if (currentQty > 0) {
                    let newQty = currentQty * ratioPercent;
                    woRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i,
                        value: newQty
                    });
                    isUpdated = true;
                }
            }

            if (isUpdated) {
                let savedWoId = woRecord.save({ ignoreMandatoryFields: true });
                log.debug('Function 1 Success', `Work Order ${savedWoId} berhasil diupdate.`);
            }
        } catch (error) {
            log.error('Error in updateWorkOrder', error.message);
        }
    };

    const revertWorkOrderIssue = (workOrderId, ratioPercent) => {
        try {
            if (!ratioPercent || ratioPercent <= 0) return;
            const inverseRatio = 1 / ratioPercent;

            const workorderissueSearchObj = search.create({
                type: "workorderissue",
                settings: [{"name":"consolidationtype", "value":"ACCTTYPE"}],
                filters: [
                    ["type", "anyof", "WOIssue"], 
                    "AND", 
                    ["createdfrom", "anyof", workOrderId], 
                    "AND", 
                    ["mainline", "is", "T"]
                ],
                columns: [
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
            });

            workorderissueSearchObj.run().each(function(result) {
                let issueId = result.getValue({ name: 'internalid' });
                
                let issueRecord = record.load({
                    type: record.Type.WORK_ORDER_ISSUE,
                    id: issueId,
                    isDynamic: true
                });

                let lineCount = issueRecord.getLineCount({ sublistId: 'component' });
                let isUpdated = false;

                for (let i = 0; i < lineCount; i++) {
                    issueRecord.selectLine({ sublistId: 'component', line: i });
                    
                    let currentQty = Number(issueRecord.getCurrentSublistValue({
                        sublistId: 'component',
                        fieldId: 'quantity'
                    }) || 0);

                    if (currentQty > 0) {
                        let newQty = currentQty * inverseRatio;
                        
                        issueRecord.setCurrentSublistValue({
                            sublistId: 'component',
                            fieldId: 'quantity',
                            value: newQty
                        });

                        let hasInvDetail = issueRecord.hasCurrentSublistSubrecord({
                            sublistId: 'component',
                            fieldId: 'componentinventorydetail'
                        });

                        if (hasInvDetail) {
                            let invDetail = issueRecord.getCurrentSublistSubrecord({
                                sublistId: 'component',
                                fieldId: 'componentinventorydetail'
                            });

                            let invLineCount = invDetail.getLineCount({ sublistId: 'inventoryassignment' });
                            
                            for (let j = 0; j < invLineCount; j++) {
                                invDetail.selectLine({ sublistId: 'inventoryassignment', line: j });
                                
                                let currentInvQty = Number(invDetail.getCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity'
                                }) || 0);
                                
                                let newInvQty = currentInvQty * inverseRatio;
                                
                                invDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity',
                                    value: newInvQty
                                });
                                
                                invDetail.commitLine({ sublistId: 'inventoryassignment' });
                            }
                        }
                        
                        issueRecord.commitLine({ sublistId: 'component' });
                        isUpdated = true;
                    }
                }

                if (isUpdated) {
                    let savedIssueId = issueRecord.save({ ignoreMandatoryFields: true });
                    log.debug('Revert WOI Success', `Work Order Issue ${savedIssueId} berhasil dikembalikan nilainya (Revert).`);
                }

                return true; 
            });
        } catch (error) {
            log.error('Error in revertWorkOrderIssue', error.message);
        }
    };

    const updateWorkOrderIssue = (workOrderId, ratioPercent) => {
        try {
            const workorderissueSearchObj = search.create({
                type: "workorderissue",
                settings: [{"name":"consolidationtype", "value":"ACCTTYPE"}],
                filters: [
                    ["type", "anyof", "WOIssue"], 
                    "AND", 
                    ["createdfrom", "anyof", workOrderId], 
                    "AND", 
                    ["mainline", "is", "T"]
                ],
                columns: [
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
            });

            workorderissueSearchObj.run().each(function(result) {
                let issueId = result.getValue({ name: 'internalid' });
                
                let issueRecord = record.load({
                    type: record.Type.WORK_ORDER_ISSUE,
                    id: issueId,
                    isDynamic: true
                });

                let lineCount = issueRecord.getLineCount({ sublistId: 'component' });
                let isUpdated = false;

                for (let i = 0; i < lineCount; i++) {
                    issueRecord.selectLine({ sublistId: 'component', line: i });
                    
                    let currentQty = Number(issueRecord.getCurrentSublistValue({
                        sublistId: 'component',
                        fieldId: 'quantity'
                    }) || 0);
                    
                    if (currentQty > 0) {
                        let newQty = currentQty * ratioPercent;
                        
                        issueRecord.setCurrentSublistValue({
                            sublistId: 'component',
                            fieldId: 'quantity',
                            value: newQty
                        });

                        let hasInvDetail = issueRecord.hasCurrentSublistSubrecord({
                            sublistId: 'component',
                            fieldId: 'componentinventorydetail'
                        });

                        if (hasInvDetail) {
                            let invDetail = issueRecord.getCurrentSublistSubrecord({
                                sublistId: 'component',
                                fieldId: 'componentinventorydetail'
                            });

                            let invLineCount = invDetail.getLineCount({ sublistId: 'inventoryassignment' });
                            
                            for (let j = 0; j < invLineCount; j++) {
                                invDetail.selectLine({ sublistId: 'inventoryassignment', line: j });
                                
                                let currentInvQty = Number(invDetail.getCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity'
                                }) || 0);
                                
                                let newInvQty = currentInvQty * ratioPercent;
                                
                                invDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity',
                                    value: newInvQty
                                });
                                
                                invDetail.commitLine({ sublistId: 'inventoryassignment' });
                            }
                        }
                        
                        issueRecord.commitLine({ sublistId: 'component' });
                        isUpdated = true;
                    }
                }

                if (isUpdated) {
                    let savedIssueId = issueRecord.save({ ignoreMandatoryFields: true });
                    log.debug('Function 2 Success', `Work Order Issue ${savedIssueId} berhasil diupdate.`);
                }

                return true; 
            });
        } catch (error) {
            log.error('Error in updateWorkOrderIssue', error.message);
        }
    };

    const setWocInventoryDetail = (objRecord, itemId, soLinkedId) => {
        try {
            log.debug('setWocInventoryDetail triggered');
            let qtyString = objRecord.getValue({ fieldId: 'custbody_abj_pdt_qty_per_lot_woc' });
            if (!qtyString) return; 

            let pctString = objRecord.getValue({ fieldId: 'custbody_abj_pdt_sn_main_prod_woc' }) || '';
            let balString = objRecord.getValue({ fieldId: 'custbody_pdt_sn_balance_main_prod_woc' }) || '';

            let qtyArr = qtyString.split('|');
            let pctArr = pctString.split('|');
            let balArr = balString.split('|');

            let itemLookup = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ['custitem_aln_2_number_format']
            });
            let lotFormatId = itemLookup.custitem_aln_2_number_format.length > 0 ? itemLookup.custitem_aln_2_number_format[0].value : null;
            
            let lotConfigs = [];
            let entityGroupInitialLot = "";

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

                let needsEntityGroup = lotConfigs.some(c => c.config == '102');
                if (needsEntityGroup) {
                    let operationLineCount = objRecord.getLineCount({ sublistId: SUBLIST_OPERATION });
                    if (operationLineCount > 0) {
                        let operationName = objRecord.getSublistText({ sublistId: SUBLIST_OPERATION, fieldId: 'workcenter', line: 0 }) ||
                                            objRecord.getSublistValue({ sublistId: SUBLIST_OPERATION, fieldId: 'workcenter', line: 0 });
                        
                        if (operationName) {
                            const entitygroupSearchObj = search.create({
                                type: "entitygroup",
                                filters: [
                                   ["groupname", "is", operationName]
                                ],
                                columns: [
                                   search.createColumn({name: "custentity_abj_pdt_initial_lot", label: "Initial Lot"})
                                ]
                            });
                            
                            entitygroupSearchObj.run().each(function(result){
                                entityGroupInitialLot = result.getValue({ name: "custentity_abj_pdt_initial_lot" }) || "";
                                return false; 
                            });
                        }
                    }
                }
            }

            let postingPeriod = objRecord.getValue({ fieldId: 'postingperiod' });

            let runNumber110 = "";
            let needs110 = lotConfigs.some(c => c.config == '110');
            if (needs110 && postingPeriod) {
                const search110 = search.create({
                    type: "transaction",
                    settings: [{"name":"consolidationtype","value":"ACCTTYPE"}],
                    filters: [
                        ["type","anyof","WorkOrd"], 
                        "AND", 
                        ["subsidiary","anyof","5"], "AND", 
                        ["postingperiod","abs", postingPeriod]
                    ],
                    columns: [
                        search.createColumn({name: "tranid", summary: "COUNT", label: "Document Number"})
                    ]
                });
                let count110 = 0;
                search110.run().each(function(result){
                    count110 = parseInt(result.getValue({ name: "tranid", summary: "COUNT" }) || 0);
                    return false; 
                });
                runNumber110 = (count110 + 1).toString();
            }

            let runNumber103 = "";
            let needs103 = lotConfigs.some(c => c.config == '103');
            log.debug('postingPeriod', postingPeriod)
            if (needs103 && postingPeriod) {
                const search103 = search.create({
                    type: "transaction",
                    settings: [{"name":"consolidationtype","value":"ACCTTYPE"}],
                    filters: [
                        ["type","anyof","WorkOrd"], 
                        "AND", 
                        ["subsidiary","anyof","2"], 
                        "AND", 
                        ["manufacturingrouting","anyof","8","7"],
                        "AND", 
                        ["postingperiod","abs", postingPeriod]
                    ],
                    columns: [
                        search.createColumn({name: "tranid", summary: "COUNT", label: "Document Number"})
                    ]
                });
                let count103 = 0;
                search103.run().each(function(result){
                    count103 = parseInt(result.getValue({ name: "tranid", summary: "COUNT" }) || 0);
                    log.debug('count103', count103)
                    return false; 
                });
                runNumber103 = (count103 + 1).toString();
                log.debug('runNumber103', runNumber103)
            }
            let runNumber106 = "";
            let needs106 = lotConfigs.some(c => c.config == '106');
            log.debug('postingPeriod', postingPeriod)
            if (needs106 && postingPeriod) {
                const search106 = search.create({
                    type: "transaction",
                    settings: [{"name":"consolidationtype","value":"ACCTTYPE"}],
                    filters: [
                        ["type","anyof","WorkOrd"], 
                        "AND", 
                        ["subsidiary","anyof","4"],
                        "AND", 
                        ["postingperiod","abs", postingPeriod]
                    ],
                    columns: [
                        search.createColumn({name: "tranid", summary: "COUNT", label: "Document Number"})
                    ]
                });
                let count106 = 0;
                search106.run().each(function(result){
                    count106 = parseInt(result.getValue({ name: "tranid", summary: "COUNT" }) || 0);
                    log.debug('count106', count106)
                    return false; 
                });
                runNumber106 = (count106 + 1).toString();
                log.debug('runNumber106', runNumber106)
            }

            let tranDateVal = objRecord.getValue({ fieldId: 'trandate' });
            let tranDate = (!tranDateVal) ? new Date() : (typeof tranDateVal === 'string' || tranDateVal instanceof String) ? new Date(tranDateVal) : tranDateVal;
            
            let fullYear = tranDate.getFullYear();
            let yearStr = fullYear.toString().substring(2); 
            let month = tranDate.getMonth();
            let monthStr = (month + 1).toString().padStart(2, '0'); 
            let monthChar = String.fromCharCode(65 + month);

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
                        if (cfg.config == '13') {
                            lotName += (cfg.text || '');
                        } else if (cfg.config == '102') {
                            lotName += entityGroupInitialLot;
                        } else if (cfg.config == '4') {
                            lotName += yearStr;
                        } else if (cfg.config == '11') { 
                            lotName += monthStr;
                        } else if (cfg.config == '7') {
                            lotName += seqNum.toString();
                        } else if (cfg.config == '117') {
                            lotName += monthChar;
                        } else if (cfg.config == '110') {
                            lotName += runNumber110;
                        } else if (cfg.config == '103') {
                            lotName += runNumber103;
                        }else if(cfg.config == '106'){
                            lotName += runNumber106;
                        }
                    });
                }

                invDetail.insertLine({ sublistId: 'inventoryassignment', line: i });
                invDetail.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', line: i, value: lotName }); 
                invDetail.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', line: i, value: currentQty });
                invDetail.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', line: i, value: 2 });

                invDetail.setSublistValue({ 
                    sublistId: 'inventoryassignment', 
                    fieldId: 'custitemnumber_aln_manufactured_date', 
                    line: i, 
                    value: tranDate 
                });

                if (soLinkedId) {
                    invDetail.setSublistValue({ 
                        sublistId: 'inventoryassignment', 
                        fieldId: 'custitemnumber_abj_pdt_link_so', 
                        line: i, 
                        value: soLinkedId 
                    });
                }

                let currentPct = pctArr[i] ? pctArr[i].replace('%', '').trim() : '';
                if (currentPct) {
                    invDetail.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'custitemnumber_abj_pdt_sn_percent', line: i, value: currentPct });
                }
                
                let currentBal = balArr[i] || '';
                if (currentBal) {
                    invDetail.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'custitemnumber_abj_pdt_sn_balance', line: i, value: currentBal });
                }
            }

        } catch (e) {
            log.error("Error setting Inventory Detail", e.message);
        }
    };

    const adjustQtyWO = (idWoOrig, inverseRatio) => {
        if (!idWoOrig) return;

        const workorderissueSearchObj = search.create({
            type: "workorderissue",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters: [
                ["type", "anyof", "WOIssue"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["createdfrom", "anyof", idWoOrig]
            ],
            columns: [
                search.createColumn({
                    name: "item",
                    summary: "GROUP",
                    label: "Item"
                }),
                search.createColumn({
                    name: "quantity",
                    join: "inventoryDetail",
                    summary: "SUM",
                    label: "Quantity"
                })
            ]
        });

        let itemQtyMap = {};

        workorderissueSearchObj.run().each(function (result) {
            let itemId = result.getValue({ name: 'item', summary: 'GROUP' });
            let qty = result.getValue({ name: 'quantity', join: 'inventoryDetail', summary: 'SUM' });

            if (itemId && qty) {
                itemQtyMap[itemId] = parseFloat(qty);
            }
            return true;
        });

        if (Object.keys(itemQtyMap).length > 0 || inverseRatio) {
            try {
                let woRecord = record.load({
                    type: record.Type.WORK_ORDER,
                    id: idWoOrig,
                    isDynamic: false
                });

                let lineCount = woRecord.getLineCount({ sublistId: 'item' });
                let isUpdated = false;

                for (let i = 0; i < lineCount; i++) {
                    if (inverseRatio && inverseRatio > 0) {
                        let currentQty = Number(woRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        }) || 0);

                        if (currentQty > 0) {
                            woRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i,
                                value: currentQty * inverseRatio
                            });
                            isUpdated = true;
                        }
                    }

                    let currentItem = woRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    if (itemQtyMap.hasOwnProperty(currentItem)) {
                        woRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantityfulfilled',
                            line: i,
                            value: itemQtyMap[currentItem]
                        });
                        isUpdated = true;
                    } 
                }

                if (isUpdated) {
                    let savedWoId = woRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug("Success update Work Order", `WO ID: ${savedWoId} berhasil diupdate dan disinkronisasi.`);
                }

            } catch (e) {
                log.error("Error updating Work Order Qty", e.message);
            }
        } else {
            log.debug("No Issue Quantities", "Tidak ada hasil issue untuk WO " + idWoOrig);
        }
    }

    const beforeSubmit = (context) => {
        if (context.type !== context.UserEventType.DELETE) return;

        const oldRecord = context.oldRecord;
        var idWoOrig = oldRecord.getValue('createdfrom');

        try {
            if (idWoOrig) {
                let ratioPercent = getRatioPercent(oldRecord);
                let inverseRatio = (ratioPercent > 0) ? (1 / ratioPercent) : null;

                if (ratioPercent > 0) {
                    log.debug('Action Revert Triggered', `Revert nilai WO Issue dengan original ratio = ${ratioPercent}`);
                    revertWorkOrderIssue(idWoOrig, ratioPercent);
                }

                adjustQtyWO(idWoOrig, inverseRatio);
            }

            const lineCountCoProd = oldRecord.getLineCount({ sublistId: SUBLIST_CO_PRODUCT });
            log.debug('beforeDelete trigger', `Mengecek ${lineCountCoProd} baris untuk dihapus.`);

            for (let i = 0; i < lineCountCoProd; i++) {
                let displayType = oldRecord.getSublistValue({
                    sublistId: SUBLIST_CO_PRODUCT,
                    fieldId: 'custrecord_pdt_link_transaction_display',
                    line: i
                }) || '';
                
                if(!displayType) {
                    displayType = oldRecord.getSublistText({
                        sublistId: SUBLIST_CO_PRODUCT,
                        fieldId: 'custrecord_pdt_link_transaction',
                        line: i
                    }) || '';
                }

                let transactionId = oldRecord.getSublistValue({
                    sublistId: SUBLIST_CO_PRODUCT,
                    fieldId: 'custrecord_pdt_link_transaction',
                    line: i
                });

                if (!displayType || !transactionId) continue;
                
                let safeDisplayType = displayType.toString().toLowerCase();
                if (safeDisplayType.includes('inventory adjustment') || safeDisplayType.includes('Inventory Adjustment')) {
                    log.debug('Action Delete', `Ditemukan Inventory Adjustment dengan ID: ${transactionId}. Menghapus record...`);
                    record.delete({
                        type: record.Type.INVENTORY_ADJUSTMENT,
                        id: transactionId
                    });
                } 
                else if (safeDisplayType.includes('work order') || safeDisplayType.includes('workorder') || safeDisplayType.startsWith('work order')) {
                    log.debug('Action Delete', `Ditemukan Work Order dengan ID: ${transactionId}. Menghapus hirarki WOC & WOI...`);
                    deleteWorkOrderHierarchy(transactionId);
                }
            }

        } catch (error) {
            log.error('Error in beforeDelete', error.message);
        }
    };

    const afterSubmit = (context) => {
        if (context.type !== context.UserEventType.COPY && context.type !== context.UserEventType.CREATE) {
            return;
        }

        const newRecord = context.newRecord;
        const recordType = newRecord.type;
        const recordId = newRecord.id;

        try {
            log.debug('recordId', recordId)
            const objRecord = record.load({
                type: recordType,
                id: recordId,
                isDynamic: false 
            });
            var ct = context.type;
            
            if(context.type === context.UserEventType.COPY || context.type === context.UserEventType.CREATE){
                var subOpr = objRecord.getLineCount({ sublistId: "operation" });
                if(subOpr > 0){
                    var mechineResource = 0;
                    var laborResource = 0;
                    for(var i = 0; i < subOpr; i++){
                        var mch = objRecord.getSublistValue({
                            sublistId : "operation",
                            fieldId : "machineresources",
                            line : i
                        });
                        var labor = objRecord.getSublistValue({
                            sublistId : "operation",
                            fieldId : "laborresources",
                            line : i
                        });
                        if(mch != "" || mch != null){
                            mechineResource = mch
                        }
                        if(labor != "" || labor != null){
                            laborResource = labor
                        }
                    }
                    objRecord.setValue({
                        fieldId : "custbody_pdt_initial_machine_resources",
                        value : mechineResource
                    })
                    objRecord.setValue({
                        fieldId : "custbody_abj_labor_resources_per_op",
                        value : laborResource
                    })
                }
            }
            
            const headerItem = objRecord.getValue({ fieldId: 'item' });
            const createdFromId = objRecord.getValue({ fieldId: 'createdfrom' });

            if (!headerItem) {
                log.debug('Info', 'Header item kosong, proses dihentikan.');
                return;
            }

            let soLinkedId = null;
            if (createdFromId) {
                try {
                    let woLookup = search.lookupFields({
                        type: search.Type.WORK_ORDER,
                        id: createdFromId,
                        columns: ['createdfrom']
                    });
                    
                    if (woLookup.createdfrom && woLookup.createdfrom.length > 0) {
                        soLinkedId = woLookup.createdfrom[0].value;
                        log.debug('Link SO Found', soLinkedId);
                    }
                } catch (e) {
                    log.error('Error in looking up WO createdfrom', e.message);
                }
            }

            var defaultMachine = objRecord.getValue('custbody_pdt_initial_machine_resources') || 0;
            var defaultLabor = objRecord.getValue('custbody_abj_labor_resources_per_op') || 0;
            const mappedCoProducts = getCoProductConfig(headerItem);
            let sublistTotalQty = 0;
            const validLineIndexes = []; 
            const lineCountCoProd = objRecord.getLineCount({ sublistId: SUBLIST_CO_PRODUCT });

            for (let i = 0; i < lineCountCoProd; i++) {
                let sublistItem = objRecord.getSublistValue({
                    sublistId: SUBLIST_CO_PRODUCT,
                    fieldId: 'custrecord_pdt_item_result',
                    line: i
                });

                if (mappedCoProducts.has(sublistItem)) {
                    let sublistQty = Number(objRecord.getSublistValue({
                        sublistId: SUBLIST_CO_PRODUCT,
                        fieldId: 'custrecord_pdt_qty_result',
                        line: i
                    }) || 0);

                    sublistTotalQty += sublistQty;
                    validLineIndexes.push({ index: i, qty: sublistQty });
                }
            }

            const completedQty = Number(objRecord.getValue({ fieldId: 'completedquantity' }) || 0);
            const totalQuantity100 = completedQty + sublistTotalQty;
            
            if (totalQuantity100 <= 0) {
                log.debug('Info', 'Total quantity adalah 0. Tidak ada kalkulasi persentase.');
                return;
            }

            for (const lineData of validLineIndexes) {
                let rawLinePercent = (lineData.qty / totalQuantity100) * 100;
                let linePercent = customRoundPercent(rawLinePercent);
                
                objRecord.setSublistValue({
                    sublistId: SUBLIST_CO_PRODUCT,
                    fieldId: 'custrecord_abj_pdt_actual_percent_prorat',
                    line: lineData.index,
                    value: linePercent
                });
            }

            let rawMainPercent = (completedQty / totalQuantity100) * 100;
            const mainMaterialPercent = customRoundPercent(rawMainPercent);
            
            objRecord.setValue({
                fieldId: 'custbody_abj_pdt_percent_material_main',
                value: mainMaterialPercent
            });

            const ratioPercent = mainMaterialPercent / 100; 
            const lineCountOperation = objRecord.getLineCount({ sublistId: SUBLIST_OPERATION });
            
            for (let j = 0; j < lineCountOperation; j++) {
                let currentMachineRes = Number(objRecord.getSublistValue({
                    sublistId: SUBLIST_OPERATION,
                    fieldId: 'machineresources',
                    line: j
                }) || 0);

                let currentLaborRes = Number(objRecord.getSublistValue({
                    sublistId: SUBLIST_OPERATION,
                    fieldId: 'laborresources',
                    line: j
                }) || 0);

                objRecord.setSublistValue({
                    sublistId: SUBLIST_OPERATION,
                    fieldId: 'machineresources',
                    line: j,
                    value: defaultMachine * ratioPercent
                });

                objRecord.setSublistValue({
                    sublistId: SUBLIST_OPERATION,
                    fieldId: 'laborresources',
                    line: j,
                    value: defaultLabor * ratioPercent
                });
            }

            setWocInventoryDetail(objRecord, headerItem, soLinkedId);

            const savedRecordId = objRecord.save({
                enableSourcing: false, 
                ignoreMandatoryFields: true
            });

            log.debug('Success', `Record WOC berhasil diupdate. ID: ${savedRecordId} | Main Percent: ${mainMaterialPercent}%`);

            if (createdFromId) {
                log.debug('Triggering Update Original', `Update Original WO Issue dan WO...`);
                updateWorkOrderIssue(createdFromId, ratioPercent);
                updateWorkOrder(createdFromId, ratioPercent);
            }

            let mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_abj_mr_create_wo',  
                params: {
                    'custscript_abj_woc_id': savedRecordId         
                }
            });

            let mrTaskId = mrTask.submit();
            log.audit('Map/Reduce Triggered', `Berhasil memanggil MR script untuk WOC ID: ${savedRecordId}. Task ID: ${mrTaskId}`);

        } catch (error) {
            log.error({
                title: 'Error in afterSubmit',
                details: `Message: ${error.message} | Stack: ${error.stack}`
            });
        }
    };

    return {
        beforeSubmit : beforeSubmit,
        afterSubmit: afterSubmit
    };
});