/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([], () => {
    
    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            
            // Membuat kerangka HTML sederhana
            const htmlMessage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Status Konfirmasi</title>
                </head>
                <body style="text-align: center; margin-top: 50px;">
                    <h3 style="color: green; font-family: sans-serif;">
                        Record Berhasil Di Simpan
                    </h3>
                </body>
                </html>
            `;

            // Menulis HTML langsung ke layar pengguna (Bebas dari UI NetSuite)
            context.response.write({
                output: htmlMessage
            });
        }
    };

    return { 
        onRequest 
    };
});