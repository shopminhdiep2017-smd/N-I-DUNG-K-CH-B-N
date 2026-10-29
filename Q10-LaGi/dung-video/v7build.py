import json,sys,difflib,subprocess,unicodedata,glob
S=sys.argv[1]; V=glob.glob("/root/.claude/uploads/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a/1889aeab*.mp4")[0]
M=glob.glob("/root/.claude/uploads/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a/0bf720a9*.mp3")[0]
asr=json.load(open(S+"/v7/asr.json")); iv=json.load(open(S+"/v7/seg.json"))["iv"]
DUR=106.26; MUS=0.04; TEMPO=1.0; SC=1/TEMPO; CUTS=[(45.4,47.15),(64.4,65.4),(71.8,75.7),(83.3,86.95),(90.0,100.0)]
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
raw=open(S+"/v7/script.txt").read().split(); cw=[];brk=set()
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
  if i in brk or w[0][-1] in ".?:" or len(cur)>=10 or i==len(W)-1: lines.append(cur);cur=[]
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
open(S+"/v7/karaoke.ass","w").write("\n".join(out)+"\n")
RICH_T=nt(46.4)
print("Rich at",RICH_T)
json.dump({"keep":k,"total":TOT},open(S+"/v7/keep.json","w"))
print("segments",len(k),"total",round(TOT,2))

if len(sys.argv)>2 and sys.argv[2]=="render":
  import wave,numpy as np
  w=wave.open(S+"/v7/clean.wav"); sr=w.getframerate(); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)
  if w.getnchannels()>1: x=x.reshape(-1,w.getnchannels()).mean(1)
  f=int(0.012*sr); ramp=np.linspace(0,1,f,dtype=np.float32); parts=[]
  for a,b in k:
    seg=x[int(a*sr):int(b*sr)].copy(); seg[:f]*=ramp; seg[-f:]*=ramp[::-1]; parts.append(seg)
  y=np.concatenate(parts).clip(-32768,32767).astype(np.int16)
  o=wave.open(S+"/v7/voice_edit.wav","wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes(y.tobytes()); o.close()
  print("voice_edit",len(y)/sr)
  n=len(k); IMG="/tmp/claude-0/-home-user-N-I-DUNG-K-CH-B-N/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a/images/2.jpg"
  FB=S+"/fonts/BeVietnamPro-SemiBold.ttf"
  args=["ffmpeg","-v","error","-y","-i",V,"-i",S+"/v7/voice_edit.wav","-i",M,"-loop","1","-framerate","30","-t",f"{TOT+0.5:.2f}","-i",IMG]
  CL=[("q1",0.0),("q2",5.58),("q3",10.22),("q4",13.42),("q5",19.56),("q6",27.05),("q7",33.20)]
  for c,_ in CL: args+=["-i",f"{S}/v7/clips/{c}.mp4"]
  fc=["".join(f"[0:v]trim={a:.4f}:{b:.4f},setpts=PTS-STARTPTS[v{i}];" for i,(a,b) in enumerate(k))+"".join(f"[v{i}]" for i in range(n))+f"concat=n={n}:v=1:a=0,setpts=PTS*{SC:.5f}[vc]",
      "[vc]scale=1080:1920:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv,setsar=1,fps=30[b0]",
      f"[3:v]scale=600:-2:in_color_matrix=bt601:out_color_matrix=bt709,pad=iw+10:ih+10:5:5:white,format=yuva420p,fade=in:st={RICH_T:.2f}:d=0.4:alpha=1[img]",
      "[b0]null[o0]"]
  E=f"enable='gte(t,{RICH_T:.2f})'"
  fc.append(f"[o0]drawbox=x=0:y=ih-96:w=iw:h=96:color=black@0.55:t=fill:{E},"
   f"drawtext=fontfile={FB}:text='Thực phẩm này không phải là thuốc và không có':fontsize=30:fontcolor=white:x=(w-tw)/2:y=h-84:{E},"
   f"drawtext=fontfile={FB}:text='tác dụng thay thế thuốc chữa bệnh.':fontsize=30:fontcolor=white:x=(w-tw)/2:y=h-44:{E}[o1]")
  prev="o1"
  for i,(c,st) in enumerate(CL):
    en=CL[i+1][1] if i+1<len(CL) else RICH_T+0.4
    ch=f"[{4+i}:v]scale=600:400:in_color_matrix=bt601:out_color_matrix=bt709,pad=610:410:5:5:white,tpad=stop_mode=clone:stop_duration=2,setpts=PTS-STARTPTS+{st}/TB"
    if i==0: ch+=",format=yuva420p,fade=in:st=0:d=0.4:alpha=1"
    fc.append(ch+f"[k{i}]")
    fc.append(f"[{prev}][k{i}]overlay=x=(W-w)/2:y=145:eof_action=pass:enable='between(t,{st},{en:.2f})'[q{i}]"); prev=f"q{i}"
  fc.append(f"[{prev}][img]overlay=x=(W-w)/2:y=145:enable='lt(t,0)'[pimg]"); prev="pimg"
  fc.append(f"[{prev}]subtitles={S}/v7/karaoke.ass:fontsdir={S}/fonts[vout]")
  fc.append("[1:a]acompressor=threshold=-22dB:ratio=2:attack=15:release=200,loudnorm=I=-17:TP=-1.5:LRA=9,aresample=48000[vo]")
  fc.append(f"[2:a]atrim=0:{TOT:.2f},asetpts=PTS-STARTPTS,aresample=48000,volume={MUS},afade=t=in:d=1.5,afade=t=out:st={TOT-2.5:.2f}:d=2.5[m]")
  fc.append("[vo][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.9[aout]")
  subprocess.run(args+["-filter_complex",";\n".join(fc),"-map","[vout]","-map","[aout]","-t",f"{TOT:.2f}","-c:v","libx264","-preset","medium","-crf","20","-pix_fmt","yuv420p","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-color_range","tv","-c:a","aac","-b:a","192k","-movflags","+faststart",S+"/Video_Q10_LaGi_ban_1.mp4"],check=True)
