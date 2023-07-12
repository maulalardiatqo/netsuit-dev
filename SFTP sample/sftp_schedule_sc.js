/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
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

    function execute(context) {
      try {
        var filename = runtime.getCurrentScript().getParameter("custscript_sftp_filename");
        var passwordGuid = runtime.getCurrentScript().getParameter("custscript_password_guid_sftp");
        var hostKey = runtime.getCurrentScript().getParameter("custscript_sftp_hostkey");
        var username = runtime.getCurrentScript().getParameter("custscript_sftp_username");
        var hostKeyType = runtime.getCurrentScript().getParameter("custscript_sftp_hostkeytype");
        var url = runtime.getCurrentScript().getParameter("custscript_sftp_url");
        var port = runtime.getCurrentScript().getParameter("custscript_sftp_port");
        var directory = runtime.getCurrentScript().getParameter("custscript_sftp_directory");
        log.debug('detail', {
          passwordGuid : passwordGuid, hostKey : hostKey, hostKeyType : hostKeyType, username : username, url : url, port : port, directory : directory
        });

        var sftpConnection = getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, 0);
        var downloadedFile = sftpConnection.download({
          filename: filename
        }).getContents();
        log.debug("downloadedFile", downloadedFile);

        var fileObj = file.create({
          name: filename,
          fileType: file.Type.PLAINTEXT,
          contents: downloadedFile,
          folder: 3069,
        });
        var fileId = fileObj.save();
        log.debug("File ID", fileId);
      } catch (e) {
        log.debug('error', e);
      }
    }
    return {
      execute: execute
    };
  });