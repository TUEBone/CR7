"""Normalize user-provided MP3s with measured two-pass EBU R128 loudness.
Usage: python3 scripts/prepare_audio.py /path/to/upload-directory
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess,json,sys
root=Path(__file__).resolve().parents[1];source=Path(sys.argv[1]);dest=root/'assets/audio';dest.mkdir(exist_ok=True)
names=['shot','crowd','siuuu','song-1','song-2','song-3','song-4','song-5']
def run(item):
 index,name=item;src=next(source.glob(f'{index+1}-*.mp3'));out=dest/(name+'.mp3')
 prefix='volume=30dB,alimiter=limit=0.2:level=false:attack=1:release=20,' if name=='shot' else ''
 measured=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(src),'-af',prefix+'loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
 m=json.JSONDecoder().raw_decode(measured[measured.rfind('{'):])[0];f=prefix+'loudnorm=I=-18:TP=-1.5:LRA=11:linear=true:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:print_format=json'.format(**m)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-af',f,'-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','160k','-map_metadata','-1',str(out)],check=True)
 verified=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(out),'-af','loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
 v=json.JSONDecoder().raw_decode(verified[verified.rfind('{'):])[0]
 if not -19<=float(v['input_i'])<=-17 or float(v['input_tp'])>-1:raise RuntimeError(f'Audio außerhalb der Zielpegel: {name}')
 print(name,src.name,'output LUFS',v['input_i'],flush=True)
 return name,{'source':src.name,'analysisLUFS':float(m['input_i']),'preprocessing':prefix,'outputLUFS':float(v['input_i']),'outputDBTP':float(v['input_tp']),'targetLUFS':-18,'truePeakLimitDBTP':-1.5}
with ThreadPoolExecutor(max_workers=3) as pool:report=dict(pool.map(run,enumerate(names)))
(dest/'loudness.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
