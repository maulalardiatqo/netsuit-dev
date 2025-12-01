/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([], () => {

    function onRequest(context) {
        const req = context.request;

        // Parameter dari Scheduled Script
        const employeeName = req.parameters.name || 'Employee';
        const period = req.parameters.period || '2025 October';
        const submitDate = req.parameters.submitdate || '01/11/2025';

        const html = `
            <html>
            <body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333;">
                <p>Subject: <strong>Timesheet Reminder for ${period}</strong></p>
                
                <p>Dear <strong>${employeeName}</strong>,</p>

                <p>
                    This is a reminder to submit your Timesheet for Period
                    <strong>${period}</strong> on <strong>${submitDate}</strong>,
                    the first working day of the month. If you will be on leave on that day,
                    submit your timesheet in advance of going on leave.
                </p>

                <p>
                    Access your timesheet via:<br>
                    <a href="https://11635025.app.netsuite.com/app/accounting/transactions/weeklytimelist.nl">
                        https://11635025.app.netsuite.com/app/accounting/transactions/weeklytimelist.nl
                    </a>
                </p>

                <p>
                    If you do not submit your timesheet by the deadline, there is a risk that your cost
                    could be disallowed by donors, reducing the funds available to deliver our programmes
                    for children. Repeated failure to submit timesheets on time and in accordance with SCI
                    and local policies and procedures could result in disciplinary action being taken.
                </p>

                <p>
                    If you have any questions, please contact your supervisor or ER administrator.
                </p>

                <p>Thanks,<br>
                Admin</p>

                <p style="color: #888; font-size: 12px;">
                    Please do not reply – this is an automatic e-mail
                </p>
            </body>
            </html>
        `;

        context.response.write(html);
    }

    return { onRequest };
});
