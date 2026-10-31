# Same Brain – project folder

Files
- samebrain-redesign.js  – home/host/join/lobby screens + Supabase lobby (put your URL + anon key in CFG at the top)
- samebrain-online.js    – synchronised online gameplay (load after the redesign file)
- fix_index.py           – builds index.html from your game HTML

Setup
1. Copy your game HTML (Same-Brain-Redesigned.html) into this folder.
2. Run:  python3 fix_index.py     -> creates index.html (removes the duplicate inline redesign code, adds the two script tags if missing)
3. Open samebrain-redesign.js and fill in:  const CFG={url:'https://xxxx.supabase.co',key:'your anon public key'};
   (Supabase: create a free project, Settings > API. Use the anon/public key only. No tables or SQL needed.)
4. Test locally:  python3 -m http.server 8000   then open http://localhost:8000
5. Deploy: drag this whole folder onto https://app.netlify.com/drop  (online play needs HTTPS)
   Only index.html and the two .js files are needed on the server; you can delete the rest.

Pass & Play works without Supabase.
