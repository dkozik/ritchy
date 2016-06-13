<?php

function echoJSONObject( $obj ) {
  echo json_encode($obj);
 }

function jsonError( $code, $text ) {
  echoJSONObject([ 'code'=>$code, 'error'=>$text ]);
 }

function jsonOk( $code, $params ) {
  $params['code']=$code;
  echoJSONObject($params);
 }

function sessionExpired() {
  $res = true;
  if (isset($_SESSION['atime'])) {
     $res = ((new DateTime)->getTimestamp() - $_SESSION['atime']) > 600000; // 10 minutes
   }
  return $res;
 }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8080');

$qstring = $_SERVER['QUERY_STRING'];
session_start();
$sessionId = session_id();

switch($qstring) {

   case '/login':
    if (isset($_POST['login']) && isset($_POST['password'])) {
      if ($_POST['login']==='admin' && $_POST['password']==='123') {
        $_SESSION['counter'] = 0;
        $_SESSION['start'] = (new DateTime)->getTimestamp();
        $_SESSION['atime'] = $_SESSION['start']; // Last access timestamp
        $_SESSION['loggedin'] = true;
        jsonOk(1, ['user'=>$_POST['login']]);
       } else {
        jsonError(0, 'Wrong login or password');
       }
     } else {
      jsonError(-1, 'Login or password not found in POST parameters');
     }
    break;

   case '/login/stat':
    if (sessionExpired()) {
      session_abort();
      jsonOk(0, [ 'loggedIn' => false ]);
     } else {
      jsonOk(1, [ 'loggedIn' => (isset($_SESSION['loggedin'])?$_SESSION['loggedin']:false) ]);
     }
    break;

   case '/logout':
    if (strlen($sessionId)>0 && isset($_SESSION['loggedin']) && $_SESSION['loggedin']==true) {
       jsonOk(1, []);
     } else {
       jsonError(-1, 'Session not found.');
     }
    session_abort();
    break;

   default:
     jsonError(0, 'Unknown route '.$qstring);
     break;

 }


?>