/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], (url, currentRecord) => {

    /**
     * Fungsi ini akan terpanggil otomatis saat ada field yang berubah nilainya
     */
    const fieldChanged = (scriptContext) => {
        const { fieldId, currentRecord } = scriptContext;

        if (fieldId === 'custpage_select_page') {
            let pageId = currentRecord.getValue({ fieldId: 'custpage_select_page' });

            let output = url.resolveScript({
                scriptId: getParameterFromURL('script'),
                deploymentId: getParameterFromURL('deploy'),
                returnExternalUrl: false
            });

            let finalUrl = `${output}&page=${pageId}`;
            window.location.href = finalUrl;
        }
    };

   
    const getParameterFromURL = (param) => {
        let query = window.location.search.substring(1);
        let vars = query.split("&");
        for (let i = 0; i < vars.length; i++) {
            let pair = vars[i].split("=");
            if (pair[0] == param) {
                return pair[1];
            }
        }
        return (false);
    };

    return {
        fieldChanged: fieldChanged
    };
});