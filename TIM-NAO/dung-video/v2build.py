import json,sys,difflib,subprocess,unicodedata,glob
S=sys.argv[1]; V=glob.glob("/root/.claude/uploads/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a/1de51183*.mp4")[0]
M=glob.glob("/root/.claude/uploads/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a/fbef8c43*.mp3")[0]
asr=json.load(open(S+"/v2/asr.json")); iv=json.load(open(S+"/v2/seg.json"))["iv"]
DUR=83.86; MUS=0.15; TEMPO=0.85; SC=1/TEMPO; CUTS=[(27.50,29.54),(34.40,36.10),(67.5,68.2)]
# keep = padded speech intervals minus cuts
k=[]
for a,b in iv:
  a,b=max(0,a-0.2),min(DUR,b+0.25)
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
W=[[w,nt(t)*SC] for w,t in zip(cw,tm)]
TOT_IN=TOT; TOT=TOT*SC
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
ANCH=[("a1","muốn não"),("b1","dạo này"),("b2","đầu óc"),("b3","có nên"),("c1","nhưng thực"),("d1","não chỉ"),("d2","nhưng lại"),
("e1","và toàn"),("f0","cô chú anh chị có thể"),("f1","tim là"),("f2","còn mạch"),("f3","còn não"),("g1","khi mà"),("g2","mỡ máu cao"),("g3","hay đường"),
("h1","lâu ngày"),("h2","và suy"),("i0","tuy vậy"),("i1","có thể là thiếu"),("i2","căng thẳng"),("i3","rối loạn"),("i4","thiếu vi"),
("j1","không phải cứ"),("j2","nhưng chăm"),("k0","và cô chú"),("k1","thứ nhất"),("k2","thứ hai"),("k3","thứ ba"),("k4","và thứ tư")]
nw=[norm(w) for w in cw]; pos=0; states=[]
for cid,ph in ANCH:
  q=ph.split()
  j=next(j for j in range(pos,len(nw)) if nw[j:j+len(q)]==q); pos=j+1
  states.append({"id":cid,"s":round(max(0,W[j][1]-0.15),2)})
for n,x in enumerate(states):
  x["e"]=states[n+1]["s"] if n+1<len(states) else round(TOT,2)
  x["f"]=1 if n==0 or states[n-1]["id"][0]!=x["id"][0] else 0
json.dump(states,open(S+"/v2/states.json","w"))
if len(sys.argv)>2 and sys.argv[2]=="render":
  import wave,numpy as np
  w=wave.open(S+"/v2/clean.wav"); sr=w.getframerate(); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)
  if w.getnchannels()>1: x=x.reshape(-1,w.getnchannels()).mean(1)
  f=int(0.012*sr); ramp=np.linspace(0,1,f,dtype=np.float32); parts=[]
  for a,b in k:
    seg=x[int(a*sr):int(b*sr)].copy(); seg[:f]*=ramp; seg[-f:]*=ramp[::-1]; parts.append(seg)
  y=np.concatenate(parts).clip(-32768,32767).astype(np.int16)
  o=wave.open(S+"/v2/voice_edit.wav","wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes(y.tobytes()); o.close()
  print("voice_edit",len(y)/sr)
  C=json.load(open(S+"/v2/states.json")); n=len(k)
  args=["ffmpeg","-v","error","-y","-i",V,"-i",S+"/v2/voice_edit.wav","-i",M]
  for c in C: args+=["-loop","1","-framerate","30","-t",str(c["e"]+0.2),"-i",f"{S}/v2/cards/{c['id']}.png"]
  fc=["".join(f"[0:v]trim={a:.4f}:{b:.4f},setpts=PTS-STARTPTS[v{i}];" for i,(a,b) in enumerate(k))+"".join(f"[v{i}]" for i in range(n))+f"concat=n={n}:v=1:a=0,setpts=PTS*{SC:.5f}[vc]",
      "[vc]scale=1080:1920:flags=lanczos,setsar=1,fps=30[b0]"]
  prev="b0"
  for i,c in enumerate(C):
    last=i+1==len(C); nxtnew=not last and C[i+1]["f"]==1
    ch=f"[{i+3}:v]format=rgba"
    if c["f"]: ch+=f",fade=in:st={c['s']}:d=0.3:alpha=1"
    if nxtnew: ch+=f",fade=out:st={c['e']-0.2:.2f}:d=0.2:alpha=1"
    fc.append(ch+f"[c{i}]")
    y_=f"40-45*max(0\\,1-(t-{c['s']})/0.3)" if c["f"] else "40"
    fc.append(f"[{prev}][c{i}]overlay=x=(W-w)/2:y='{y_}':eval=frame:enable='between(t,{c['s']},{999 if last else c['e']})'[o{i}]"); prev=f"o{i}"
  fc.append(f"[{prev}]subtitles={S}/v2/karaoke.ass:fontsdir={S}/fonts[vout]")
  fc.append(f"[1:a]atempo={TEMPO},deesser=i=0.4,equalizer=f=4500:t=h:w=4000:g=-3,acompressor=threshold=-22dB:ratio=2.5:attack=15:release=200,loudnorm=I=-19:TP=-2:LRA=9,aresample=48000[vo]")
  fc.append(f"[2:a]atrim=0:{TOT:.2f},asetpts=PTS-STARTPTS,aresample=48000,volume={MUS},afade=t=in:d=1.5,afade=t=out:st={TOT-2.5:.2f}:d=2.5[m]")
  fc.append("[vo][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.9[aout]")
  subprocess.run(args+["-filter_complex",";\n".join(fc),"-map","[vout]","-map","[aout]","-t",f"{TOT:.2f}","-c:v","libx264","-preset","medium","-crf","20","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart",S+"/Video_Tim_Nao_ban_3_cham.mp4"],check=True)
