import json,sys,difflib,subprocess,unicodedata,glob
S=sys.argv[1]; V=glob.glob("/root/.claude/uploads/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a/1de51183*.mp4")[0]
M=glob.glob("/root/.claude/uploads/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a/fbef8c43*.mp3")[0]
asr=json.load(open(S+"/v2/asr.json")); iv=json.load(open(S+"/v2/seg.json"))["iv"]
DUR=83.86; CUTS=[(27.50,29.22),(34.40,36.10),(67.5,68.2)]
# keep = padded speech intervals minus cuts
k=[]
for a,b in iv:
  a,b=max(0,a-0.1),min(DUR,b+0.12)
  if k and a<=k[-1][1]: k[-1][1]=max(k[-1][1],b)
  else: k.append([a,b])
def sub(segs,c):
  out=[]
  for a,b in segs:
    if b<=c[0] or a>=c[1]: out.append([a,b]); continue
    if a<c[0]: out.append([a,c[0]])
    if b>c[1]: out.append([c[1],b])
  return out
for c in CUTS: k=sub(k,c)
k=[x for x in k if x[1]-x[0]>0.05]
def nt(t):
  acc=0
  for a,b in k:
    if t<a: return acc
    if t<=b: return acc+t-a
    acc+=b-a
  return acc
TOT=sum(b-a for a,b in k)
inside=lambda t: any(a<=t<=b for a,b in k) and not any(c0<=t<c1 for c0,c1 in CUTS)
# ASR words
aw=[]
for o in asr:
  for tok,t in zip(o["tokens"],o["ts"]):
    if tok.startswith(" ") or not aw or aw[-1][2]!=id(o): aw.append([tok.strip(),t,id(o),o["end"]])
    else: aw[-1][0]+=tok
aw=[w for w in aw if inside(w[1])]
norm=lambda s: unicodedata.normalize("NFC",s.lower().strip(".,:;?!"))
raw=open(S+"/v2/script.txt").read().split(); cw=[];brk=set()
for w in raw:
  if w=="/": brk.add(len(cw)-1)
  else: cw.append(w)
sm=difflib.SequenceMatcher(None,[norm(w[0]) for w in aw],[norm(w) for w in cw],autojunk=False)
tm=[None]*len(cw)
for blk in sm.get_matching_blocks():
  for j in range(blk.size): tm[blk.b+j]=aw[blk.a+j][1]
# interpolate unmatched
idx=[i for i,t in enumerate(tm) if t is not None]
for i in range(len(cw)):
  if tm[i] is None:
    p=max([j for j in idx if j<i],default=None); n=min([j for j in idx if j>i],default=None)
    if p is None: tm[i]=tm[n]-0.2*(n-i)
    elif n is None: tm[i]=tm[p]+0.25*(i-p)
    else: tm[i]=tm[p]+(tm[n]-tm[p])*(i-p)/(n-p)
print("matched",len(idx),"of",len(cw))
W=[[w,nt(t)] for w,t in zip(cw,tm)]
ends=[]
for i,(w,t) in enumerate(W):
  nx=W[i+1][1] if i+1<len(W) else t+0.5
  ends.append(min(nx,t+0.7) if nx-t>0.05 else t+0.1)
# lines: break at "/" or sentence end, max 8 words
lines=[];cur=[]
for i,w in enumerate(W):
  cur.append(i)
  if i in brk or w[0][-1] in ".?:" or len(cur)>=8 or i==len(W)-1: lines.append(cur);cur=[]
def ts(t): return f"0:{int(t//60):02d}:{t%60:05.2f}"
out=["[Script Info]","ScriptType: v4.00+","PlayResX: 1080","PlayResY: 1920","WrapStyle: 0","","[V4+ Styles]",
"Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
"Style: K,Be Vietnam Pro ExtraBold,66,&H0000E5FF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,6,2,2,70,70,430,1","","[Events]",
"Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
for j,L in enumerate(lines):
  st=W[L[0]][1]; en=ends[L[-1]]
  nx=W[lines[j+1][0]][1] if j+1<len(lines) else TOT
  parts=[]
  for q,i in enumerate(L):
    parts.append("{\\kf%d}%s"%(max(1,round((ends[i]-W[i][1])*100)),W[i][0]))
    if q+1<len(L):
      g=W[L[q+1]][1]-ends[i]
      if g>0.02: parts.append("{\\k%d}"%round(g*100))
  out.append(f"Dialogue: 0,{ts(st)},{ts(min(nx,en+0.6) if j+1<len(lines) else TOT)},K,,0,0,0,,"+" ".join(parts))
open(S+"/v2/karaoke.ass","w").write("\n".join(out)+"\n")
json.dump({"keep":k,"total":TOT},open(S+"/v2/keep.json","w"))
print("segments",len(k),"total",round(TOT,2))
if len(sys.argv)>2 and sys.argv[2]=="render":
  n=len(k); f=[]
  vs="".join(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}];" for i,(a,b) in enumerate(k))
  as_="".join(f"[1:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={b-a-0.015:.3f}:d=0.015[a{i}];" for i,(a,b) in enumerate(k))
  cat="".join(f"[v{i}][a{i}]" for i in range(n))+f"concat=n={n}:v=1:a=1[vc][ac]"
  fc=(vs+as_+cat+";[vc]scale=1080:1920:flags=lanczos,setsar=1,subtitles="+S+"/v2/karaoke.ass:fontsdir="+S+"/fonts[vout];"
   "[ac]deesser=i=0.4,equalizer=f=4500:t=h:w=4000:g=-3,acompressor=threshold=-22dB:ratio=2.5:attack=15:release=200,loudnorm=I=-19:TP=-2:LRA=9[vo];"
   f"[2:a]atrim=0:{TOT:.2f},volume=0.05,afade=t=in:d=2,afade=t=out:st={TOT-3:.2f}:d=3[m];"
   "[vo][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9[aout]")
  subprocess.run(["ffmpeg","-v","error","-y","-i",V,"-i",S+"/v2/clean.wav","-i",M,"-filter_complex",fc,"-map","[vout]","-map","[aout]","-t",f"{TOT:.2f}",
   "-c:v","libx264","-preset","medium","-crf","20","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-ar","48000","-movflags","+faststart",S+"/Video_Tim_Nao_ban_1.mp4"],check=True)
