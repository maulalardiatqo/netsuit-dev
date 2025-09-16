/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/file', 'N/encode'], (search, file, encode) => {

    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            let scriptSearchObj = search.create({
                type: "script",
                filters: [["scriptid","contains","abj"]],
                columns: ["scriptfile"]
            });

            let html = '<h2>Download Script Files</h2><ul>';

            scriptSearchObj.run().each((result) => {
                let fileId = result.getValue('scriptfile');
                log.debug('File ID', fileId);

                if (fileId) {
                    try {
                        let f = file.load({ id: fileId });
                        log.debug('Loaded file', f.name);
                    } catch (e) {
                        log.error('File load failed', `File ID: ${fileId}, Error: ${e.message}`);
                    }
                } else {
                    log.debug('Skip', 'Script tanpa file utama');
                }
                return true;
            });

            html += '</ul>';
            context.response.write(html);
        }
    };

    return { onRequest };
});
