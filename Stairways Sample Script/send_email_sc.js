/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/task'], function (email, task) {

    function execute(context) {
      try {
        // Ganti emailTujuan dengan alamat email penerima yang diinginkan
        var emailTujuan = 'maulal@abjcloudsolutions.com';
        var subjekEmail = 'Pengenalan Produk Baru';
        var isiEmail = 'We are delighted to introduce our latest innovation: \n\n' +
          'CM-Idebenone \n' +
          'Unlocking the Power of Cellular Energy and Protection! \n\n' +
          'Discount 10%';
  
        email.send({
          author: -5, 
          recipients: emailTujuan,
          subject: subjekEmail,
          body: isiEmail
        });
  
        log.audit({
          title: 'Email Terkirim',
          details: 'Email berhasil dikirim ke ' + emailTujuan
        });
      } catch (error) {
        log.error({
          title: 'Kesalahan',
          details: 'Terjadi kesalahan saat mengirim email: ' + error.message
        });
      }
    }
  
    return {
      execute: execute
    };
  
  });
  