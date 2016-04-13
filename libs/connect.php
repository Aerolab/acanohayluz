<?php
ini_set('default_charset', 'utf-8');
ob_start("ob_gzhandler");

date_default_timezone_set('America/Argentina/Buenos_Aires');

require_once('libs/rb.php');
R::setup('mysql:host=localhost; dbname=acanohayluz','root','');
R::freeze(TRUE);

require_once('models.php');
