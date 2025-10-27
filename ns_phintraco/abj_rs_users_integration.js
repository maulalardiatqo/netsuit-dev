/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/log', 'N/error', 'N/search'], (record, log, error, search) => {

    /**
     * Fungsi utama untuk menangani request GET dari CI3
     */
    const get = (request) => {
        try {
            const recordType = 'customrecord_list_users_web';
            const userNsId = request.users_id;
            const email = request.email;
            const fullname = request.fullname;
            const isDelete = request.isDelete;

            log.debug('Request diterima dari CI3', request);

            let recId;

            if (isDelete) {
                try {
                    var idToDelete;
                    var customrecord_list_users_webSearchObj = search.create({
                        type: "customrecord_list_users_web",
                        filters: [
                            ["custrecord_id_users_web", "is", userNsId]
                        ],
                        columns: [
                            search.createColumn({ name: "id" })
                        ]
                    });

                    var searchResultCount = customrecord_list_users_webSearchObj.runPaged().count;
                    log.debug("User record found", searchResultCount);

                    customrecord_list_users_webSearchObj.run().each(function (result) {
                        idToDelete = result.getValue({ name: "id" });
                        return false; 
                    });

                    if (idToDelete) {
                        record.delete({
                            type: "customrecord_list_users_web",
                            id: idToDelete
                        });

                        log.audit("User Deleted", "Record ID: " + idToDelete + " (custrecord_id_users_web: " + userNsId + ")");
                    } else {
                        log.debug("User not found in NetSuite", "custrecord_id_users_web: " + userNsId);
                    }

                } catch (e) {
                    log.error("Error deleting user", e);
                }
            } else {
                // === CREATE USER BARU ===
                const rec = record.create({
                    type: recordType,
                    isDynamic: true,
                });

                rec.setValue({ fieldId: 'name', value: fullname });
                rec.setValue({ fieldId: 'custrecord_id_users_web', value: userNsId });
                rec.setValue({ fieldId: 'custrecord_users_web_name', value: fullname });
                rec.setValue({ fieldId: 'custrecord_users_web_email', value: email });

                recId = rec.save({ enableSourcing: true, ignoreMandatoryFields: true });

                log.audit('User baru dibuat', `ID: ${recId}`);
            }

            // Kembalikan response ke CI3
            return {
                success: true,
                message: isDelete ? 'User berhasil dihapus di NetSuite' : 'User berhasil dibuat di NetSuite',
                user_ns_id: recId
            };

        } catch (e) {
            log.error('Error integrasi user', e);
            return {
                success: false,
                message: e.message || 'Terjadi error di NetSuite',
            };
        }
    };

    return { get };
});
