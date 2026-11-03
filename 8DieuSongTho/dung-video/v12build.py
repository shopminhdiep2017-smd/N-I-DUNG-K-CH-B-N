import json,sys,subprocess,glob,wave,numpy as np
S=sys.argv[1]; U="/root/.claude/uploads/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a"
V=glob.glob(U+"/15a50fe2*.mp4")[0]; M=glob.glob(U+"/eb3d182e*.mp3")[0]
DUR=29.18; MUS=0.02; Y=65
iv=json.load(open(S+"/v12/seg.json"))["iv"]
k=[]
for a,b in iv:
  a,b=max(0,a-0.2),min(DUR,b+0.25)
  if k and a<=k[-1][1]: k[-1][1]=max(k[-1][1],b)
  else: k.append([a,b])
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
CLo=[("x0",0.0),("x1",2.6),("x2",5.4),("x3",8.45),("x4",11.8),("x5",14.7),("x6",17.7),("x7",20.95),("x8",24.2)]
CL=[(c,nt(t)) for c,t in CLo]
w=wave.open(S+"/v12/clean.wav"); sr=w.getframerate(); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)
if w.getnchannels()>1: x=x.reshape(-1,w.getnchannels()).mean(1)
f=int(0.012*sr); ramp=np.linspace(0,1,f,dtype=np.float32); parts=[]
for a,b in k:
  seg=x[int(round(a*sr)):int(round(b*sr))].copy(); seg[:f]*=ramp; seg[-f:]*=ramp[::-1]; parts.append(seg)
y=np.concatenate(parts).clip(-32768,32767).astype(np.int16)
o=wave.open(S+"/v12/voice_edit.wav","wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes(y.tobytes()); o.close()
n=len(k)
args=["ffmpeg","-v","error","-y","-i",V,"-i",S+"/v12/voice_edit.wav","-i",M]
for c,_ in CL: args+=["-i",f"{S}/v12/clips/{c}.mp4"]
fc=["".join(f"[0:v]trim={a:.4f}:{b:.4f},setpts=PTS-STARTPTS[v{i}];" for i,(a,b) in enumerate(k))+"".join(f"[v{i}]" for i in range(n))+f"concat=n={n}:v=1:a=0[b0]"]
prev="b0"
for i,(c,st) in enumerate(CL):
  en=CL[i+1][1] if i+1<len(CL) else TOT+1
  ch=f"[{3+i}:v]scale=266:178:flags=lanczos:in_color_matrix=bt601:out_color_matrix=bt709,pad=272:184:3:3:white,tpad=stop_mode=clone:stop_duration=3,setpts=PTS-STARTPTS+{st:.3f}/TB"
  if i==0: ch+=",format=yuva420p,fade=in:st=0:d=0.4:alpha=1"
  fc.append(ch+f"[k{i}]")
  fc.append(f"[{prev}][k{i}]overlay=x=(W-w)/2:y={Y}:eof_action=pass:enable='between(t,{st:.2f},{en:.2f})'[q{i}]"); prev=f"q{i}"
fc.append(f"[{prev}]null[vout]")
fc.append("[1:a]acompressor=threshold=-22dB:ratio=2:attack=15:release=200,loudnorm=I=-17:TP=-1.5:LRA=9,aresample=48000[vo]")
fc.append(f"[2:a]atrim=0:{TOT:.2f},asetpts=PTS-STARTPTS,aresample=48000,volume={MUS},afade=t=in:d=1.5,afade=t=out:st={TOT-2:.2f}:d=2[m]")
fc.append("[vo][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.9[aout]")
subprocess.run(args+["-filter_complex",";\n".join(fc),"-map","[vout]","-map","[aout]","-t",f"{TOT:.3f}","-c:v","libx264","-preset","slow","-crf","16","-pix_fmt","yuv420p","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-color_range","tv","-c:a","aac","-b:a","192k","-movflags","+faststart",S+"/Video_8DieuSongTho_ban_1.mp4"],check=True)
