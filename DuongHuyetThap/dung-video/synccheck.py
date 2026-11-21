import sys,json,subprocess,numpy as np
S,keepf,src,out=sys.argv[1:5]
DUR=float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",out],capture_output=True,text=True).stdout)

def frames(f,ss,n):
  r=subprocess.run(["ffmpeg","-v","error","-ss",f"{ss:.3f}","-i",f,"-frames:v",str(n),"-vf","crop=480:420:0:200,scale=96:84,format=gray","-f","rawvideo","-"],capture_output=True).stdout
  return np.frombuffer(r,np.uint8).reshape(-1,84,96).astype(float)
for tq in [0.2,0.4,0.6,0.8,0.95]:
  t=DUR*tq; o=frames(out,t,1)[0]
  # find source time with this frame: search whole source coarse then fine
  best=None
  srcdur=float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",src],capture_output=True,text=True).stdout)
  allf=frames(src,0,int(srcdur*30))
  d=((allf-o)**2).mean(axis=(1,2)); i=int(d.argmin())
  print(f"out {t:7.2f}s -> best source frame {i/30:7.2f}s (mse {d[i]:.1f})")
