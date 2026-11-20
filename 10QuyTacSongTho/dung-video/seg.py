import sys,wave,numpy as np,json
w=wave.open(sys.argv[1]); sr=w.getframerate(); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768
if w.getnchannels()>1: a=a.reshape(-1,w.getnchannels()).mean(1)
hop=sr//100; n=len(a)//hop
db=np.array([20*np.log10(np.sqrt((a[i*hop:(i+1)*hop]**2).mean())+1e-9) for i in range(n)])
sp=db>float(sys.argv[2])
iv=[];st=None
for i,v in enumerate(sp):
  if v and st is None: st=i
  if not v and st is not None:
    if i-st>=4: iv.append([st/100,i/100])
    st=None
if st is not None: iv.append([st/100,n/100])
json.dump({"iv":iv,"db":db.round(1).tolist()},open(sys.argv[3],"w"))
for x in iv:
  if any(lo<=x[1] and x[0]<=hi for lo,hi in [(26.5,31),(33.5,37.5)]): print([round(v,2) for v in x])
print(len(iv))
