<?php

function echoJSONObject( $obj ) {
  echo json_encode($obj);
 }

$qstring = $_SERVER['QUERY_STRING'];

switch($qstring) {

   case '/login': 
ob_start();
print_r($_POST);
$text = ob_get_contents();
ob_end_clean();
    echoJSONObject([ 'error'=>'Params error', 'text' => $text ]);
    break;

   case '/login/stat': echoJSONObject([ 'loggedIn' => true ]);
    break;

   default: echoJSONObject([ 'error'=>'Unknown route '.$qstring ]);
     break;

 }


?>