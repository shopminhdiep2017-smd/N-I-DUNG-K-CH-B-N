import json,sys,subprocess,glob,wave,numpy as np
S=sys.argv[1]; U="/root/.claude/uploads/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a"
V0=glob.glob(U+"/b93700de*.mp4")[0]
CFR=S+"/cfr_b93700de.mp4"
import os
if not os.path.exists(CFR): subprocess.run(["ffmpeg","-v","error","-y","-i",V0,"-vf","fps=30","-c:v","libx264","-preset","slow","-crf","10","-pix_fmt","yuv420p","-an",CFR],check=True)
V=CFR; M=glob.glob(U+"/4f6d2362*.mp3")[0]
DUR=61.66; MUS=0.11; Y=63; CUTS=[]
iv=json.load(open(S+"/v21/seg.json"))["iv"]
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
# frame-accurate segment bounds (30fps) so lips stay in sync
k=[[round(a*30)/30,round(b*30)/30] for a,b in k]; TOT=sum(b-a for a,b in k)
print("segments",len(k),"total",round(TOT,2))
WINo=[(2.3,4.4),(17.6,24.35),(29.3,31.4),(37.5,52.9)]
IMG="/tmp/claude-0/-home-user-N-I-DUNG-K-CH-B-N/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a/images/11.jpg"
PT=None
WIN=[(nt(a),nt(b)) for a,b in WINo]
CL=[('prod',WIN[0][0])]
w=wave.open(S+"/v21/clean.wav"); sr=w.getframerate(); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)
if w.getnchannels()>1: x=x.reshape(-1,w.getnchannels()).mean(1)
f=int(0.012*sr); ramp=np.linspace(0,1,f,dtype=np.float32); parts=[]
for a,b in k:
  seg=x[int(round(a*sr)):int(round(b*sr))].copy(); seg[:f]*=ramp; seg[-f:]*=ramp[::-1]; parts.append(seg)
y=np.concatenate(parts).clip(-32768,32767).astype(np.int16)
o=wave.open(S+"/v21/voice_edit.wav","wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes(y.tobytes()); o.close()
n=len(k)
args=["ffmpeg","-v","error","-y","-i",V,"-i",S+"/v21/voice_edit.wav","-i",M]
for a,b in WIN: args+=["-loop","1","-framerate","30","-t",f"{b+0.5:.2f}","-i",IMG]
fc=["".join(f"[0:v]trim=start_frame={round(a*30)}:end_frame={round(b*30)},setpts=PTS-STARTPTS[v{i}];" for i,(a,b) in enumerate(k))+"".join(f"[v{i}]" for i in range(n))+f"concat=n={n}:v=1:a=0[b0]"]
prev="b0"
for i,(st,en) in enumerate(WIN):
  fc.append(f"[{3+i}:v]scale=266:178:force_original_aspect_ratio=increase,crop=266:178,scale=in_color_matrix=bt601:out_color_matrix=bt709,pad=272:184:3:3:white,format=yuva420p,fade=in:st={st:.2f}:d=0.3:alpha=1,fade=out:st={en-0.3:.2f}:d=0.3:alpha=1[k{i}]")
  fc.append(f"[{prev}][k{i}]overlay=x=(W-w)/2:y={Y}:enable='between(t,{st:.2f},{en:.2f})'[q{i}]"); prev=f"q{i}"
PT=WIN[0][0]; FB=S+"/fonts/BeVietnamPro-SemiBold.ttf"; E=f"enable='gte(t,{PT:.2f})'"
fc.append(f"[{prev}]drawbox=x=0:y=ih-44:w=iw:h=44:color=black@0.55:t=fill:{E},drawtext=fontfile={FB}:text='Thực phẩm này không phải là thuốc và không có':fontsize=13:fontcolor=white:x=(w-tw)/2:y=h-38:{E},drawtext=fontfile={FB}:text='tác dụng thay thế thuốc chữa bệnh.':fontsize=13:fontcolor=white:x=(w-tw)/2:y=h-20:{E}[vout]")
fc.append("[1:a]acompressor=threshold=-22dB:ratio=2:attack=15:release=200,loudnorm=I=-17:TP=-1.5:LRA=9,aresample=48000[vo]")
fc.append(f"[2:a]atrim=0:{TOT:.2f},asetpts=PTS-STARTPTS,aresample=48000,volume={MUS},afade=t=in:d=1.5,afade=t=out:st={TOT-2:.2f}:d=2[m]")
fc.append("[vo][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.9[aout]")
subprocess.run(args+["-filter_complex",";\n".join(fc),"-map","[vout]","-map","[aout]","-t",f"{TOT:.3f}","-c:v","libx264","-preset","slow","-crf","16","-pix_fmt","yuv420p","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-color_range","tv","-c:a","aac","-b:a","192k","-movflags","+faststart",S+"/Video_ThuocMoMauQ10_ban_2.mp4"],check=True)
