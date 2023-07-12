/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/sftp', 'N/file'],
  function(search, record, email, runtime, sftp, file) {
    function getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout) {
      var preConnectionObj = {};
      preConnectionObj.passwordGuid = passwordGuid;
      preConnectionObj.url = url;
      preConnectionObj.hostKey = hostKey;
      if (username) {
        preConnectionObj.username = username;
      }
      if (hostKeyType) {
        preConnectionObj.hostKeyType = hostKeyType;
      }
      if (port) {
        preConnectionObj.port = Number(port);
      }
      if (directory) {
        preConnectionObj.directory = directory;
      }
      if (timeout) {
        preConnectionObj.timeout = Number(timeout);
      }

      var connectionObj = sftp.createConnection(preConnectionObj);
      return connectionObj;
    }

    function uploadFileToSFTP(connection, folderId, fileId) {
        try {
          var fileObj = file.load({
            id: fileId,
            folder: folderId
          });
          log.debug('fileobj', fileObj);
          var fileContents = fileObj.getContents();
          var fileName = fileObj.name;
          log.debug('fileContents', fileContents)
          var fileToUpload = file.create({
            name: fileName,
            fileType: file.Type.PLAINTEXT,
            contents: fileContents,
            description: 'This is a plain text file.',
            encoding: file.Encoding.UTF8,
            folder: folderId,
            isOnline: true
          });
          log.debug('fileToUpload', fileToUpload)
          log.debug('filename', fileName);
      
          connection.upload({
            directory: '/upload',
            filename: fileName,
            file: fileToUpload,
            replaceExisting: true
          });
      
          log.debug('upload success');
        } catch (error) {
          log.debug('upload error:', error.message);
        }
      }

    function execute(context) {
      try {
        var folderId = 3067;
        var fileId = 14213;

        var passwordGuid = runtime.getCurrentScript().getParameter("custscript_guidpassword");
        log.debug('passwordGuid', passwordGuid);

        var hostKey = 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDEocmm5jVi2hrI9HZOV8McIN9UyTSR0QljwU343VtuyrvYQEHzuky9LONGtvlJkUxIgtXuNcDEzvHsF8Y4fHBBE61RpGlQqBNXn6ABSerYhy11T9CD4b/O7Gf16IohMa/ng30Ah50ef8qTo9aF6+SuytVwBqJ0Bhn1EAkeKUF+bMAFUHmypKpJuz0qcgQ/NSfivkVac5TPzTeKVdLcAsZViS25fS9326kV9vaBaCgN8UnlGtxphmi7pkZn66CxzeeezsM2eMD4kQJYjPfsiUcHmlhg2CNpi0KA9fMA8reNVEdHegZvFrNcF0PyFAzRhM7I9EKRg21kxZtP2tVaHUwt';
        var sftpConnection = getSFTPConnection('demo', passwordGuid, 'demo.wftpserver.com', hostKey, 'rsa', '2222', '/upload', 0);
        log.debug('sftpConnection', sftpConnection);

        uploadFileToSFTP(sftpConnection, folderId, fileId);
      } catch (e) {
        log.debug(e.message);
      }
    }

    return {
      execute: execute
    };
  });
