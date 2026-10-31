# Same Brain – project folder

Files
- index.html             – the game engine: question banks, modes, scoring, Pass & Play screens, results
- samebrain-redesign.js  – home / host / join / lobby screens and online rooms over Supabase Realtime (URL + anon key in CFG at the top)
- samebrain-online.js    – synchronised online gameplay, rematches and host hand-over (load after the redesign file)
- manifest.webmanifest, sw.js, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
                         – "Add to Home Screen" / install support and offline Pass & Play

Online play uses Supabase Realtime (Presence + Broadcast) only. No tables, SQL or Edge Functions are needed.
The host's device is the authority for its room (roster, capacity, removals, settings). This is client-side
authority: it stops normal app use from breaking the rules, but it is not server-side security.

Online player limits: Classic 3–12, Most Likely 3–12, Know Me 3–10, Split 3–11. Pass & Play: 3–12.

Test locally:  python3 -m http.server 8000   then open http://localhost:8000
Deploy (upload every file listed above): drag this folder onto https://app.netlify.com/drop, or upload the three files to your existing Netlify site
(online play needs HTTPS). Pass & Play works without Supabase.

Debugging online play: open the browser console (F12); every online step is logged with a [SameBrain] prefix.

Planned (not built yet)
- Server-side room authority: a small Supabase Edge Function (plus a table) that issues and checks room/host
  tokens, so kicks, capacity limits and host-only actions can't be bypassed with developer tools.
  Today these rules are enforced by the host's device only.
