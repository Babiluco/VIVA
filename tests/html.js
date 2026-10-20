const fs=require('fs'),path=require('path');
module.exports=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8')
 .replace(/<script src="(voz\/[^"\s]+)"><\/script>/g,(_,p)=>'<script>'+fs.readFileSync(path.join(__dirname,'..',p),'utf8')+'</script>')
 .replace('<script src="pwa.js" defer></script>','')
 .replace('</body>','<script>'+fs.readFileSync(path.join(__dirname,'..','pwa.js'),'utf8')+'</script></body>');