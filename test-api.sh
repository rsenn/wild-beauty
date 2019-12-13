

 curl -v --cookie-jar cookies.txt --header 'Content-Type: application/json' --data '{"username":"roman","password":"r4eHuJ"}'   http://localhost:5555/api/login

 curl  -v --cookie cookies.txt http://localhost:5555/api/logout
 curl  -v --cookie cookies.txt http://localhost:5555/api/image/upload --upload-file "test.jpg"

