var HTTPSMODULE, SFTPMODULE, SERVERWIDGETMODULE;
var HOST_KEY_TOOL_URL = 'https://ursuscode.com/tools/sshkeyscan.php?url=';
var restrictToDomains = 'test.rebex.net';
var restrictToScriptIds = 'customscript_abj_sftp_try_sl';
var username = 'demo';
var password = 'password';
var hostKeyType = 'rsa';
var directory = 'pub/example';
var port = 22;
var filename = 'readme.txt';
var passwordGuid = '';
var hostKey = '';

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(["N/https", "N/sftp"], runSuitelet);

//********************** MAIN FUNCTION **********************
function runSuitelet(https, sftp) {
  HTTPSMODULE = https;
  SFTPMODULE = sftp;

  var returnObj = {};
  returnObj.onRequest = execute;
  return returnObj;
}

function execute(context) {
  if (!passwordGuid) {
    passwordGuid = getPasswordGuid();
  }

  if (!hostKey) {
    hostKey = getHostKey();
  }

  var sftpConnection = getSFTPConnection(username, passwordGuid, restrictToDomains, restrictToScriptIds, hostKey, hostKeyType, port, directory);
  var downloadedFile = sftpConnection.download({
    filename: filename
  }).getContents();
  log.debug('hasil', downloadedFile);

  context.response.write('File berhasil di-download.');
}

function getPasswordGuid() {
        passwordGuid = password
  }
  
  function getHostKey() {
    var myUrl = HOST_KEY_TOOL_URL + url + "&port=" + port + "&type=" + hostKeyType;
    var theResponse = HTTPSMODULE.get({url: myUrl}).body;
    log.debug('hostkey', theResponse)
    
  }
  

function getSFTPConnection(username, passwordGuid, restrictToDomains, restrictToScriptIds, hostKey, hostKeyType, port, directory) {
  var preConnectionObj = {
    username: username,
    passwordGuid: passwordGuid,
    restrictToDomains: restrictToDomains,
    restrictToScriptIds: restrictToScriptIds,
    hostKey: hostKey,
    hostKeyType: hostKeyType,
    port: port,
    directory: directory
  };

  var connectionObj = SFTPMODULE.createConnection(preConnectionObj);
  return connectionObj;
}
