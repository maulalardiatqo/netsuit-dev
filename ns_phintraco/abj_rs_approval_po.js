/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/log'], (record, search, log) => {


    const get = (requestParams) => {
        try {
            const { po_ns_id, status, approver } = requestParams;
            log.debug('po_ns_id', po_ns_id)
            if (!po_ns_id) {
                return { success: false, message: 'Parameter po_ns_id tidak ditemukan.' };
            }

            if (!status) {
                return { success: false, message: 'Parameter status tidak ditemukan.' };
            }
            var recPo = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: po_ns_id,
                isDynamic : false
            });
            log.debug('status', status)
            if(status == '1' && approver){
                log.debug('approver', approver)
                var cekLine = recPo.getLineCount({
                    sublistId : 'recmachcustrecord_abj_a_id'
                });
                if(cekLine > 0){
                    for(var i = 0; i<cekLine; i++){
                        var cekUser = recPo.getSublistValue({
                            sublistId : 'recmachcustrecord_abj_a_id',
                            fieldId : 'custrecord_abj_user_need_approval',
                            line : i
                        });
                        var lookCreated = search.lookupFields({
                            type: "customrecord_list_users_web",
                            id: cekUser,
                            columns: ["custrecord_id_users_web"],
                        });
                        var idUser = lookCreated.custrecord_id_users_web
                        if(idUser == approver){
                            recPo.setSublistValue({
                                sublistId : 'recmachcustrecord_abj_a_id',
                                fieldId : 'custrecord_abj_status_approve',
                                value : '2',
                                line : i
                            })
                        }
                    }
                }
            }
            recPo.setValue({
                fieldId : 'approvalstatus',
                value : status,
                ignoreFieldChange: true,
            })
            var savePO = recPo.save();
            log.debug('savePo', savePO)

            log.audit('Purchase Order Updated', `PO ID: ${po_ns_id}, set to status:`);

            return {
                success: true,
                message: `PO ${po_ns_id} berhasil diupdate ke status.`
            };

        } catch (error) {
            log.error('Error updating PO status', error);
            return {
                success: false,
                message: error.message || 'Terjadi kesalahan saat update PO di NetSuite.'
            };
        }
    };

    // kamu juga bisa aktifkan POST kalau nanti kirim pakai POST
    return { get };
});
