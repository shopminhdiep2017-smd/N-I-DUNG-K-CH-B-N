import sys,json,urllib.request,urllib.parse,re,time,os
def get(u):
  for i in range(8):
    try: return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read()
    except urllib.error.HTTPError as e:
      if e.code==429: time.sleep(15*(i+1)); continue
      raise
  raise SystemExit('rate limited')
OUT=sys.argv[1]; UA={"User-Agent":"VideoEditTool/1.0 (https://claude.ai/code; personal video editing) python-urllib"}
Q=json.loads(sys.argv[2]); ok={"cc0","public domain","pd","cc by 2.0","cc by 3.0","cc by 4.0","cc by-sa 2.0","cc by-sa 3.0","cc by-sa 4.0","cc by 2.5","cc by-sa 2.5"}
cred=json.load(open(OUT+'/credits.json')) if os.path.exists(OUT+'/credits.json') else []
for key,q in Q.items():
  if os.path.exists(f'{OUT}/{key}.jpg'): continue
  u="https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode({"action":"query","format":"json","generator":"search","gsrsearch":q+" filetype:bitmap","gsrnamespace":6,"gsrlimit":15,"prop":"imageinfo","iiprop":"url|extmetadata|size"})
  time.sleep(4); d=json.loads(get(u))
  pages=sorted(d.get("query",{}).get("pages",{}).values(),key=lambda p:p.get("index",99))
  got=None
  for p in pages:
    ii=p["imageinfo"][0]; m=ii.get("extmetadata",{})
    lic=m.get("LicenseShortName",{}).get("value","").lower()
    if not any(lic.startswith(x) for x in ok): continue
    if ii["width"]<ii["height"] or ii["width"]<700 or ii.get("size",0)>9000000 or not ii["url"].split("?")[0].lower().endswith((".jpg",".jpeg",".png")): continue
    got=(p["title"],ii["url"].split("?")[0],lic,re.sub("<[^>]+>","",m.get("Artist",{}).get("value","")).strip()); break
  if not got: print("NONE",key); continue
  time.sleep(4); data=get(got[1])
  open(f"{OUT}/{key}.jpg","wb").write(data); cred.append({"file":key,"title":got[0],"license":got[2],"author":got[3]}); print("ok",key,got[0],got[2])
json.dump(cred,open(OUT+"/credits.json","w"),ensure_ascii=False,indent=1)
