This project implements the project fofix that is built with python, in webgl-three.js. (fofix: https://github.com/fofix/fofix)
In theory any song available for fofix, works with this project too, but not all of them are tested.

A demo is available at "fretsoncloud.com"

In order to run this project npm is required (12.14.0 is recommended).
A dedicated GPU is also recommended for better performance

Run "npm i" to install dependencies.
Run "npm run dev" to start web server.

This app uses :80 port by default, can be edited at "app.js"

After running the server open a decent browser with webgl support and head to "127.0.0.1",
main page shows the avaliable songs in "static/songs" folder. Each song has its own folder.
There are 4 songs available in this package, but any song available at "http://fretsonfire.wikidot.com/custom-songs" should work.
Because fofix is too old, most of the links at the wikidot are unfortunately dead now, but there are working ones (especially the popular songs).
I have a 1.04 GB, 70 songs archive available for download at "https://drive.google.com/open?id=1P_jJvwGHzF--qkdZK3yrhobiib1_J6CD"


If having performance issues click to the fps window on the top left corner to switch to latency view. It helps but the reason is unknown.
If using a laptop with a dedicated GPU make sure to run the browser with the dedicated GPU
