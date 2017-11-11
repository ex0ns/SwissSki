const emoji = require('node-emoji');
const moment = require('moment');

const THRESHOLD = 0.20;

class Station {
  constructor(name, temp, snow_slopes, snow_station, slopes, opening) {
    if(typeof name === 'string') {
      this.name = name;
      this.temp = parseInt(temp.replace('°', ''));
      this.snow_slopes = parseInt(snow_slopes) || 0;
      this.snow_station = parseInt(snow_station) || 0;
      if(slopes) {
        const splitted = slopes.split("\/");
        if(splitted.length = 2) {
          this.open_slopes = parseInt(splitted[0]) || 0;
          this.total_slopes = parseInt(splitted[1]) || 0;
        }
      }
      
      const mom = moment(opening, "DD.MM.YYYY");
      this.open = !mom.isValid();
    } else if(typeof name === "object") {
      const other = name;
      for (let p in other) { this[p] = other[p]; }
    } else throw new Exception("Invalid arguments");
  }
  
  toString() {
    return `${emoji.get(this.open ?  'white_check_mark' : 'x')} ${this.name} ${this.temp} ${this.snow_slopes}cm ${this.open_slopes}/${this.total_slopes}`;
  }
  
  static compare(station, other) {
    if(station.open && !other.open) return -1;
    else if(other.open && !station.open) return 1;
    
    if(!station.open_slopes && other.open_slopes) return 1;
    else if(!other.open_slopes && station.open_slopes) return -1;
    else if(!station.open_slopes && !other.open_slopes) return 0;
    
    const diff = (station.open_slopes / station.total_slopes) - (other.open_slopes / other.total_slopes);
    if(diff > THRESHOLD) return -1
    else if(diff < -THRESHOLD) return 1;
    
    if(station.snow_slopes > other.snow_slopes) return -1;
    return 0;
  }
  
}

module.exports = Station;
