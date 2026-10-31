#!/usr/bin/env python3
"""Run:  python3 fix_index.py [your-game.html]
With no argument it uses the only .html file in this folder (other than index.html).
Writes index.html with the old inline redesign block removed."""
import re,sys,glob
a=sys.argv[1] if len(sys.argv)>1 else None
if not a:
    c=[f for f in glob.glob('*.html') if f!='index.html']
    if len(c)!=1: sys.exit('Put exactly one game .html file in this folder, or pass its name.')
    a=c[0]
src=open(a,encoding='utf-8').read()
pat=re.compile(r'<script>\s*/\* Same Brain redesign layer, integrated into this standalone HTML file\. \*/.*?</script>\s*',re.S)
out,n=pat.subn('',src,count=1)
if n!=1: print('Note: no inline redesign block found; leaving the file as it is.')
for t in ('samebrain-redesign.js','samebrain-online.js'):
    if t not in out:
        out=out.replace('</body>','<script src="%s"></script>\n</body>'%t,1) if '</body>' in out else sys.exit('No </body> tag found')
open('index.html','w',encoding='utf-8').write(out);print('Wrote index.html from',a)
