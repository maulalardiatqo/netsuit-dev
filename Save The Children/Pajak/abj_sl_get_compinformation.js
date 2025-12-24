/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/config'], (config) => {

    const onRequest = (context) => {
        try {
            if (context.request.method === 'GET') {
                log.debug('triggered')
                var companyInfo = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });

                var idTkuPenjual = companyInfo.getValue({
                    fieldId: 'custrecord_sos_id_tku_penjual'
                });
                log.debug('idTkuPenjual', idTkuPenjual)
                context.response.write(
                    idTkuPenjual ? idTkuPenjual : ''
                );
            }
        } catch (e) {
            log.error('ERROR Suitelet get Company Info', e);
            context.response.write('');
        }
    };

    return { onRequest };
});
