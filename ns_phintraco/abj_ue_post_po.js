/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/https', 'N/runtime', 'N/file', 'N/log', 'N/search'], (record, https, runtime, file, log, search) => {
    
    const WEBSITE_API_URL = 'https://sbapproval.phintraco.com/welcome/receive_po';
    function callIntegrate(rec){
        const cekIsRecall = rec.getValue('custbody_abj_revision')
        const createdById = rec.getValue('custbody_abj_creator');
        var created_by = ''
        if(createdById){
            var lookCreated = search.lookupFields({
                type: "customrecord_list_users_web",
                id: createdById,
                columns: ["custrecord_id_users_web"],
            });
            created_by = lookCreated.custrecord_id_users_web
        }
        log.debug('masuk kirim web')
        var appStatus
        const status = rec.getValue('approvalstatus'); 
        var cekApprovStatus = rec.getValue('approvalstatus');
        if(cekApprovStatus == '1'){
            appStatus = 'APPROVAL PROCESS'
        }
        const poData = {
            id: rec.id,
            isRevision : rec.getValue('custbody_abj_revision'),
            tranid: rec.getValue('tranid'),
            vendor: rec.getValue('entity'),
            employee: rec.getValue('employee'),
            date: rec.getValue('trandate'),
            trandId: rec.getValue('tranid'),
            memo:rec.getValue('memo') || '',
            categoryPo:rec.getValue('custbodykategori_po') || '',
            product:rec.getValue('custbody17') || '',
            subProduct:rec.getValue('custbodysub_produk') || '',
            noAf:rec.getValue('custbody_po_no_af') || '',
            lineCode:rec.getValue('custbody_po_line_code') || '',
            itemAf:rec.getValue('custbody_po_af_item_af') || '',
            noPc:rec.getValue('custbody_p_no_pc') || '',
            lineCodePc:rec.getValue('custbody_p_line_code_pc') || '',
            itemPC:rec.getValue('custbody_p_item_pc') || '',
            noBc:rec.getValue('custbody_p_no_bc') || '',
            lineCodeBc:rec.getValue('custbody_p_line_code_bc') || '',
            itemBc:rec.getValue('custbody_p_item_bc') || '',
            signPo:rec.getValue('custbody_sign_po') || '',
            appStatus:rec.getValue('approvalstatus') || '',
            subsidiry:rec.getValue('subsidiary') || '',
            location:rec.getValue('location') || '',
            class:rec.getValue('class') || '',
            department:rec.getValue('department') || '',
            currency:rec.getValue('currency') || '',
            exchangeRate:rec.getValue('exchangerate') || '',
            totalAmount:rec.getValue('total'),
            submission_status : appStatus,
            id_web:rec.getValue('custbody_id_web') || '',
            status: status,
            created_by: created_by || '',
            customForm : rec.getValue('customform'),
            line_items: [],
            expenses: [],
            attachments: [],
            approvers: []
        };

        // --- Line Items ---
        const lineCount = rec.getLineCount({ sublistId: 'item' });
        for (let i = 0; i < lineCount; i++) {
            poData.line_items.push({
                po_id : rec.id,
                item: rec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }),
                qty: rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }),
                rate: rec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }),
                amount: rec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }),
                idLineNs:rec.getSublistValue({ sublistId: 'item', fieldId: 'id', line: i }),
                lineCodeBc:rec.getSublistValue({sublistId: 'item', fieldId: 'custcol_p_line_bc', line: i}),
                lineItemBc:rec.getSublistValue({sublistId: 'item', fieldId: 'custcol_p_line_item_bc', line: i}),
                lineNoBc:rec.getSublistValue({sublistId: 'item', fieldId: 'custcol_p_line_no_bc', line: i}),
                grossAmt:rec.getSublistValue({sublistId:'item',fieldId:'grossamt', line:i}),
                location:rec.getSublistText({sublistId:'item',fieldId:'location', line:i}),
                class:rec.getSublistText({sublistId:'item',fieldId:'class', line:i}),
                segmen:rec.getSublistValue({sublistId:'item',fieldId:'cseg1', line:i}),
                no_af:rec.getSublistValue({sublistId:'item', fieldId:'custcol_bill_no_af', line: i}),
                item_af:rec.getSublistValue({sublistId:'item', fieldId:'custcol_bill_item_af', line: i}),
                line_code_af:rec.getSublistValue({sublistId:'item', fieldId:'custcol_bill_line_code', line: i}),
                budget_cost_period:rec.getSublistValue({sublistId:'item', fieldId:'custcol_bc_period_line', line: i}),
                no_pc:rec.getSublistValue({sublistId:'item', fieldId:'custcol_p_line_no_pc', line: i}),
                item_pc:rec.getSublistValue({sublistId:'item', fieldId:'custcol_p_line_item_pc', line: i}),
                line_code_pc:rec.getSublistValue({sublistId:'item', fieldId:'custcol_p_line_line_code_pc', line: i}),
                sub_product:rec.getSublistValue({sublistId:'item', fieldId:'custcolsub_produk_line', line: i}),
                descItem : rec.getSublistValue({ sublistId : 'item', fieldId : 'description', line : i}),
                taxCode: rec.getSublistText({ sublistId : 'item', fieldId : 'taxcode', line : i}),
                taxRate: rec.getSublistText({ sublistId : 'item', fieldId : 'taxrate1', line : i}),
                tax1amt: rec.getSublistValue({ sublistId : 'item', fieldId : 'tax1amt', line : i}),
            });
        }

        // --- Expense Lines ---
        const expCount = rec.getLineCount({ sublistId: 'expense' });
        for (let i = 0; i < expCount; i++) {
            poData.expenses.push({
                po_id : rec.id,
                idLineNsExp : rec.getSublistValue({ sublistId: 'expense', fieldId: 'id', line: i }),
                account: rec.getSublistValue({ sublistId: 'expense', fieldId: 'account', line: i }),
                amount: rec.getSublistValue({ sublistId: 'expense', fieldId: 'amount', line: i }),
                memo: rec.getSublistValue({ sublistId: 'expense', fieldId: 'memo', line: i })
            });
        }
        const approvalCount = rec.getLineCount({sublistId : 'recmachcustrecord_abj_a_id'})
        for(let i = 0; i < approvalCount; i++){
            var appId = rec.getSublistValue({
                sublistId : 'recmachcustrecord_abj_a_id',
                fieldId : 'custrecord_abj_user_need_approval',
                line : i
            })
            var lookupF = search.lookupFields({
                type: "customrecord_list_users_web",
                id: appId,
                columns: ["custrecord_id_users_web"],
            });
            userId = lookupF.custrecord_id_users_web
            log.debug('userId', userId)
            poData.approvers.push({
                po_id : rec.id,
                user_approver :userId,
                status_approve : rec.getSublistValue({ sublistId : 'recmachcustrecord_abj_a_id', fieldId : 'custrecord_abj_status_approve', line : i}),
                tgl_approve : rec.getSublistValue({ sublistId : 'recmachcustrecord_abj_a_id', fieldId : 'custrecord_abj_tgl_appprove', line : i}),
            })
        }
        // --- Attachments & Approvers (misalnya dari subrecord custom) ---
        // Di sini bisa ditambahkan sesuai kebutuhan kamu
        const attachCount = rec.getLineCount({ sublistId: 'recmachcustrecord_a_id' });
        for (let i = 0; i < attachCount; i++) {
            const fileId = rec.getSublistValue({
                sublistId: 'recmachcustrecord_a_id',
                fieldId: 'custrecord_a_attachment',
                line: i
            });

            if (!fileId) continue;

            try {
                const fileObj = file.load({ id: fileId });
                const fileContent = fileObj.getContents(); // base64 string

                poData.attachments.push({
                    id: fileId,
                    name: fileObj.name,
                    type: fileObj.fileType,
                    content: fileContent // kirim sebagai base64
                });
            } catch (e) {
                log.error('Failed to load file', `File ID: ${fileId} | ${e.message}`);
            }
        }

        const response = https.post({
            url: WEBSITE_API_URL,
            body: JSON.stringify(poData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        log.debug('Response Body', response.body);
        const res = JSON.parse(response.body || '{}');
        return res
    }
    
    const afterSubmit = (context) => {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT || context.type === context.UserEventType.COPY){
                log.debug('triggered')

                const recordV = context.newRecord;
                const idRec = recordV.id
                const rec = record.load({
                    type : recordV.type,
                    id : idRec
                })

                var isAttach = false
                var isApprover = false
                const cekLineAttach = rec.getLineCount({
                    sublistId : 'recmachcustrecord_a_id'
                })
                if(cekLineAttach > 0){
                    isAttach = true
                }
                log.debug('cekLineAttach', cekLineAttach)
                const cekApproverLine = rec.getLineCount({
                    sublistId : 'recmachcustrecord_abj_a_id'
                })
                
                log.debug('cekApproverLine', cekApproverLine)
                if(cekApproverLine > 0){
                    isApprover = true
                }
                const cekFlagApproval = rec.getValue('custbody_abj_flag_approval')
                
                if(isAttach && isApprover && cekFlagApproval == false){
                    var result = callIntegrate(rec)
                    
                    log.debug('result', result)
                    if (result.status === 'success') {
                        rec.setValue({
                            fieldId: 'custbody_abj_flag_approval',
                            value: true
                        });
                        var idWeb = result.po_id
                        log.debug('idWeb', idWeb);
                        rec.setValue({
                            fieldId : 'custbody_id_web',
                            value : idWeb

                        })
                        const saveFlag = rec.save();
                        log.debug('saveFlag', saveFlag);
                    }
                    if(result.status === 'success_recall'){
                        rec.setValue({
                            fieldId: 'custbody_abj_revision',
                            value: false
                        });
                        const saveFlag = rec.save();
                        log.debug('saveFlag', saveFlag);
                    }
                }
            
            }
            
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    };
    const beforeLoad = (context) => {
        try{
            if(context.type === context.UserEventType.VIEW){
                var form = context.form;
                const rec = context.newRecord;
                const cekAppralStat = rec.getValue('approvalstatus');
                log.debug('cekAppralStat', cekAppralStat)
                const cekFlagApproval = rec.getValue('custbody_abj_flag_approval');
                log.debug('cekFlagApproval', cekFlagApproval)
                if(cekFlagApproval == true && cekAppralStat != '2'){
                    form.addButton({
                        id: 'custpage_button_recall',
                        label: "Recall",
                        functionName: "recall()"
                    });
                    form.removeButton('edit');
                    context.form.clientScriptModulePath = "SuiteScripts/abj_cs_recall_po.js"
                }
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return { afterSubmit : afterSubmit, beforeLoad : beforeLoad };
});
