/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/log', 'N/format'], (record, search, log, format) => {


    const get = (requestParams) => {
        try {
            const { po_ns_id, status, approver, reason } = requestParams;
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
                setSublist(recPo, status, approver, '')
            }
            if(status == '3' && approver){
                setSublist(recPo, status, approver, reason)
            }
            function setSublist(recPo, status, approver, reason){
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
                                value : status,
                                line : i
                            })
                            recPo.setSublistValue({
                                sublistId : 'recmachcustrecord_abj_a_id',
                                fieldId : 'custrecord_abj_notes',
                                value : reason,
                                line : i
                            })
                            function formatDateToString(date) {
                                const d = (date instanceof Date) ? date : new Date(date);
                                // hitung waktu WIB untuk tampilan
                                const utc = d.getTime() + d.getTimezoneOffset() * 60000;
                                const wib = new Date(utc + 7 * 60 * 60000);

                                const day = ('0' + wib.getDate()).slice(-2);
                                const month = ('0' + (wib.getMonth() + 1)).slice(-2);
                                const year = wib.getFullYear();
                                const hours = ('0' + wib.getHours()).slice(-2);
                                const minutes = ('0' + wib.getMinutes()).slice(-2);
                                const seconds = ('0' + wib.getSeconds()).slice(-2);

                                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} WIB`;
                            }

                            // 2) parser: dari "DD/MM/YYYY HH:mm:ss WIB" -> Date object (internal UTC)
                            function parseWibStringToDate(str) {
                                if (!str || typeof str !== 'string') return null;

                                // ambil pattern dd/mm/yyyy hh:mm:ss (abaikan kata "WIB" jika ada)
                                const m = str.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
                                if (!m) return null;

                                const day = parseInt(m[1], 10);
                                const month = parseInt(m[2], 10); // 1-12
                                const year = parseInt(m[3], 10);
                                const hour = parseInt(m[4], 10);
                                const minute = parseInt(m[5], 10);
                                const second = m[6] ? parseInt(m[6], 10) : 0;

                                // Karena string merepresentasikan waktu di WIB (UTC+7),
                                // kita harus menghitung nilai UTC ms yang sesuai:
                                // UTC_ms = Date.UTC(year, month-1, day, hour, minute, second) - (offset_hours * 3600000)
                                const offsetHours = 7;
                                const utcMs = Date.UTC(year, month - 1, day, hour, minute, second) - offsetHours * 60 * 60 * 1000;

                                return new Date(utcMs); // objek Date yang merepresentasikan instant yang sama
                            }
                            var s = formatDateToString(new Date()); // "28/10/2025 21:50:13 WIB"

                            // ubah jadi Date object yang valid untuk setSublistValue
                            var dateObj = parseWibStringToDate(s);
                            log.debug('dateObj', dateObj)
                            recPo.setSublistValue({
                                sublistId: 'recmachcustrecord_abj_a_id',
                                fieldId: 'custrecord_abj_tgl_appprove',
                                value: dateObj,
                                line: i
                            });

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
