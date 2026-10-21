import json, sys
asr=json.load(open(sys.argv[1])); scr=json.load(open(sys.argv[2]))
CUTS=[(27.45,29.80),(61.20,78.70)]
def nt(t):
  s=0
  for a,b in CUTS:
    if t>=b: s+=b-a
  return t-s
def words(o):  # ASR word start times
  ws=[]
  for tok,t in zip(o["tokens"],o["ts"]):
    if tok.startswith(" ") or not ws: ws.append(t)
  return ws
allw=[]
for o in asr:
  key=next((k for k in scr if abs(float(k)-o["start"])<0.02),None)
  if key is None: continue
  raw=scr[key].split(); cw=[w for w in raw if w!="/"]; brk=set(); c=0
  for w in raw:
    if w=="/": brk.add(c-1)
    else: c+=1; aw=words(o); n=len(aw)
  for i,w in enumerate(cw):
    st=aw[min(n-1,round(i*n/len(cw)))] if len(cw)!=n else aw[i]
    allw.append([w,nt(st),None,key,i in brk])
  allw[-1][2]=nt(o["end"])
for i,w in enumerate(allw):
  nxt=allw[i+1][1] if i+1<len(allw) else w[1]+0.6
  if w[2] is None or w[2]>nxt: w[2]=nxt if nxt-w[1]<1.0 else w[1]+0.6
  w[2]=max(w[2],w[1]+0.08)
# group into lines: break at punctuation or 6 words
phr=[];cur=[]
for i,w in enumerate(allw):
  cur.append(w)
  if w[4] or w[0][-1] in ".," and len(cur)>=4 or i+1==len(allw) or allw[i+1][3]!=w[3]:
    phr.append(cur);cur=[]
lines=[]
for P in phr:
  k=-(-len(P)//10); n=len(P)
  for c in range(k): lines.append(P[c*n//k:(c+1)*n//k])
def ts(t):
  h=int(t//3600);m=int(t%3600//60);s=t%60;return f"{h}:{m:02d}:{s:05.2f}"
out=["[Script Info]","ScriptType: v4.00+","PlayResX: 480","PlayResY: 854","WrapStyle: 0","",
"[V4+ Styles]","Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
"Style: K,DejaVu Sans,25,&H0000E5FF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2.6,1.2,2,20,20,92,1","",
"[Events]","Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
for j,L in enumerate(lines):
  st=L[0][1]; en=L[-1][2]
  nxt=lines[j+1][0][1] if j+1<len(lines) else en+1
  end=min(nxt, en+0.8)
  parts=[];t=st
  for w in L:
    parts.append("{\\kf%d}%s"%(max(1,round((w[2]-w[1])*100)),w[0]))
    gap=(L[L.index(w)+1][1]-w[2]) if L.index(w)+1<len(L) else 0
    if gap>0.02: parts.append("{\\k%d}"%round(gap*100))
  out.append(f"Dialogue: 0,{ts(st)},{ts(end)},K,,0,0,0,,"+" ".join(parts))
open(sys.argv[3],"w").write("\n".join(out)+"\n")
rich=[w for w in allw if w[0]=="Rich"][0]
print("Rich at",round(rich[1],2),"lines",len(lines),"total",nt(111.17))
