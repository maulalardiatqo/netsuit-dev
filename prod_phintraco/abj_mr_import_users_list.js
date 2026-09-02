/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/record', 'N/log', 'N/runtime'], (file, record, log, runtime) => {

    const CUSTOM_RECORD_ID = 'customrecord_list_users_web';
    const FIELD_MAPPING = {
        users_id: 'custrecord_id_users_web',
        email: 'custrecord_users_web_email',
        fullname: 'custrecord_users_web_name'
    };

    const cleanValue = (str) => {
        if (!str) return '';
        // Hapus tanda kutip dan whitespace berlebih
        return str.replace(/^"+|"+$/g, '').trim();
    };

    const parseCSV = (contents) => {
        contents = contents.replace(/^\uFEFF/, '').trim();

        const firstLine = contents.split('\n')[0];
        const delimiter = firstLine.includes(';') ? ';' :
                          firstLine.includes('\t') ? '\t' : ',';

        const lines = contents.split(/\r?\n/).filter(line => line.trim() !== '');
        const headers = lines[0].split(delimiter).map(h => cleanValue(h));
        const dataLines = lines.slice(1);

        const data = dataLines.map(line => {
            const values = line.split(delimiter);
            let obj = {};
            headers.forEach((header, i) => {
                obj[header] = cleanValue(values[i]);
            });
            return obj;
        });

        return data;
    };

    const getInputData = () => {
        try {
            const script = runtime.getCurrentScript();
            const fileId = script.getParameter({ name: 'custscript_users_csv_file_id' });

            if (!fileId) throw 'Missing script parameter: custscript_users_csv_file_id';

            const csvFile = file.load({ id: fileId });
            const contents = csvFile.getContents();
            const data = parseCSV(contents);

            log.audit('CSV Loaded', `Total rows: ${data.length}`);
            log.debug('Sample Row', data[0]);

            return data;
        } catch (e) {
            log.error('getInputData Error', e);
            throw e;
        }
    };

    const map = (context) => {
        try {
            const data = JSON.parse(context.value);

            const usersId = cleanValue(data.users_id || data.id || data.usersid);
            const email = cleanValue(data.email || data.Email || data.EMAIL);
            const fullName = cleanValue(data.fullname || data.name || data.Fullname);

            if (!usersId && !email && !fullName) {
                log.audit('Skipped - Empty Row', data);
                return;
            }

            if (!email || !fullName) {
                log.audit('Skipped - Missing mandatory field', { usersId, email, fullName });
                return;
            }

            const rec = record.create({
                type: CUSTOM_RECORD_ID,
                isDynamic: true
            });

            rec.setValue({fieldId: 'name', value : fullName});
            rec.setValue({ fieldId: FIELD_MAPPING.users_id, value: usersId });
            rec.setValue({ fieldId: FIELD_MAPPING.email, value: email });
            rec.setValue({ fieldId: FIELD_MAPPING.fullname, value: fullName });

            const recId = rec.save({ enableSourcing: false, ignoreMandatoryFields: true });

            log.audit('Record Saved', `ID: ${recId} | Email: ${email}`);

        } catch (e) {
            log.error('Map Error', e);
        }
    };

    const summarize = (summary) => {
        log.audit('Import Completed', {
            totalKeys: summary.inputSummary.totalKeys
        });

        summary.mapSummary.errors.iterator().each((key, err) => {
            log.error(`Error at ${key}`, err);
            return true;
        });
    };

    return { getInputData, map, summarize };
});
