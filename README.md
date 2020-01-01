By Mehmet Burak Dönmez
16050111016

The complete project is available at https://github.com/mburakdonmez/FretsOnCloud/  (direct download: https://codeload.github.com/mburakdonmez/FretsOnCloud/zip/master)

Master branch requires ssl keys so I recommend the no-ssl branch for local deployment https://github.com/mburakdonmez/FretsOnCloud/tree/no-ssl (direct download: https://codeload.github.com/mburakdonmez/FretsOnCloud/zip/no-ssl)



This project implements the project frets on fire (fofix) that is built with python, in webgl-three.js. (frets on fire: https://github.com/fofix/fofix)
In theory any song available for frets on fire, works with this project too, but not all of them are tested.

A demo is available at "[fretsoncloud.com](https://www.fretsoncloud.com/)"

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
