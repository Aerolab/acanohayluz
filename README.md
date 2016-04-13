# AcaNoHayLuz

AcaNoHayLuz es una aplicación web que recibe reportes sobre cortes de luz en una zona determinada. 

Fue desarrollada a partir de una serie de hackatones en diciembre de 2013, una época de muchos cortes de luz en Argentina, en particular en Capital Federal y Gran Buenos Aires. Eventualmente la plataforma se usó en Córdoba y otras ciudades del país. 

Luego de que se terminaran estos cortes, la app quedó sin mantenimiento. Creemos que hoy hubiéramos desarrollado un proyecto así de otra manera, pero ante la urgencia de una herramienta para visibilizar una problemática, optamos por una salida _rápida y sucia_, incompatible con nuestras prácticas actuales de desarrollo. Sentite libre de reimplementarla con un stack moderno.

## Acerca de la aplicación

La app fue desarrollada para atender una necesidad concreta: poder visibilizar la magnitud y el alcance de los cortes de luz en la ciudad, que comenzó como una inquietud de Celestineia. La aplicación fue planteada para ser corrida en un hosting económico con facilidad. Está armada en PHP crudo, con algunos scripts adicionales para actualizar el mapa y los reportes. Hay varios scripts y funciones que no sirven para nada también.

Como estaba planteado para correr en un shared hosting con mínima intervención, varias cosas que podrían ser resueltas con nginx o un sistema de caching fueron implementados con cron.

Lo mismo pasa con los mapas de estado de zonas, que son dibujados server-side (por tiles) y puestos como un overlay sobre Google Maps. Esto fue un hack para resolver cuestiones de performance en mobile, ya que la app no funcionaba en smartphones de gama media (en 2013) al dibujar las regiones como SVG, aún con polígonos de baja definición. Si bien la interfaz sufre un poco en consecuencia, con esta implementación el soporte mobile es aceptable.

### Instalación

Esta es una guía general de las tareas principales para levantar AcaNoHayLuz.

* *Instalá la DB MySQL*: Tenés la DB base para Argentina en `DB/db.sql`. La configuración está en `libs/connect.php`
* *Configurá las Zonas y Polígonos*: Esto requiere un poco más de trabajo, ya que hay que incluir los polígonos de cada Barrio/Provincia en formato JSON.
* *Configurá el dominio*: Todas las URLs figuran como `acanohayluz.com.ar`. Vas a tener que cambiarlas por el dominio correspondiente.
* *Configurá Google Analytics*: Tenés que cambiar las keys de index.php y embed.php por las tuyas (o quitar el tracking). Actualmente figura como `UA-XXXXXXXX-1`.
* *Configurá Facebook App ID*: Hay un App ID que se usa para Facebook y se reemplazó por `XXXXXXXXXXXXXXX`. Usá el tuyo para ganar acceso a los likes.
* *Configurá las Keys de Google Maps*: Registrá una cuenta developer en Google y obtené una Key de Google Maps. La vas a necesitar para el mapa principal.
* *Subí todo a un Hosting/Server*: Cualquier shared hosting con PHP5+ y MySQL anda lo más bien. Un VPS con nginx y caching es mucho más conveniente para picos de tráfico. No fue probado en Heroku.
* *Corré procesar_nuevas_zonas.php*: Procesa los polígonos de las zonas registradas y registra los tiles que deben dibujarse a la hora de armar los mapas.
* *Corré cachear_zonas.php*: Guarda las zonas de la DB en un JSON para el frontend. Se corre con cada actualización de las zonas.
* *Configurá los Cronjobs*: Detallados en la siguiente sección. Deben correr cada 5-15' dependiendo de la frecuencia que prefieras.

### CronJobs

Es recomendable correrlos uno atrás del otro ya que están puestos por orden recomendado de ejecución.

* *refrescar_metadata.php*: Actualiza el estado de cada área en función de los reportes y la duración de los mismos.
* *zona_update.php*: Recalcula el estado de cada barrio en función de los cortes.
* *cachear_reportes.php*: Separa los reportes en tiles para simplificar la carga de los mismos.
* *generar_tiles.php*: Dibuja los tiles del mapa con el color de estado de cada zona y zona de aplicación de los cortes. Esta task suele tomar bastante tiempo.

### Embed

Hay un redirect automático a una vista de embed para poder incluir el mapa como un widget en otros sitios. Esto fue un comportamiento emergente de los usuarios (ponían iframes apuntados al sitio) así que se hizo un _hotfix_ para mejorar la experiencia de uso al incluir el mapa en periódicos online.

### Twitter

Feature eliminada ya que resultaba muy molesta. Está cubierta con `twitter_status.php` y `twitter_update.php` y en `libs/__auth.php`.

## Tu propio AcaNoHayLuz

En `_docs/logo/` incluimos un SVG y un .ai con assets de la marca, para que puedas crear tu propia versión de AcaNoHayLuz, localizada. Si hacés un _fork_ de este repositorio, avisanos (o hacé un _pull request_) para que agreguemos tu plataforma en este documento.

## Créditos

AcaNoHayLuz fue desarrollado por [Aerolab](https://aerolab.co) a partir de la idea de [celestineia](https://twitter.com/celestineia)

## Licencia

AcaNoHayLuz es software libre. Se distribuye bajo [licencia MIT](https://opensource.org/licenses/mit-license.php).


