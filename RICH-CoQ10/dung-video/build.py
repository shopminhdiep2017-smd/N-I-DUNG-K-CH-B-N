import json,sys,subprocess
S=sys.argv[1]; U="/root/.claude/uploads/286f3f7c-4b6d-5e93-8ed2-de10f1d62c0a"
import glob
V=glob.glob(U+"/2bde7d8d*.mp4")[0]; M=glob.glob(U+"/2e15d1d0*.mp3")[0]
C=json.load(open(S+"/cards/cards.json")); T=90.3; D=47.57
FR="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; FB=S+"/fonts/BeVietnamPro-SemiBold.ttf"
args=["ffmpeg","-v","error","-y","-i",V,"-i",M]
for c in C: args+=["-loop","1","-framerate","30","-t",str(c["e"]+0.1),"-i",f"{S}/cards/{c['id']}.png"]
f=["[0:v]split=3[a][b][c];[a]trim=0:27.45,setpts=PTS-STARTPTS[v0];[b]trim=29.80:61.20,setpts=PTS-STARTPTS[v1];[c]trim=start=78.70,setpts=PTS-STARTPTS[v2]",
"[0:a]asplit=3[x][y][z];[x]atrim=0:27.45,asetpts=PTS-STARTPTS,afade=t=out:st=27.42:d=0.03[a0];[y]atrim=29.80:61.20,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=31.37:d=0.03[a1];[z]atrim=start=78.70,asetpts=PTS-STARTPTS,afade=t=in:d=0.03[a2]",
"[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[vc][ac]",
"[vc]scale=1080:1920:flags=lanczos,setsar=1[base0]"]
prev="base0"
for i,c in enumerate(C):
  nxtnew = i+1<len(C) and C[i+1]["f"]==1
  ch=f"[{i+2}:v]format=rgba"
  if c["f"]: ch+=f",fade=in:st={c['s']}:d=0.3:alpha=1"
  if nxtnew: ch+=f",fade=out:st={c['e']-0.2:.2f}:d=0.2:alpha=1"
  f.append(ch+f"[c{i}]")
  y = f"40-45*max(0\\,1-(t-{c['s']})/0.3)" if c["f"] else "40"
  f.append(f"[{prev}][c{i}]overlay=x=(W-w)/2:y='{y}':eval=frame:enable='between(t,{c['s']},{c['e'] if i+1<len(C) else 999})'[o{i}]")
  prev=f"o{i}"
E=f"enable='gte(t,{D})'"
f.append(f"[{prev}]drawbox=x=0:y=ih-96:w=iw:h=96:color=black@0.55:t=fill:{E},"
 f"drawtext=fontfile={FB}:text='Thực phẩm này không phải là thuốc và không có':fontsize=30:fontcolor=white:x=(w-tw)/2:y=h-84:{E},"
 f"drawtext=fontfile={FB}:text='tác dụng thay thế thuốc chữa bệnh.':fontsize=30:fontcolor=white:x=(w-tw)/2:y=h-44:{E},"
 f"subtitles={S}/karaoke4.ass:fontsdir={S}/fonts[vout]")
f.append(f"[1:a]atrim=0:{T},volume=0.07,afade=t=in:d=2,afade=t=out:st=87.8:d=2.5[m]")
f.append("[ac]volume=1.1,afade=t=out:st=90.05:d=0.25[vo];[vo][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[aout]")
args+=["-filter_complex",";\n".join(f),"-map","[vout]","-map","[aout]","-t",str(T),"-c:v","libx264","-preset","medium","-crf","20","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart",S+"/Video_RICH_CoQ10_ban_5.mp4"]
subprocess.run(args,check=True)
