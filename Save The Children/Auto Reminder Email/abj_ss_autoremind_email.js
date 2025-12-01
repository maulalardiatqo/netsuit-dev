/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define(['N/runtime', 'N/search', 'N/https', 'N/email'], 
    (runtime, search, https, email) => {

    const isLastDay = (date) => {
        const t = new Date(date);
        t.setDate(t.getDate() + 1);
        return t.getMonth() !== date.getMonth();
    };

    const runSearch = (id) => {
        let rows = [];
        search.load({ id }).run().each(r => {
            rows.push({
                id: r.id,
                name: r.getValue('firstname')
            });
            return true;
        });
        return rows;
    };

    function execute() {
        const script = runtime.getCurrentScript();
        
        const SL_END = script.getParameter('custscript_sl_end');
        const SL_START1 = script.getParameter('custscript_sl_start1');
        const SL_START2 = script.getParameter('custscript_sl_start2');

        const S_END = script.getParameter('custscript_search_end');
        const S_START1 = script.getParameter('custscript_search_start1');
        const S_START2 = script.getParameter('custscript_search_start2');

        const today = new Date();
        const month = today.toLocaleString('id-ID', { month: 'long' });

        // =======================
        // 1) Akhir Bulan
        // =======================
        if (isLastDay(today)) {
            const users = runSearch(S_END);

            users.forEach(u => {
                const response = https.get({
                    url: `${SL_END}&name=${encodeURIComponent(u.name)}&month=${month}`
                });

                email.send({
                    author: -5,
                    recipients: u.id,
                    subject: `Reminder Akhir Bulan ${month}`,
                    body: response.body
                });
            });
        }

        // =======================
        // 2) Awal Bulan
        // =======================
        if (today.getDate() === 1) {
            const users1 = runSearch(S_START1);
            const users2 = runSearch(S_START2);

            users1.forEach(u => {
                const response = https.get({
                    url: `${SL_START1}&name=${u.name}&month=${month}`
                });

                email.send({
                    author: -5,
                    recipients: u.id,
                    subject: `Reminder Awal Bulan (T1) - ${month}`,
                    body: response.body
                });
            });

            users2.forEach(u => {
                const response = https.get({
                    url: `${SL_START2}&name=${u.name}&month=${month}`
                });

                email.send({
                    author: -5,
                    recipients: u.id,
                    subject: `Reminder Awal Bulan (T2) - ${month}`,
                    body: response.body
                });
            });
        }
    }

    return { execute };
});
