/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record'], (ui, record) => {

    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            // Buat Form Input Publik
            let form = ui.createForm({
                title: 'Form Pendaftaran Lead'
            });

            form.addField({
                id: 'custpage_nama',
                type: ui.FieldType.TEXT,
                label: 'Nama Lengkap'
            }).isMandatory = true;

            form.addField({
                id: 'custpage_email',
                type: ui.FieldType.EMAIL,
                label: 'Email'
            }).isMandatory = true;

            form.addField({
                id: 'custpage_phone',
                type: ui.FieldType.PHONE,
                label: 'Nomor Telepon'
            });

            form.addField({
                id: 'custpage_perusahaan',
                type: ui.FieldType.TEXT,
                label: 'Perusahaan'
            });

            form.addSubmitButton({
                label: 'Daftar'
            });

            context.response.writePage(form);

        } else {
            let nama = context.request.parameters.custpage_nama;
            let email = context.request.parameters.custpage_email;
            let phone = context.request.parameters.custpage_phone;
            let perusahaan = context.request.parameters.custpage_perusahaan;

            // let leadRec = record.create({
            //     type: record.Type.LEAD,
            //     isDynamic: true
            // });

            // leadRec.setValue('entityid', nama); // nama lead
            // leadRec.setValue('email', email);
            // if (phone) leadRec.setValue('phone', phone);
            // if (perusahaan) leadRec.setValue('companyname', perusahaan);

            // let leadId = leadRec.save();

            // // Tampilkan halaman sukses
            // let form = ui.createForm({ title: 'Terima Kasih!' });
            // form.addField({
            //     id: 'custpage_msg',
            //     type: ui.FieldType.INLINEHTML,
            //     label: 'Info'
            // }).defaultValue = `<h2>Lead berhasil dibuat dengan ID: ${leadId}</h2>`;

            context.response.writePage(form);
        }
    };

    return { onRequest };
});
