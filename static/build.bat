copy /b js\_cookies.js+js\_settings.js+js\_utils.js+js\_geolocate.js+js\_form.js+js\_mapa.js+js\_mapa_overlay.js js\scripts.base.js

copy /b js\scripts.base.js+js\scripts-embed.js js\scripts-embed.min.js
copy /b js\scripts.base.js+js\scripts.js js\scripts.min.js

java -jar %cd%\__tools\yuicompressor-2.4.8.jar "js\scripts-embed.min.js" -o "js\scripts-embed.min.js" --type js --charset UTF-8
java -jar %cd%\__tools\yuicompressor-2.4.8.jar "js\scripts.min.js" -o "js\scripts.min.js" --type js --charset UTF-8 

java -jar %cd%\__tools\yuicompressor-2.4.8.jar "embed\css\styles.css" -o "embed\css\styles.min.css" --type css --charset UTF-8 
java -jar %cd%\__tools\yuicompressor-2.4.8.jar "css\styles.css" -o "css\styles.min.css" --type css --charset UTF-8 