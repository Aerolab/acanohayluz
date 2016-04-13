<!DOCTYPE html>
<html lang="es" prefix="og: http://ogp.me/ns#" xmlns:fb="http://ogp.me/ns/fb#">
<head>

  <meta charset="utf-8" />

  <title>Cortes de Luz en Buenos Aires y alrededores - #AcaNoHayLuz</title>
  <meta name="robots" content="noindex, follow" />
  <meta name="description" content="Si volvió o se fue la luz en tu cuadra o barrio ¡cargalo en el mapa! Armemos entre todos un reporte de los cortes de energía :)" />

  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui">
  <link rel="stylesheet" href="static/css/styles_embed.css?201312270400" />

  <meta property="og:title" content="Cortes de Luz en Buenos Aires y alrededores - #AcáNoHayLuz" />
  <meta property="og:description" content="#AcáNoHayLuz muestra los cortes de energía veraniegos. ¿Hay luz en tu casa? Chequealo en acanohayluz.com.ar" />
  <meta property="og:image" content="http://acanohayluz.com.ar/static/icons/facebook-share.png" />

  <link rel="shortcut icon" href="static/icons/favicon.ico" />
  <link rel="icon" href="static/icons/favicon.ico" />

  <link rel="apple-touch-icon" href="static/icons/apple-touch-icon.png">
  <link rel="apple-touch-icon" sizes="72x72" href="static/icons/apple-touch-icon-72x72.png">
  <link rel="apple-touch-icon" sizes="114x114" href="static/icons/apple-touch-icon-114x114.png">

  <script>
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    <?php if( strpos($_SERVER['SERVER_NAME'], 'acanohayluz.com.ar') !== FALSE ): ?>
    ga('create', 'UA-XXXXXXXX-1', 'acanohayluz.com.ar');
    ga('send', 'pageview');
    <?php endif; ?>
  </script>

</head>
<body>

<?php if( strpos($_SERVER['SERVER_NAME'], 'acanohayluz.com.ar') !== FALSE ): ?>
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<?php else: ?>
<script type="text/javascript" src="static/js/jquery-1.10.2.min.js"></script>
<?php endif; ?>

<?php if( strpos($_SERVER['SERVER_NAME'], 'acanohayluz.com.ar') !== FALSE ): ?>
<script type="text/javascript" src="//maps.googleapis.com/maps/api/js?key=AIzaSyAcnea0qz5mzAw6rrdz-wVz-ZGJ-T1AbAk&sensor=true&language=es&libraries=places"></script>
<?php else: ?>
<script type="text/javascript" src="//maps.googleapis.com/maps/api/js?sensor=false&language=es&libraries=places"></script>
<?php endif; ?>
<script type="text/javascript" src="static/js/scripts_embed.js?201312270400"></script>

<div id="container">


  <div id="app-mapa" class="panel-app">
    <div id="mapa"></div>
  </div>



  <div id="app-reportar" class="panel-app">
    <section id="reportar">
      <div class="contenido">

        <div class="title">
          <h1><a href="https://twitter.com/search?q=%23AcaNoHayLuz" target="_blank"><img src="static/css/images/logo-acanohayluz.png" alt="" width="51" height="43" /> #AcaNoHayLuz</a></h1>

          <h2>Construyamos un reporte de los cortes de luz :)</h2>
        </div>


        <form method="post" class="form" novalidate>
          <div class="direccion" id="direccion">
            <div class="input">
              <span class="icon lugar"></span>
              <input name="direccion" type="text" value="" placeholder="Ingresá Tu Dirección" required />
              <div class="error"></div>
            </div>
            <div class="ubicacion">
              <div class="lugar"></div>
              <a class="cerrar">x</a>
            </div>
          </div>

          <div class="adicional rango">
            <label class="estado-luz hay-luz">
              <div class="boton"><div class="carita"></div></div>
              Hay luz en mi cuadra!
              <input type="radio" name="estado" value="hay-luz" />
            </label>
            <label class="estado-luz corte-cuadra active">
              <div class="boton"><div class="carita"></div></div>
              Se cortó en<br/>mi cuadra
              <input type="radio" name="estado" value="corte-cuadra" checked="checked" />
            </label>
            <label class="estado-luz corte-amplio">
              <div class="boton"><div class="carita"></div></div>
              Se cortó en <br/>varias cuadras
              <input type="radio" name="estado" value="corte-amplio" />
            </label>
          </div>

          <div class="adicional horas">
            <div class="input">
              <span class="icon tiempo"></span>
              <input type="number" name="horas" value="" step="1" min="0" max="720" placeholder="Cuántas horas llevás sin luz?" required />
            </div>
          </div>

          <div style="display:none;">
            <input type="hidden" name="direccion_completa" value="" />
            <input type="hidden" name="direccion_id" value="" />
            <input type="hidden" name="zona_nombre" value="" />
            <input type="hidden" name="lat" value="" />
            <input type="hidden" name="long" value="" />
            <input type="hidden" name="zona_id" value="" />
          </div>

          <div class="enviar">
            <button class="btn disabled">Completa el formulario</button>
          </div>

        </form>


        <div class="box-gracias">
          <div class="mensaje">
            <h2>Gracias por tu<br/> colaboración!</h2>
          </div>

          <div class="box-social">
            <h4>Compartilo en las redes</h4>
            <a class="btn-social icon facebook" href="http://www.facebook.com/sharer/sharer.php?s=100&p[url]=http://acanohayluz.com.ar&p[images][0]=http://acanohayluz.com.ar/static/icons/facebook-share.png&p[title]=Estoy en casa y #AcaNoHayLuz&p[summary]=Mirá dónde más no hay en acanohayluz.com.ar" target="_blank"><span class="screenreader">Facebook</span></a>
            <a class="btn-social icon twitter" href="https://twitter.com/intent/tweet?original_referer=http%3A%2F%2Facanohayluz.com.ar%2F&text=Estoy en casa y %23AcaNoHayLuz. Mirá dónde más no hay en http://acanohayluz.com.ar" target="_blank"><span class="screenreader">Twitter</span></a>
            <a class="btn-social icon google" href="https://plus.google.com/share?url=http://acanohayluz.com.ar" target="_blank"><span class="screenreader">Google+</span></a>
          </div>
        </div>


        <div class="box-seguinos">
          <a href="http://twitter.com/AcaNoHayLuz" target="_blank">¿Volvió la luz? Seguinos en twitter</a>
        </div>
      </div>
    </section>

    <div id="share">
      <span class="share facebook">
        <span class="fb-share-button" data-href="http://acanohayluz.com.ar/" data-type="button_count"></span>
      </span>
      <span class="share twitter">
        <a href="https://twitter.com/share" class="twitter-share-button" data-text="#AcáNoHayLuz muestra los cortes de energía veraniegos. ¿Hay luz en tu casa? Chequealo en" data-lang="es">Tweet</a>
      </span>
      <span class="copyright">
        <span class="fondo-copyright">Creado por <a href="http://aerolab.com.ar" target="_blank">aerolab</a> y <a href="https://twitter.com/celestineia" target="_blank">tiny brain</a></span>
      </span>
    </div>
  </div>

</div>
</body>
</html>