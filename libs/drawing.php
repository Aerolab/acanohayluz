<?php

function hex2rgb($hex) {
   $hex = str_replace("#", "", $hex);

   if(strlen($hex) == 3) {
      $r = hexdec(substr($hex,0,1).substr($hex,0,1));
      $g = hexdec(substr($hex,1,1).substr($hex,1,1));
      $b = hexdec(substr($hex,2,1).substr($hex,2,1));
   } else {
      $r = hexdec(substr($hex,0,2));
      $g = hexdec(substr($hex,2,2));
      $b = hexdec(substr($hex,4,2));
   }
   $rgb = array($r, $g, $b);
   return $rgb;
}


function imagelinethick($image, $x1, $y1, $x2, $y2, $color, $thick = 1)
{
  if ($thick == 1) {
    return imageline($image, $x1, $y1, $x2, $y2, $color);
  }
  $t = $thick / 2 - 0.5;
  if ($x1 == $x2 || $y1 == $y2) {
    return imagefilledrectangle($image, round(min($x1, $x2) - $t), round(min($y1, $y2) - $t), round(max($x1, $x2) + $t), round(max($y1, $y2) + $t), $color);
  }
  $k = ($y2 - $y1) / ($x2 - $x1); //y = kx + q
  $a = $t / sqrt(1 + pow($k, 2));
  $points = array(
    round($x1 - (1+$k)*$a), round($y1 + (1-$k)*$a),
    round($x1 - (1-$k)*$a), round($y1 - (1+$k)*$a),
    round($x2 + (1+$k)*$a), round($y2 - (1-$k)*$a),
    round($x2 + (1-$k)*$a), round($y2 + (1+$k)*$a),
  );
  imagefilledpolygon($image, $points, 4, $color);
  return imagepolygon($image, $points, 4, $color);
}
