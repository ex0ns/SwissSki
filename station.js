class Station {
  constructor(name, temp, snow_slopes, snow_station) {
    this.name = name;
    this.temp = temp;
    this.snow_slopes = snow_slopes;
    this.snow_station = snow_station;
  }
    
  toString() {
    return `${self.name} ${self.temp} ${self.snow_slopes} ${self.snow_station}`;
  }
    
}

module.exports = Station;
