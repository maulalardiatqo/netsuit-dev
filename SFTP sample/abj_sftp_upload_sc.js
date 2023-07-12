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
       var filename = 'readme.txt';
       var passwordGuid = runtime.getCurrentScript().getParameter("custscript_guidpassword");
       log.debug('passwordGuid', passwordGuid);
       var hostKey = 'AAAAB3NzaC1yc2EAAAABJQAAAQEAkRM6RxDdi3uAGogR3nsQMpmt43X4WnwgMzs8VkwUCqikewxqk4U7EyUSOUeT3CoUNOtywrkNbH83e6/yQgzc3M8i/eDzYtXaNGcKyLfy3Ci6XOwiLLOx1z2AGvvTXln1RXtve+Tn1RTr1BhXVh2cUYbiuVtTWqbEgErT20n4GWD4wv7FhkDbLXNi8DX07F9v7+jH67i0kyGm+E3rE+SaCMRo3zXE6VO+ijcm9HdVxfltQwOYLfuPXM2t5aUSfa96KJcA0I4RCMzA/8Dl9hXGfbWdbD2hK1ZQ1pLvvpNPPyKKjPZcMpOznprbg+jIlsZMWIHt7mq2OJXSdruhRrGzZw==';
       var sftpConnection = getSFTPConnection('demo', passwordGuid, 'test.rebex.net', hostKey, 'rsa', '22', 'pub/example', 0);
       log.debug('sftp connection', sftpConnection);
       var downloadedFile = sftpConnection.download({
         filename: filename
       }).getContents();
       log.debug("downloadedFile", downloadedFile);

       var fileObj = file.create({
         name: filename,
         fileType: file.Type.PLAINTEXT,
         contents: downloadedFile,
         folder: 3067,
       });
       var fileId = fileObj.save();
       log.debug("File ID", fileId);
     } catch (e) {
       log.debug(e.message);
     }
   }
   return {
     execute: execute
   };
 });