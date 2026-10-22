import sys, json, wave, numpy as np, sherpa_onnx
M=sys.argv[1]+"/sherpa-onnx-zipformer-vi-int8-2025-04-20/"
rec=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=M+"encoder-epoch-12-avg-8.int8.onnx",decoder=M+"decoder-epoch-12-avg-8.onnx",joiner=M+"joiner-epoch-12-avg-8.int8.onnx",tokens=M+"tokens.txt",num_threads=4,decoding_method="modified_beam_search")
w=wave.open(sys.argv[2]); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
cfg=sherpa_onnx.VadModelConfig(); cfg.silero_vad.model=sys.argv[1]+"/silero_vad.onnx"; cfg.silero_vad.min_silence_duration=0.25; cfg.silero_vad.max_speech_duration=12; cfg.sample_rate=16000
vad=sherpa_onnx.VoiceActivityDetector(cfg,buffer_size_in_seconds=200)
out=[]
def run():
  while not vad.empty():
    seg=vad.front; st=seg.start/16000
    s=rec.create_stream(); s.accept_waveform(16000,np.array(seg.samples)); rec.decode_stream(s); r=s.result
    out.append({"start":st,"end":st+len(seg.samples)/16000,"text":r.text,"tokens":r.tokens,"ts":[st+t for t in r.timestamps]})
    vad.pop()
for i in range(0,len(a),512):
  vad.accept_waveform(a[i:i+512]); run()
vad.flush(); run()
json.dump(out,open(sys.argv[3],"w"),ensure_ascii=False,indent=0)
for o in out: print(f"[{o['start']:6.2f}-{o['end']:6.2f}] {o['text']}")
