export class AudioEnvironment {
  constructor(){this.context=null;this.master=null;this.ambience=null;this.music=null;this.started=false;this.settings={masterVolume:80,ambienceVolume:70,musicVolume:0};}
  start(){
    if(this.started){if(this.context&&this.context.state==='suspended')this.context.resume();return;}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    try{
      this.context=new AC();this.master=this.context.createGain();this.ambience=this.context.createGain();this.music=this.context.createGain();
      this.ambience.connect(this.master);this.music.connect(this.master);this.master.connect(this.context.destination);
      const size=this.context.sampleRate*3,buffer=this.context.createBuffer(1,size,this.context.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*0.12;
      const noise=this.context.createBufferSource();noise.buffer=buffer;noise.loop=true;
      const filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=360;noise.connect(filter);filter.connect(this.ambience);noise.start();
      const a=this.context.createOscillator(),b=this.context.createOscillator(),f=this.context.createBiquadFilter();
      a.type='sine';b.type='sine';a.frequency.value=110;b.frequency.value=164.81;f.type='lowpass';f.frequency.value=420;
      a.connect(f);b.connect(f);f.connect(this.music);a.start();b.start();this.started=true;this.applySettings(this.settings);
    }catch(e){console.warn('Ambient audio is unavailable:',e);}
  }
  applySettings(s){this.settings=s;if(!this.context)return;this.master.gain.setTargetAtTime(s.masterVolume/100,this.context.currentTime,0.08);this.ambience.gain.setTargetAtTime(s.ambienceVolume/100*0.14,this.context.currentTime,0.08);this.music.gain.setTargetAtTime(s.musicVolume/100*0.045,this.context.currentTime,0.08);}
  pause(){if(this.context&&this.context.state==='running')this.context.suspend();}
}