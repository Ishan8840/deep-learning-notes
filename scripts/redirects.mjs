import fs from 'node:fs';
const notes=JSON.parse(fs.readFileSync('src/notes.json'));
for(const n of notes){const dir='dist/'+n.slug;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/index.html',`<!doctype html><meta charset="utf-8"><title>${n.title}</title><meta http-equiv="refresh" content="0;url=/deep-learning-notes/#/${n.slug}"><a href="/deep-learning-notes/#/${n.slug}">Read ${n.title}</a>`);}
