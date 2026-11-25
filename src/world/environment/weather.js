export class Weather{
 constructor(){this.time=17.4;this.windSpeed=4.2;this.windDirection=0.6;this.elapsed=0;}
 update(dt){this.elapsed+=dt;this.time=(this.time+dt*0.0016)%24;this.windSpeed=3.4+Math.sin(this.elapsed*0.035)*1.1+Math.sin(this.elapsed*0.011)*0.55;this.windDirection=Math.sin(this.elapsed*0.018)*0.8;}
 advance(hours){this.time=(this.time+hours)%24;}
}