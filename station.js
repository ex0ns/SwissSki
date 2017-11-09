class Station {
  constructor(name, temp, snow_slopes, snow_station, slopes) {
    this.name = name;
    this.temp = temp;
    this.snow_slopes = snow_slopes;
    this.snow_station = snow_station;
    if(slopes) {
      const splitted = slopes.split("\/");
      if(splitted.length = 2) {
        this.open_slopes = splitted[0];
        this.total_slopes = splitted[1];
      }
    }

  }
    
  toString() {
    return `${this.name} ${this.temp} ${this.snow_slopes} ${this.snow_station} ${this.open_slopes}/${this.total_slopes}`;
  }
    
}

module.exports = Station;
